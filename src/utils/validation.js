import Joi from 'joi';

// Project validation schemas
export const projectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.empty': 'Project name is required',
      'string.min': 'Project name must not be empty',
      'string.max': 'Project name must not exceed 255 characters'
    }),
  details: Joi.string().trim().min(10).required()
    .messages({
      'string.empty': 'Project details are required',
      'string.min': 'Project details must be at least 10 characters long'
    }),
  skills: Joi.array().items(Joi.string().trim()).default([])
    .messages({
      'array.base': 'Skills must be an array of strings'
    }),
  demo_link: Joi.string().uri().allow('').optional()
    .messages({
      'string.uri': 'Demo link must be a valid URL'
    }),
  github_link: Joi.string().uri().allow('').optional()
    .messages({
      'string.uri': 'GitHub link must be a valid URL'
    })
});

export const projectUpdateSchema = projectSchema.fork(['name', 'details'], (schema) => schema.optional());

export const projectQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().max(255).optional(),
  skills: Joi.string().trim().optional(), // comma-separated skills
  hasImage: Joi.boolean().optional()
});

// Certification validation schemas
export const certificationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.empty': 'Certification title is required',
      'string.min': 'Title must not be empty',
      'string.max': 'Title must not exceed 255 characters'
    }),
  issuer: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.empty': 'Issuer is required',
      'string.min': 'Issuer must not be empty',
      'string.max': 'Issuer must not exceed 255 characters'
    }),
  issued_date: Joi.date().iso().required()
    .messages({
      'date.base': 'Issued date must be a valid date',
      'any.required': 'Issued date is required'
    }),
  certification_id: Joi.string().trim().max(255).allow('').optional(),
  details: Joi.string().trim().allow('').optional(),
  link_url: Joi.string().uri().allow('').optional()
    .messages({
      'string.uri': 'Link URL must be a valid URL'
    })
});

export const certificationUpdateSchema = certificationSchema.fork(
  ['title', 'issuer', 'issued_date'], 
  (schema) => schema.optional()
);

export const certificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('issued_date', 'title', 'issuer').default('issued_date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  issuer: Joi.string().trim().max(255).optional()
});

// Journey validation schemas
export const journeySchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must not be empty',
      'string.max': 'Title must not exceed 255 characters'
    }),
  company_name: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.empty': 'Company name is required',
      'string.min': 'Company name must not be empty',
      'string.max': 'Company name must not exceed 255 characters'
    }),
  start_date: Joi.date().iso().required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required'
    }),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).allow(null).optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date'
    }),
  details: Joi.string().trim().min(10).required()
    .messages({
      'string.empty': 'Details are required',
      'string.min': 'Details must be at least 10 characters long'
    }),
  journey_type: Joi.string().valid('Experience', 'Education', 'Volunteer').required()
    .messages({
      'any.only': 'Journey type must be Experience, Education, or Volunteer',
      'any.required': 'Journey type is required'
    })
}).custom((value, helpers) => {
  // Custom validation for current job (no end date)
  if (!value.end_date && value.journey_type === 'Experience') {
    return value;
  }
  return value;
}, 'Current job validation');

export const journeyUpdateSchema = journeySchema.fork(
  ['title', 'company_name', 'start_date', 'details', 'journey_type'], 
  (schema) => schema.optional()
);

export const journeyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('start_date', 'title', 'company_name').default('start_date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  journey_type: Joi.string().valid('Experience', 'Education', 'Volunteer').optional(),
  current: Joi.boolean().optional() // For current/ongoing positions
});

// Common validation schemas
export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.min': 'ID must be greater than 0',
      'any.required': 'ID is required'
    })
});

export const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.empty': 'Search query is required',
      'string.min': 'Search query must not be empty',
      'string.max': 'Search query must not exceed 255 characters'
    }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});
