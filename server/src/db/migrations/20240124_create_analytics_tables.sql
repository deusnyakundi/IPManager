-- Create analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- Create table for uploaded files metadata
CREATE TABLE analytics.uploaded_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, error
    error_message TEXT,
    file_size BIGINT,
    sheet_count INTEGER
);

-- Create table for port failures
CREATE TABLE analytics.port_failures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES analytics.uploaded_files(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50),
    region VARCHAR(100),
    assigned_group VARCHAR(100),
    fault_type VARCHAR(100),
    fault_cause VARCHAR(100),
    reported_date TIMESTAMP WITH TIME ZONE,
    cleared_date TIMESTAMP WITH TIME ZONE,
    mttr NUMERIC,
    clients_affected INTEGER,
    olt_name VARCHAR(100),
    classification VARCHAR(50),
    resolution_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for degradations
CREATE TABLE analytics.degradations (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES analytics.uploaded_files(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50),
    region VARCHAR(100),
    assigned_group VARCHAR(100),
    fault_type VARCHAR(100),
    fault_cause VARCHAR(100),
    reported_date TIMESTAMP WITH TIME ZONE,
    cleared_date TIMESTAMP WITH TIME ZONE,
    mttr NUMERIC,
    clients_affected INTEGER,
    olt_name VARCHAR(100),
    classification VARCHAR(50),
    resolution_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for multiple LOS
CREATE TABLE analytics.multiple_los (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES analytics.uploaded_files(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50),
    region VARCHAR(100),
    assigned_group VARCHAR(100),
    fault_type VARCHAR(100),
    fault_cause VARCHAR(100),
    reported_date TIMESTAMP WITH TIME ZONE,
    cleared_date TIMESTAMP WITH TIME ZONE,
    mttr NUMERIC,
    clients_affected INTEGER,
    olt_name VARCHAR(100),
    classification VARCHAR(50),
    resolution_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for OLT failures
CREATE TABLE analytics.olt_failures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES analytics.uploaded_files(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50),
    region VARCHAR(100),
    assigned_group VARCHAR(100),
    fault_type VARCHAR(100),
    fault_cause VARCHAR(100),
    reported_date TIMESTAMP WITH TIME ZONE,
    cleared_date TIMESTAMP WITH TIME ZONE,
    mttr NUMERIC,
    clients_affected INTEGER,
    olt_name VARCHAR(100),
    classification VARCHAR(50),
    resolution_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for analysis results cache
CREATE TABLE analytics.analysis_cache (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES analytics.uploaded_files(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100),
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_port_failures_file_id ON analytics.port_failures(file_id);
CREATE INDEX idx_degradations_file_id ON analytics.degradations(file_id);
CREATE INDEX idx_multiple_los_file_id ON analytics.multiple_los(file_id);
CREATE INDEX idx_olt_failures_file_id ON analytics.olt_failures(file_id);
CREATE INDEX idx_analysis_cache_file_id ON analytics.analysis_cache(file_id);

-- Create indexes for common query patterns
CREATE INDEX idx_port_failures_region ON analytics.port_failures(region);
CREATE INDEX idx_port_failures_assigned_group ON analytics.port_failures(assigned_group);
CREATE INDEX idx_port_failures_olt_name ON analytics.port_failures(olt_name);
CREATE INDEX idx_port_failures_dates ON analytics.port_failures(reported_date, cleared_date);

-- Add similar indexes for other tables
CREATE INDEX idx_degradations_region ON analytics.degradations(region);
CREATE INDEX idx_degradations_assigned_group ON analytics.degradations(assigned_group);
CREATE INDEX idx_multiple_los_region ON analytics.multiple_los(region);
CREATE INDEX idx_multiple_los_olt_name ON analytics.multiple_los(olt_name);
CREATE INDEX idx_olt_failures_region ON analytics.olt_failures(region);
CREATE INDEX idx_olt_failures_fault_type ON analytics.olt_failures(fault_type);

-- Create analytics_files table
CREATE TABLE IF NOT EXISTS analytics_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'processing'
);

-- Create analytics_data table
CREATE TABLE IF NOT EXISTS analytics_data (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES analytics_files(id) ON DELETE CASCADE,
    ticket_number VARCHAR(100),
    region VARCHAR(100),
    fault_type VARCHAR(100),
    reported_date TIMESTAMP,
    cleared_date TIMESTAMP,
    mttr DECIMAL,
    clients_affected INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_data_file_id ON analytics_data(file_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_region ON analytics_data(region);
CREATE INDEX IF NOT EXISTS idx_analytics_data_fault_type ON analytics_data(fault_type);
CREATE INDEX IF NOT EXISTS idx_analytics_data_reported_date ON analytics_data(reported_date);

-- Create analytics_results_cache table for storing pre-calculated results
CREATE TABLE IF NOT EXISTS analytics_results_cache (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES analytics_files(id) ON DELETE CASCADE,
    result_type VARCHAR(50) NOT NULL,
    result_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster cache lookups
CREATE INDEX IF NOT EXISTS idx_analytics_results_cache_file_id ON analytics_results_cache(file_id);
CREATE INDEX IF NOT EXISTS idx_analytics_results_cache_type ON analytics_results_cache(result_type); 