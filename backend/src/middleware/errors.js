const { ZodError } = require('zod');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'form';
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(422).json({ error: 'Please fix the highlighted fields', fields });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, fields: err.details });
  }

  // PostgreSQL unique violation (active email already registered)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'A candidate with this email is already registered',
      fields: { email: 'This email is already registered' },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { HttpError, notFound, errorHandler };
