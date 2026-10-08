const express = require('express');
const pool = require('../db/pool');
const { candidateSchema, STATUSES } = require('../validators/candidate');
const { HttpError } = require('../middleware/errors');

const router = express.Router();

const COLUMNS = `
  id, full_name, email, phone, date_of_birth, gender, city, qualification,
  experience_years, position_applied, skills, expected_salary, status, notes,
  is_deleted, deleted_at, created_at, updated_at`;

const SORTABLE = {
  name: 'full_name',
  created: 'created_at',
  experience: 'experience_years',
  status: 'status',
  city: 'city',
};

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid candidate id');
  return id;
}

function normaliseSkills(skills) {
  const seen = new Set();
  return skills.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * GET /api/candidates
 * Query: search, status, view=active|archived, sort, order, page, limit
 * The grid only ever shows rows where is_deleted = false (view=active).
 */
router.get('/', async (req, res) => {
  const {
    search = '',
    status = '',
    view = 'active',
    sort = 'created',
    order = 'desc',
  } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const where = ['is_deleted = $1'];
  const params = [view === 'archived'];

  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    const p = `$${params.length}`;
    where.push(
      `(full_name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR city ILIKE ${p}
        OR position_applied ILIKE ${p} OR array_to_string(skills, ' ') ILIKE ${p})`
    );
  }
  if (status && STATUSES.includes(status)) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  const sortCol = SORTABLE[sort] || 'created_at';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';
  const whereSql = where.join(' AND ');

  const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM candidates WHERE ${whereSql}`, params);
  const total = countRes.rows[0].total;

  const dataRes = await pool.query(
    `SELECT ${COLUMNS} FROM candidates
      WHERE ${whereSql}
      ORDER BY ${sortCol} ${sortDir}, id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    data: dataRes.rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

/** GET /api/candidates/stats — dashboard counters */
router.get('/stats', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE NOT is_deleted)::int                                   AS total,
      COUNT(*) FILTER (WHERE NOT is_deleted AND status = 'Applied')::int            AS applied,
      COUNT(*) FILTER (WHERE NOT is_deleted AND status = 'Shortlisted')::int        AS shortlisted,
      COUNT(*) FILTER (WHERE NOT is_deleted AND status = 'Interviewing')::int       AS interviewing,
      COUNT(*) FILTER (WHERE NOT is_deleted AND status = 'Selected')::int           AS selected,
      COUNT(*) FILTER (WHERE NOT is_deleted AND status = 'Rejected')::int           AS rejected,
      COUNT(*) FILTER (WHERE NOT is_deleted AND created_at > NOW() - INTERVAL '7 days')::int AS this_week,
      COUNT(*) FILTER (WHERE is_deleted)::int                                       AS archived
    FROM candidates`);
  res.json(rows[0]);
});

/** GET /api/candidates/:id */
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM candidates WHERE id = $1`, [id]);
  if (!rows.length) throw new HttpError(404, 'Candidate not found');
  res.json(rows[0]);
});

/** POST /api/candidates — register a new candidate */
router.post('/', async (req, res) => {
  const c = candidateSchema.parse(req.body);
  const { rows } = await pool.query(
    `INSERT INTO candidates
      (full_name, email, phone, date_of_birth, gender, city, qualification,
       experience_years, position_applied, skills, expected_salary, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING ${COLUMNS}`,
    [
      c.full_name, c.email, c.phone, c.date_of_birth, c.gender, c.city, c.qualification,
      c.experience_years, c.position_applied, normaliseSkills(c.skills), c.expected_salary,
      c.status, c.notes,
    ]
  );
  res.status(201).json(rows[0]);
});

/** PUT /api/candidates/:id — edit an active candidate */
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const c = candidateSchema.parse(req.body);
  const { rows } = await pool.query(
    `UPDATE candidates SET
       full_name = $1, email = $2, phone = $3, date_of_birth = $4, gender = $5, city = $6,
       qualification = $7, experience_years = $8, position_applied = $9, skills = $10,
       expected_salary = $11, status = $12, notes = $13, updated_at = NOW()
     WHERE id = $14 AND is_deleted = FALSE
     RETURNING ${COLUMNS}`,
    [
      c.full_name, c.email, c.phone, c.date_of_birth, c.gender, c.city, c.qualification,
      c.experience_years, c.position_applied, normaliseSkills(c.skills), c.expected_salary,
      c.status, c.notes, id,
    ]
  );
  if (!rows.length) throw new HttpError(404, 'Candidate not found');
  res.json(rows[0]);
});

/**
 * DELETE /api/candidates/:id — SOFT delete.
 * The row stays in the database; it is only flagged so the grid hides it.
 */
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(
    `UPDATE candidates SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING id, full_name, is_deleted, deleted_at`,
    [id]
  );
  if (!rows.length) throw new HttpError(404, 'Candidate not found or already removed');
  res.json({ message: 'Candidate removed from the list', candidate: rows[0] });
});

/** PATCH /api/candidates/:id/restore — bring a hidden candidate back to the grid */
router.patch('/:id/restore', async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(
    `UPDATE candidates SET is_deleted = FALSE, deleted_at = NULL, updated_at = NOW()
      WHERE id = $1 AND is_deleted = TRUE
      RETURNING ${COLUMNS}`,
    [id]
  );
  if (!rows.length) throw new HttpError(404, 'Candidate not found in archive');
  res.json(rows[0]);
});

module.exports = router;
