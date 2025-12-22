import express from 'express';
import { body, query, param } from 'express-validator';
import { 
  getAllCertifications, 
  getCertificationById, 
  createCertification, 
  updateCertification, 
  deleteCertification,
  getCertificationsByIssuer
} from '../controllers/certificationsController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { 
  certificationSchema, 
  certificationUpdateSchema, 
  certificationQuerySchema, 
  idParamSchema 
} from '../utils/validation.js';

const router = express.Router();

// Validation rules
const createCertificationValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Certification title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('issuer')
    .trim()
    .notEmpty()
    .withMessage('Issuer is required')
    .isLength({ max: 255 })
    .withMessage('Issuer must not exceed 255 characters'),
  body('issued_date')
    .isISO8601()
    .withMessage('Issued date must be a valid date')
    .toDate(),
  body('certification_id')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Certification ID must not exceed 255 characters'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Details must not exceed 2000 characters'),
  body('link_url')
    .optional()
    .isURL()
    .withMessage('Link URL must be a valid URL')
];

const updateCertificationValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('issuer')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Issuer cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Issuer must not exceed 255 characters'),
  body('issued_date')
    .optional()
    .isISO8601()
    .withMessage('Issued date must be a valid date')
    .toDate(),
  body('certification_id')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Certification ID must not exceed 255 characters'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Details must not exceed 2000 characters'),
  body('link_url')
    .optional()
    .isURL()
    .withMessage('Link URL must be a valid URL')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['issued_date', 'title', 'issuer'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('issuer')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Issuer filter must not exceed 255 characters')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const issuerValidation = [
  param('issuer')
    .trim()
    .notEmpty()
    .withMessage('Issuer is required')
    .isLength({ max: 255 })
    .withMessage('Issuer must not exceed 255 characters')
];

// Routes

// GET /api/certifications - Get all certifications with pagination
router.get('/', 
  queryValidation,
  validateRequest,
  optionalAuth,
  getAllCertifications
);

// GET /api/certifications/issuer/:issuer - Get certifications by issuer
router.get('/issuer/:issuer',
  issuerValidation,
  validateRequest,
  getCertificationsByIssuer
);

// GET /api/certifications/:id - Get single certification by ID
router.get('/:id',
  idValidation,
  validateRequest,
  getCertificationById
);

// POST /api/certifications - Create new certification
router.post('/',
  validateRequest,
  createCertification
);

// PUT /api/certifications/:id - Update certification
router.put('/:id',
  authenticate,
  idValidation,
  updateCertificationValidation,
  validateRequest,
  updateCertification
);

// DELETE /api/certifications/:id - Delete certification
router.delete('/:id',
  authenticate,
  idValidation,
  validateRequest,
  deleteCertification
);

export default router;
