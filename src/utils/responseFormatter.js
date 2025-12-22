// API Response Formatter Utility

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted response
 */
export const sendSuccess = (data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return {
    statusCode,
    json: response
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Additional error details
 * @returns {Object} Formatted error response
 */
export const sendError = (message = 'Error', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return {
    statusCode,
    json: response
  };
};

/**
 * Format paginated response
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
export const sendPaginatedResponse = (data = [], pagination = {}, message = 'Success') => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      pages: pagination.pages || 1,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    }
  };

  return {
    statusCode: 200,
    json: response
  };
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Object} Pagination metadata
 */
export const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    pages: totalPages,
    hasNext,
    hasPrev
  };
};

/**
 * Format validation error response
 * @param {Object} validationErrors - Joi validation errors
 * @returns {Object} Formatted validation error response
 */
export const sendValidationError = (validationErrors) => {
  const errors = {};
  
  if (validationErrors.details) {
    validationErrors.details.forEach(error => {
      const field = error.path.join('.');
      errors[field] = error.message;
    });
  }

  return sendError('Validation failed', 400, errors);
};

/**
 * Format file upload response
 * @param {Object} fileInfo - Uploaded file information
 * @param {string} message - Success message
 * @returns {Object} Formatted file upload response
 */
export const sendFileUploadResponse = (fileInfo, message = 'File uploaded successfully') => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    data: {
      filename: fileInfo.filename,
      originalName: fileInfo.originalname,
      size: fileInfo.size,
      mimetype: fileInfo.mimetype,
      url: fileInfo.url || `/uploads/${fileInfo.filename}`
    }
  };

  return {
    statusCode: 201,
    json: response
  };
};

/**
 * Format delete response
 * @param {string} message - Success message
 * @returns {Object} Formatted delete response
 */
export const sendDeleteResponse = (message = 'Resource deleted successfully') => {
  return sendSuccess(null, message, 200);
};

/**
 * Format search response
 * @param {Array} results - Search results
 * @param {Object} searchInfo - Search information
 * @param {Object} pagination - Pagination info
 * @returns {Object} Formatted search response
 */
export const sendSearchResponse = (results = [], searchInfo = {}, pagination = {}) => {
  const response = {
    success: true,
    message: 'Search completed successfully',
    timestamp: new Date().toISOString(),
    data: results,
    search: {
      query: searchInfo.query || '',
      filters: searchInfo.filters || {},
      totalResults: results.length
    },
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || results.length,
      pages: pagination.pages || 1
    }
  };

  return {
    statusCode: 200,
    json: response
  };
};
