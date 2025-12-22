import { supabase } from '../config/supabase.js';
import { 
  sendSuccess, 
  sendError, 
  sendPaginatedResponse, 
  sendDeleteResponse 
} from '../utils/responseFormatter.js';

// Get all journey items with pagination, filtering, and sorting
export const getAllJourneyItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'start_date',
      sortOrder = 'desc',
      journey_type,
      current
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('journey_items_view')
      .select('*', { count: 'exact' });

    // Add journey type filter
    if (journey_type) {
      query = query.eq('journey_type', journey_type);
    }

    // Add current filter
    if (current !== undefined) {
      query = query.eq('is_current', current === 'true');
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
        sendError('Failed to fetch journey items', 500)
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
      sendPaginatedResponse(data || [], pagination, 'Journey items retrieved successfully')
    );
  } catch (error) {
    console.error('Get all journey items error:', error);
    res.status(500).json(
      sendError('Failed to fetch journey items', 500, error.message)
    );
  }
};

// Get single journey item by ID
export const getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('journey_items_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(
          sendError('Journey item not found', 404)
        );
      }
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to fetch journey item', 500)
      );
    }

    res.json(
      sendSuccess(data, 'Journey item retrieved successfully', 200)
    );
  } catch (error) {
    console.error('Get journey by ID error:', error);
    res.status(500).json(
      sendError('Failed to fetch journey item', 500, error.message)
    );
  }
};

// Create new journey item
export const createJourneyItem = async (req, res) => {
  try {
    const { 
      title, 
      company_name, 
      start_date, 
      end_date, 
      details, 
      journey_type 
    } = req.body;

    // Check if journey item with same title and company exists
    const { data: existingJourneyItem } = await supabase
      .from('journey_items')
      .select('id')
      .eq('title', title)
      .eq('company_name', company_name)
      .single();

    if (existingJourneyItem) {
      return res.status(400).json(
        sendError('Journey item with this title and company already exists', 400)
      );
    }

    // Validate date range
    if (end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json(
        sendError('End date must be after start date', 400)
      );
    }

    // Prepare journey item data
    const journeyItemData = {
      title: title.trim(),
      company_name: company_name.trim(),
      start_date: new Date(start_date).toISOString().split('T')[0], // Format as YYYY-MM-DD
      end_date: end_date ? new Date(end_date).toISOString().split('T')[0] : null,
      details: details.trim(),
      journey_type
    };

    // Insert into database
    const { data, error } = await supabase
      .from('journey_items')
      .insert([journeyItemData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to create journey item', 500)
      );
    }

    res.status(201).json(
      sendSuccess(data, 'Journey item created successfully', 201)
    );
  } catch (error) {
    console.error('Create journey item error:', error);
    res.status(500).json(
      sendError('Failed to create journey item', 500, error.message)
    );
  }
};

// Update journey item
export const updateJourneyItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      company_name, 
      start_date, 
      end_date, 
      details, 
      journey_type 
    } = req.body;

    // Check if journey item exists
    const { data: existingJourneyItem } = await supabase
      .from('journey_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingJourneyItem) {
      return res.status(404).json(
        sendError('Journey item not found', 404)
      );
    }

    // Check for duplicate title/company if being changed
    if (title && company_name && (title !== existingJourneyItem.title || company_name !== existingJourneyItem.company_name)) {
      const { data: duplicateJourneyItem } = await supabase
        .from('journey_items')
        .select('id')
        .eq('title', title)
        .eq('company_name', company_name)
        .neq('id', id)
        .single();

      if (duplicateJourneyItem) {
        return res.status(400).json(
          sendError('Journey item with this title and company already exists', 400)
        );
      }
    }

    // Validate date range if both dates are provided
    const finalStartDate = start_date || existingJourneyItem.start_date;
    const finalEndDate = end_date !== undefined ? end_date : existingJourneyItem.end_date;
    
    if (finalEndDate && new Date(finalEndDate) <= new Date(finalStartDate)) {
      return res.status(400).json(
        sendError('End date must be after start date', 400)
      );
    }

    // Prepare update data
    const updateData = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (company_name !== undefined) updateData.company_name = company_name.trim();
    if (start_date !== undefined) updateData.start_date = new Date(start_date).toISOString().split('T')[0];
    if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date).toISOString().split('T')[0] : null;
    if (details !== undefined) updateData.details = details.trim();
    if (journey_type !== undefined) updateData.journey_type = journey_type;

    // Update journey item
    const { data, error } = await supabase
      .from('journey_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to update journey item', 500)
      );
    }

    res.json(
      sendSuccess(data, 'Journey item updated successfully', 200)
    );
  } catch (error) {
    console.error('Update journey item error:', error);
    res.status(500).json(
      sendError('Failed to update journey item', 500, error.message)
    );
  }
};

// Delete journey item
export const deleteJourneyItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if journey item exists
    const { data: existingJourneyItem } = await supabase
      .from('journey_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingJourneyItem) {
      return res.status(404).json(
        sendError('Journey item not found', 404)
      );
    }

    // Delete journey item
    const { error } = await supabase
      .from('journey_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to delete journey item', 500)
      );
    }

    res.json(
      sendDeleteResponse('Journey item deleted successfully')
    );
  } catch (error) {
    console.error('Delete journey item error:', error);
    res.status(500).json(
      sendError('Failed to delete journey item', 500, error.message)
    );
  }
};

// Get journey items by type
export const getJourneyByType = async (req, res) => {
  try {
    const { type } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'start_date',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('journey_items_view')
      .select('*', { count: 'exact' })
      .eq('journey_type', type);

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to fetch journey items by type', 500)
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
        `${type} items retrieved successfully`
      )
    );
  } catch (error) {
    console.error('Get journey by type error:', error);
    res.status(500).json(
      sendError('Failed to fetch journey items by type', 500, error.message)
    );
  }
};

// Get current (ongoing) journey items
export const getCurrentJourneyItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'start_date',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query for current items (no end_date)
    let query = supabase
      .from('journey_items_view')
      .select('*', { count: 'exact' })
      .is('end_date', null);

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json(
        sendError('Failed to fetch current journey items', 500)
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
        'Current journey items retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get current journey items error:', error);
    res.status(500).json(
      sendError('Failed to fetch current journey items', 500, error.message)
    );
  }
};
