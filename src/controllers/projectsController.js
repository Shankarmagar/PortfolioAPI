import { supabase } from '../config/supabase.js';
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from '../middleware/upload.js';
import { 
  sendSuccess, 
  sendError, 
  sendPaginatedResponse, 
  sendSearchResponse,
  sendDeleteResponse 
} from '../utils/responseFormatter.js';

// Get all projects with pagination, filtering, and sorting
export const getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search,
      skills,
      hasImage
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('projects_view')
      .select('*', { count: 'exact' });

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,details.ilike.%${search}%`);
    }

    // Add skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query = query.contains('skills', skillsArray);
    }

    // Add image filter
    if (hasImage !== undefined) {
      query = query.eq('has_image', hasImage === 'true');
    }

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to fetch projects', 500)
      );
    }

    // Calculate pagination
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    res.json(
      sendPaginatedResponse(data || [], pagination, 'Projects retrieved successfully')
    );
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json(
      sendError('Failed to fetch projects', 500, error.message)
    );
  }
};

// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('projects_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(
          sendError('Project not found', 404)
        );
      }
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to fetch project', 500)
      );
    }

    res.json(
      sendSuccess(data, 'Project retrieved successfully', 200)
    );
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json(
      sendError('Failed to fetch project', 500, error.message)
    );
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const { name, details, skills = [], demo_link, github_link } = req.body;
    const uploadedFile = req.file;

    // Check if project with same name exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('name', name)
      .single();

    if (existingProject) {
      return res.status(400).json(
        sendError('Project with this name already exists', 400)
      );
    }

    // Handle image upload if file is provided
    let image_url = null;
    if (uploadedFile) {
      try {
        const uploadResult = await uploadToSupabaseStorage(
          uploadedFile.buffer,
          uploadedFile.mimetype,
          uploadedFile.originalname
        );
        image_url = uploadResult.publicUrl;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json(
          sendError('Failed to upload image. Please ensure the file is a valid image and under 10MB.', 400)
        );
      }
    }

    // Prepare project data
    const projectData = {
      name: name,
      details: details,
      skills: Array.isArray(skills) ? skills : [],
      demo_link: demo_link || null,
      github_link: github_link || null,
      image_url: image_url
    };

    // Insert into database
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      // If database insert fails, delete uploaded image
      if (image_url) {
        try {
          const fileName = extractFilenameFromUrl(image_url);
          if (fileName) {
            await deleteFromSupabaseStorage(fileName);
          }
        } catch (deleteError) {
          console.error('Failed to cleanup uploaded image:', deleteError);
        }
      }
      
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to create project', 500)
      );
    }

    res.status(201).json(
      sendSuccess(data, 'Project created successfully', 201)
    );
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json(
      sendError('Failed to create project', 500, error.message)
    );
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, details, skills, demo_link, github_link } = req.body;
    const uploadedFile = req.file;

    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return res.status(404).json(
        sendError('Project not found', 404)
      );
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingProject.name) {
      const { data: nameConflict } = await supabase
        .from('projects')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single();

      if (nameConflict) {
        return res.status(400).json(
          sendError('Project with this name already exists', 400)
        );
      }
    }

    // Handle image upload if file is provided
    let image_url = existingProject.image_url; // Keep existing image by default
    if (uploadedFile) {
      try {
        const uploadResult = await uploadToSupabaseStorage(
          uploadedFile.buffer,
          uploadedFile.mimetype,
          uploadedFile.originalname
        );
        image_url = uploadResult.publicUrl;
        
        // Delete old image if it exists
        if (existingProject.image_url) {
          try {
            const oldFileName = extractFilenameFromUrl(existingProject.image_url);
            if (oldFileName) {
              await deleteFromSupabaseStorage(oldFileName);
            }
          } catch (deleteError) {
            console.error('Failed to delete old image:', deleteError);
          }
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json(
          sendError('Failed to upload image. Please ensure the file is a valid image and under 10MB.', 400)
        );
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (details !== undefined) updateData.details = details.trim();
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : [];
    if (demo_link !== undefined) updateData.demo_link = demo_link?.trim() || null;
    if (github_link !== undefined) updateData.github_link = github_link?.trim() || null;
    if (image_url !== undefined) updateData.image_url = image_url;

    // Update project
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // If database update fails, delete newly uploaded image
      if (uploadedFile && image_url) {
        try {
          const fileName = extractFilenameFromUrl(image_url);
          if (fileName) {
            await deleteFromSupabaseStorage(fileName);
          }
        } catch (deleteError) {
          console.error('Failed to cleanup uploaded image:', deleteError);
        }
      }
      
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to update project', 500)
      );
    }

    res.json(
      sendSuccess(data, 'Project updated successfully', 200)
    );
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json(
      sendError('Failed to update project', 500, error.message)
    );
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return res.status(404).json(
        sendError('Project not found', 404)
      );
    }

    // Delete associated image from Supabase Storage
    await deleteProjectImage(existingProject.image_url);

    // Delete project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to delete project', 500)
      );
    }

    res.json(
      sendDeleteResponse('Project deleted successfully')
    );
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json(
      sendError('Failed to delete project', 500, error.message)
    );
  }
};

// Search projects
export const searchProjects = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // Search in name and details
    const { data, error, count } = await supabase
      .from('projects_view')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,details.ilike.%${query}%,skills.cs.{${query}}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Search failed', 500)
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    res.json(
      sendSearchResponse(data || [], { query }, pagination)
    );
  } catch (error) {
    console.error('Search projects error:', error);
    res.status(500).json(
      sendError('Search failed', 500, error.message)
    );
  }
};

// Upload project image to Supabase Storage
export const uploadProjectImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        sendError('No file uploaded', 400)
      );
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabaseStorage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    res.status(201).json(
      sendSuccess({
        filename: uploadResult.fileName,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype,
        url: uploadResult.publicUrl
      }, 'Image uploaded successfully', 201)
    );
  } catch (error) {
    console.error('Upload project image error:', error);
    res.status(500).json(
      sendError('Failed to upload image', 500, error.message)
    );
  }
};

// Helper function to extract filename from Supabase URL
const extractFilenameFromUrl = (url) => {
  try {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  } catch (error) {
    return null;
  }
};

// Helper function to delete image when project is deleted
const deleteProjectImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    const fileName = extractFilenameFromUrl(imageUrl);
    if (fileName) {
      await deleteFromSupabaseStorage(fileName);
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
};
