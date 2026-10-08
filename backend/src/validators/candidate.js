const { z } = require('zod');

const STATUSES = ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'];
const GENDERS = ['Male', 'Female', 'Other'];

const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

const candidateSchema = z.object({
  full_name: z
    .string({ error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120)
    .regex(/^[A-Za-z][A-Za-z .'-]*$/, 'Full name can contain only letters, spaces and . \' -'),
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(160),
  phone: z
    .string({ error: 'Phone is required' })
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  date_of_birth: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
      .refine((d) => {
        const age = (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000);
        return age >= 18 && age <= 70;
      }, 'Candidate must be between 18 and 70 years old')
      .nullable()
  ),
  gender: z.preprocess(emptyToNull, z.enum(GENDERS).nullable()),
  city: z.string({ error: 'City is required' }).trim().min(2, 'City is required').max(80),
  qualification: z
    .string({ error: 'Qualification is required' })
    .trim()
    .min(2, 'Qualification is required')
    .max(120),
  experience_years: z.coerce
    .number({ error: 'Experience must be a number' })
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience looks too high'),
  position_applied: z
    .string({ error: 'Position is required' })
    .trim()
    .min(2, 'Position is required')
    .max(120),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(20, 'Add at most 20 skills')
    .default([]),
  expected_salary: z.preprocess(
    emptyToNull,
    z.coerce.number().min(0, 'Salary cannot be negative').max(100000000).nullable()
  ),
  status: z.enum(STATUSES).default('Applied'),
  notes: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable()),
});

module.exports = { candidateSchema, STATUSES, GENDERS };
