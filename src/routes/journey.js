import express from 'express';
import { body, query, param } from 'express-validator';
import { 
  getAllJourneyItems, 
  getJourneyById, 
  createJourneyItem, 
  updateJourneyItem, 
  deleteJourneyItem,
  getJourneyByType,
  getCurrentJourneyItems
} from '../controllers/journeyController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { 
  journeySchema, 
  journeyUpdateSchema, 
  journeyQuerySchema, 
  idParamSchema 
} from '../utils/validation.js';

const router = express.Router();

// Validation rules
const createJourneyValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('company_name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 255 })
    .withMessage('Company name must not exceed 255 characters'),
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .toDate(),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .toDate()
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('details')
    .trim()
    .notEmpty()
    .withMessage('Details are required')
    .isLength({ min: 10 })
    .withMessage('Details must be at least 10 characters long'),
  body('journey_type')
    .isIn(['Experience', 'Education', 'Volunteer'])
    .withMessage('Journey type must be Experience, Education, or Volunteer')
];

const updateJourneyValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('company_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Company name must not exceed 255 characters'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .toDate(),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .toDate()
    .custom((value, { req }) => {
      if (value && req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('details')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Details cannot be empty')
    .isLength({ min: 10 })
    .withMessage('Details must be at least 10 characters long'),
  body('journey_type')
    .optional()
    .isIn(['Experience', 'Education', 'Volunteer'])
    .withMessage('Journey type must be Experience, Education, or Volunteer')
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
    .isIn(['start_date', 'title', 'company_name'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('journey_type')
    .optional()
    .isIn(['Experience', 'Education', 'Volunteer'])
    .withMessage('Journey type must be Experience, Education, or Volunteer'),
  query('current')
    .optional()
    .isBoolean()
    .withMessage('Current must be a boolean')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const typeValidation = [
  param('type')
    .isIn(['Experience', 'Education', 'Volunteer'])
    .withMessage('Type must be Experience, Education, or Volunteer')
];

// Routes

// GET /api/journey - Get all journey items with pagination
router.get('/', 
  queryValidation,
  validateRequest,
  optionalAuth,
  getAllJourneyItems
);

// GET /api/journey/current - Get current (ongoing) journey items
router.get('/current',
  queryValidation,
  validateRequest,
  optionalAuth,
  getCurrentJourneyItems
);

// GET /api/journey/type/:type - Get journey items by type
router.get('/type/:type',
  typeValidation,
  validateRequest,
  optionalAuth,
  getJourneyByType
);

// GET /api/journey/:id - Get single journey item by ID
router.get('/:id',
  idValidation,
  validateRequest,
  getJourneyById
);

// POST /api/journey - Create new journey item
router.post('/',
  createJourneyItem
);

// PUT /api/journey/:id - Update journey item
router.put('/:id',
  authenticate,
  idValidation,
  updateJourneyValidation,
  validateRequest,
  updateJourneyItem
);

// DELETE /api/journey/:id - Delete journey item
router.delete('/:id',
  authenticate,
  idValidation,
  validateRequest,
  deleteJourneyItem
);

export default router;
