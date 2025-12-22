import express from 'express';
import { body, query, param } from 'express-validator';
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  searchProjects,
  uploadProjectImage
} from '../controllers/projectsController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { uploadProjectImage as uploadProjectImageMiddleware, handleUploadError } from '../middleware/upload.js';
import { 
  projectSchema, 
  projectUpdateSchema, 
  projectQuerySchema, 
  idParamSchema,
  searchQuerySchema 
} from '../utils/validation.js';

const router = express.Router();

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 255 })
    .withMessage('Project name must not exceed 255 characters'),
  body('details')
    .trim()
    .notEmpty()
    .withMessage('Project details are required')
    .isLength({ min: 10 })
    .withMessage('Project details must be at least 10 characters long'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('demo_link')
    .optional()
    .isURL()
    .withMessage('Demo link must be a valid URL'),
  body('github_link')
    .optional()
    .isURL()
    .withMessage('GitHub link must be a valid URL')
];

const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Project name must not exceed 255 characters'),
  body('details')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project details cannot be empty')
    .isLength({ min: 10 })
    .withMessage('Project details must be at least 10 characters long'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('demo_link')
    .optional()
    .isURL()
    .withMessage('Demo link must be a valid URL'),
  body('github_link')
    .optional()
    .isURL()
    .withMessage('GitHub link must be a valid URL')
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
    .isIn(['created_at', 'name', 'updated_at'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search query must not exceed 255 characters'),
  query('skills')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Skills filter must not exceed 255 characters'),
  query('hasImage')
    .optional()
    .isBoolean()
    .withMessage('hasImage must be a boolean')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

// Routes

// GET /api/projects - Get all projects with pagination, filtering, and sorting
router.get('/', 
  queryValidation,
  validateRequest,
  optionalAuth,
  getAllProjects
);

// GET /api/projects/search - Search projects
router.get('/search',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ max: 255 })
      .withMessage('Search query must not exceed 255 characters'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  searchProjects
);

// GET /api/projects/:id - Get single project by ID
router.get('/:id',
  authenticate,
  idValidation,
  validateRequest,
  getProjectById
);

// POST /api/projects - Create new project (with optional image upload)
router.post('/',
  uploadProjectImageMiddleware,
  handleUploadError,
  createProject
);

// POST /api/projects/upload-image - Upload project image
router.post('/upload-image',
  authenticate,
  uploadProjectImageMiddleware,
  handleUploadError,
  uploadProjectImage
);

// PUT /api/projects/:id - Update project
router.put('/:id',
  authenticate,
  idValidation,
  uploadProjectImageMiddleware,
  handleUploadError,
  updateProjectValidation,
  validateRequest,
  updateProject
);

// DELETE /api/projects/:id - Delete project
router.delete('/:id',
  idValidation,
  validateRequest,
  deleteProject
);

export default router;
