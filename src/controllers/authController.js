import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json(
        sendError('User already exists with this email', 400)
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (authError) throw authError;

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString()
        }
      ]);

    if (profileError) throw profileError;

    // Generate token
    const token = generateToken(authData.user.id);

    const userData = {
      id: authData.user.id,
      email: authData.user.email,
      firstName: authData.user.user_metadata.first_name,
      lastName: authData.user.user_metadata.last_name,
      createdAt: authData.user.created_at
    };

    res.status(201).json(
      sendSuccess(
        { user: userData, token },
        'User registered successfully',
        201
      )
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(
      sendError('Registration failed', 500, error.message)
    );
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json(
        sendError('Invalid credentials', 401)
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Generate token
    const token = generateToken(authData.user.id);

    const userData = {
      id: authData.user.id,
      email: authData.user.email,
      firstName: profile?.first_name || authData.user.user_metadata.first_name,
      lastName: profile?.last_name || authData.user.user_metadata.last_name,
      createdAt: authData.user.created_at
    };

    res.json(
      sendSuccess(
        { user: userData, token },
        'Login successful',
        200
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      sendError('Login failed', 500, error.message)
    );
  }
};

// Refresh token
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json(
        sendError('Refresh token required', 401)
      );
    }

    // Verify refresh token with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json(
        sendError('Invalid refresh token', 401)
      );
    }

    // Generate new access token
    const token = generateToken(data.user.id);

    res.json(
      sendSuccess(
        { token, user: data.user },
        'Token refreshed successfully',
        200
      )
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json(
      sendError('Token refresh failed', 500, error.message)
    );
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    res.json(
      sendSuccess(null, 'Logged out successfully', 200)
    );
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(
      sendError('Logout failed', 500, error.message)
    );
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        sendError('Access token required', 401)
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json(
        sendError('Invalid token', 401)
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userData = {
      id: user.id,
      email: user.email,
      firstName: profile?.first_name || user.user_metadata.first_name,
      lastName: profile?.last_name || user.user_metadata.last_name,
      createdAt: user.created_at
    };

    res.json(
      sendSuccess(userData, 'User retrieved successfully', 200)
    );
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json(
      sendError('Failed to get user', 500, error.message)
    );
  }
};

export const authController = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser
};
