const errorHandler = (err, req, res, next) => {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    name: err.name,
  });

  // ─── Sequelize Validation Error ──────────────────────────
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map((e) => `${e.path}: ${e.message}`);
    return res.status(400).json({ 
      message: "Validation error",
      errors: messages,
      code: 'VALIDATION_ERROR'
    });
  }

  // ─── Sequelize Unique Constraint Error ──────────────────
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors?.[0]?.path || 'Unknown field';
    return res.status(409).json({ 
      message: `This ${field} already exists. Please use a different value.`,
      code: 'DUPLICATE_ENTRY',
      field
    });
  }

  // ─── Sequelize Foreign Key Error ─────────────────────────
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({ 
      message: "Cannot perform this action due to related data. Please check dependencies.",
      code: 'FOREIGN_KEY_ERROR'
    });
  }

  // ─── Sequelize Database Error ───────────────────────────
  if (err.name === "SequelizeDatabaseError") {
    console.error("Database error:", err.original?.sqlMessage || err.message);
    return res.status(500).json({
      message: "Database error. Please try again later.",
      code: 'DATABASE_ERROR',
      ...(process.env.NODE_ENV === 'development' && { detail: err.original?.sqlMessage }),
    });
  }

  // ─── Multer File Upload Error ───────────────────────────
  if (err.code?.startsWith('LIMIT_')) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size exceeds the maximum limit of 5MB. Please upload a smaller image.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files uploaded. Maximum 10 files allowed.',
        code: 'TOO_MANY_FILES'
      });
    }
  }

  // ─── Custom Error with Status Code ──────────────────────
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message || "An error occurred",
      code: err.code || 'UNKNOWN_ERROR'
    });
  }

  // ─── Not Found Error ────────────────────────────────────
  if (err.message?.includes('not found') || err.statusCode === 404) {
    return res.status(404).json({
      message: err.message || "Resource not found",
      code: 'NOT_FOUND'
    });
  }

  // ─── Default Error ──────────────────────────────────────
  const status = err.status || 500;
  return res.status(status).json({
    message: err.message || "Internal server error. Please try again later.",
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;