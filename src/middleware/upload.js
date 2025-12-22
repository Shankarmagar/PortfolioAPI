import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for memory storage (will upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 1 // Only allow single file upload
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer with file filter
const uploadWithFilter = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 1 // Only allow single file upload
  }
});

// Middleware for single image upload (accepts both 'image' and 'uploadedFile' field names)
export const uploadProjectImage = (req, res, next) => {
  // Use .any() to accept any field name, then normalize it
  const uploadAny = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
      files: 1 // Only allow single file upload
    }
  });

  uploadAny.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Find the uploaded file from our allowed field names
    let file = null;
    
    if (req.files && req.files.length > 0) {
      // Find the first image file from our allowed field names
      file = req.files.find(f => ['image', 'uploadedFile'].includes(f.fieldname));
      
      if (file && file.fieldname === 'uploadedFile') {
        // Normalize the field name to 'image' for consistency
        file.fieldname = 'image';
      }
    }

    // Set req.file to the found file (or null if no file was uploaded)
    req.file = file;
    
    next();
  });
};

// Upload image to Supabase Storage
export const uploadToSupabaseStorage = async (fileBuffer, mimetype, originalName, bucketName = 'project-images') => {
  try {
    // Generate unique filename
    const fileExtension = path.extname(originalName);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      fileName,
      publicUrl,
      originalName,
      size: fileBuffer.length,
      mimetype
    };
  } catch (error) {
    console.error('Supabase Storage upload error:', error);
    throw error;
  }
};

// Delete image from Supabase Storage
export const deleteFromSupabaseStorage = async (fileName, bucketName = 'project-images') => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Supabase Storage delete error:', error);
    throw error;
  }
};

// Middleware for handling upload errors
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
};
