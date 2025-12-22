import { validationResult } from 'express-validator';
import { sendValidationError } from '../utils/responseFormatter.js';

// Middleware to validate request using express-validator
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json(
      sendValidationError(errors)
    );
  }
  
  next();
};
