-- Add status column to analytics_files
ALTER TABLE analytics_files
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processed_rows INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add sheet_name column to analytics_data
ALTER TABLE analytics_data
ADD COLUMN IF NOT EXISTS sheet_name VARCHAR(100); 