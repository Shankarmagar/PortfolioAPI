-- Project Upload API Database Schema for Supabase
-- Execute this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    details TEXT NOT NULL,
    image_url TEXT,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    demo_link TEXT,
    github_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_skills ON projects USING GIN(skills);
CREATE INDEX idx_projects_name ON projects(name);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your needs)

-- Policy for public read access
CREATE POLICY "Public read access" ON projects
    FOR SELECT USING (true);

-- Policy for authenticated users to insert
CREATE POLICY "Authenticated users can insert" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update
CREATE POLICY "Authenticated users can update" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- If you want public insert/update/delete access (for development), uncomment:
-- CREATE POLICY "Public insert access" ON projects
--     FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Public update access" ON projects
--     FOR UPDATE USING (true);
-- 
-- CREATE POLICY "Public delete access" ON projects
--     FOR DELETE USING (true);

-- Create a storage bucket for project images (run this in Supabase Storage)
-- You can do this via the Storage UI or SQL:
-- SELECT storage.create_bucket('project-images', public := true);

-- Create certifications table
CREATE TABLE certifications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issued_date DATE NOT NULL,
    certification_id TEXT,
    details TEXT,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically update updated_at for certifications
CREATE TRIGGER update_certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create journey_items table
CREATE TABLE journey_items (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    details TEXT NOT NULL,
    journey_type TEXT NOT NULL CHECK (journey_type IN ('Experience', 'Education', 'Volunteer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically update updated_at for journey_items
CREATE TRIGGER update_journey_items_updated_at
    BEFORE UPDATE ON journey_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_certifications_issued_date ON certifications(issued_date DESC);
CREATE INDEX idx_certifications_issuer ON certifications(issuer);
CREATE INDEX idx_journey_items_start_date ON journey_items(start_date DESC);
CREATE INDEX idx_journey_items_type ON journey_items(journey_type);
CREATE INDEX idx_journey_items_company ON journey_items(company_name);

-- Enable Row Level Security for new tables
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for certifications
CREATE POLICY "Public read access for certifications" ON certifications
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert certifications" ON certifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update certifications" ON certifications
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete certifications" ON certifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for journey_items
CREATE POLICY "Public read access for journey_items" ON journey_items
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert journey_items" ON journey_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update journey_items" ON journey_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete journey_items" ON journey_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- Optional: Create views for easier API responses
CREATE OR REPLACE VIEW projects_view AS
SELECT 
    id,
    name,
    details,
    image_url,
    skills,
    demo_link,
    github_link,
    created_at,
    updated_at,
    CASE 
        WHEN image_url IS NOT NULL THEN true
        ELSE false
    END as has_image
FROM projects;

CREATE OR REPLACE VIEW certifications_view AS
SELECT 
    id,
    title,
    issuer,
    issued_date,
    certification_id,
    details,
    link_url,
    created_at,
    updated_at,
    CASE 
        WHEN link_url IS NOT NULL THEN true
        ELSE false
    END as has_link
FROM certifications;

CREATE OR REPLACE VIEW journey_items_view AS
SELECT 
    id,
    title,
    company_name,
    start_date,
    end_date,
    details,
    journey_type,
    created_at,
    updated_at,
    CASE 
        WHEN end_date IS NULL THEN true
        ELSE false
    END as is_current
FROM journey_items;
