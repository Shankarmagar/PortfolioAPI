import { supabase } from '../config/supabase.js';
import { 
  sendSuccess, 
  sendError, 
  sendPaginatedResponse, 
  sendDeleteResponse 
} from '../utils/responseFormatter.js';

// Get all certifications with pagination, filtering, and sorting
export const getAllCertifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'issued_date',
      sortOrder = 'desc',
      issuer
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('certifications_view')
      .select('*', { count: 'exact' });

    // Add issuer filter
    if (issuer) {
      query = query.ilike('issuer', `%${issuer}%`);
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
        sendError('Failed to fetch certifications', 500)
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
      sendPaginatedResponse(data || [], pagination, 'Certifications retrieved successfully')
    );
  } catch (error) {
    console.error('Get all certifications error:', error);
    res.status(500).json(
      sendError('Failed to fetch certifications', 500, error.message)
    );
  }
};

// Get single certification by ID
export const getCertificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('certifications_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(
          sendError('Certification not found', 404)
        );
      }
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to fetch certification', 500)
      );
    }

    res.json(
      sendSuccess(data, 'Certification retrieved successfully', 200)
    );
  } catch (error) {
    console.error('Get certification by ID error:', error);
    res.status(500).json(
      sendError('Failed to fetch certification', 500, error.message)
    );
  }
};

// Create new certification
export const createCertification = async (req, res) => {
  try {
    const { 
      title, 
      issuer, 
      issued_date, 
      certification_id, 
      details, 
      link_url 
    } = req.body;

    // Check if certification with same title and issuer exists
    const { data: existingCertification } = await supabase
      .from('certifications')
      .select('id')
      .eq('title', title)
      .eq('issuer', issuer)
      .single();

    if (existingCertification) {
      return res.status(400).json(
        sendError('Certification with this title and issuer already exists', 400)
      );
    }

    // Prepare certification data
    const certificationData = {
      title: title,
      issuer: issuer,
      issued_date: issued_date, // Format as YYYY-MM-DD
      certification_id: certification_id || null,
      details: details || null,
      link_url: link_url || null
    };

    // Insert into database
    const { data, error } = await supabase
      .from('certifications')
      .insert([certificationData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to create certification', 500)
      );
    }

    res.status(201).json(
      sendSuccess(data, 'Certification created successfully', 201)
    );
  } catch (error) {
    console.error('Create certification error:', error);
    res.status(500).json(
      sendError('Failed to create certification', 500, error.message)
    );
  }
};

// Update certification
export const updateCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      issuer, 
      issued_date, 
      certification_id, 
      details, 
      link_url 
    } = req.body;

    // Check if certification exists
    const { data: existingCertification } = await supabase
      .from('certifications')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCertification) {
      return res.status(404).json(
        sendError('Certification not found', 404)
      );
    }

    // Check for duplicate title/issuer if being changed
    if (title && issuer && (title !== existingCertification.title || issuer !== existingCertification.issuer)) {
      const { data: duplicateCertification } = await supabase
        .from('certifications')
        .select('id')
        .eq('title', title)
        .eq('issuer', issuer)
        .neq('id', id)
        .single();

      if (duplicateCertification) {
        return res.status(400).json(
          sendError('Certification with this title and issuer already exists', 400)
        );
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (issuer !== undefined) updateData.issuer = issuer.trim();
    if (issued_date !== undefined) updateData.issued_date = new Date(issued_date).toISOString().split('T')[0];
    if (certification_id !== undefined) updateData.certification_id = certification_id?.trim() || null;
    if (details !== undefined) updateData.details = details?.trim() || null;
    if (link_url !== undefined) updateData.link_url = link_url?.trim() || null;

    // Update certification
    const { data, error } = await supabase
      .from('certifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to update certification', 500)
      );
    }

    res.json(
      sendSuccess(data, 'Certification updated successfully', 200)
    );
  } catch (error) {
    console.error('Update certification error:', error);
    res.status(500).json(
      sendError('Failed to update certification', 500, error.message)
    );
  }
};

// Delete certification
export const deleteCertification = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if certification exists
    const { data: existingCertification } = await supabase
      .from('certifications')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCertification) {
      return res.status(404).json(
        sendError('Certification not found', 404)
      );
    }

    // Delete certification
    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to delete certification', 500)
      );
    }

    res.json(
      sendDeleteResponse('Certification deleted successfully')
    );
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json(
      sendError('Failed to delete certification', 500, error.message)
    );
  }
};

// Get certifications by issuer
export const getCertificationsByIssuer = async (req, res) => {
  try {
    const { issuer } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'issued_date',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('certifications_view')
      .select('*', { count: 'exact' })
      .ilike('issuer', `%${issuer}%`);

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to fetch certifications by issuer', 500)
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
      sendPaginatedResponse(
        data || [], 
        pagination, 
        `Certifications from ${issuer} retrieved successfully`
      )
    );
  } catch (error) {
    console.error('Get certifications by issuer error:', error);
    res.status(500).json(
      sendError('Failed to fetch certifications by issuer', 500, error.message)
    );
  }
};
