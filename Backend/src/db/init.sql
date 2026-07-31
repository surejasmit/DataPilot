-- Core tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_name VARCHAR(255),
    dataset_path TEXT,
    dataset_size BIGINT,
    dataset_rows INTEGER,
    dataset_columns INTEGER,
    status VARCHAR(50) DEFAULT 'uploaded',
    favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dataset tables
CREATE TABLE IF NOT EXISTS dataset_columns (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(100),
    position INTEGER,
    missing_count INTEGER DEFAULT 0,
    missing_percentage NUMERIC,
    unique_count INTEGER,
    min_value NUMERIC,
    max_value NUMERIC,
    mean_value NUMERIC,
    median_value NUMERIC,
    mode_value VARCHAR(255),
    std_dev NUMERIC,
    q1 NUMERIC,
    q3 NUMERIC,
    is_numeric BOOLEAN,
    is_categorical BOOLEAN,
    is_datetime BOOLEAN,
    is_boolean BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_preview (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    row_data JSONB,
    row_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_statistics (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    min_value NUMERIC,
    max_value NUMERIC,
    mean_value NUMERIC,
    median_value NUMERIC,
    mode_value VARCHAR(255),
    std_dev NUMERIC,
    variance NUMERIC,
    q1 NUMERIC,
    q3 NUMERIC,
    iqr NUMERIC,
    missing_count INTEGER DEFAULT 0,
    missing_percentage NUMERIC,
    unique_count INTEGER,
    range_value NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_chart_recommendations (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    chart_type VARCHAR(100),
    title VARCHAR(255),
    columns JSONB,
    reason TEXT,
    position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_profile (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    total_rows INTEGER,
    total_columns INTEGER,
    missing_values_total INTEGER,
    missing_percentage NUMERIC,
    duplicate_rows INTEGER,
    duplicate_percentage NUMERIC,
    empty_columns TEXT[],
    numeric_columns TEXT[],
    categorical_columns TEXT[],
    datetime_columns TEXT[],
    boolean_columns TEXT[],
    memory_usage_bytes BIGINT,
    dataset_size_bytes BIGINT,
    dataset_shape VARCHAR(100),
    file_encoding VARCHAR(100),
    processing_time_ms INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_status (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50),
    message TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis tables
CREATE TABLE IF NOT EXISTS dataset_quality_report (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    total_rows INTEGER DEFAULT 0,
    missing_values INTEGER DEFAULT 0,
    missing_percentage NUMERIC DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    duplicate_percentage NUMERIC DEFAULT 0,
    empty_columns TEXT[] DEFAULT '{}',
    constant_columns TEXT[] DEFAULT '{}',
    mixed_type_columns TEXT[] DEFAULT '{}',
    outlier_columns TEXT[] DEFAULT '{}',
    high_cardinality_columns TEXT[] DEFAULT '{}',
    date_columns TEXT[] DEFAULT '{}',
    categorical_columns TEXT[] DEFAULT '{}',
    numeric_columns TEXT[] DEFAULT '{}',
    issues JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_cleaning_history (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    operation VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_insights (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    insight_type VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    details JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info',
    confidence NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_operation_history (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    operation VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for dataset_columns upsert
ALTER TABLE dataset_columns DROP CONSTRAINT IF EXISTS dataset_columns_dataset_id_column_name_key;
ALTER TABLE dataset_columns ADD CONSTRAINT dataset_columns_dataset_id_column_name_key UNIQUE (dataset_id, column_name);

-- Unique constraint for dataset_quality_report
ALTER TABLE dataset_quality_report DROP CONSTRAINT IF EXISTS dataset_quality_report_dataset_id_key;
ALTER TABLE dataset_quality_report ADD CONSTRAINT dataset_quality_report_dataset_id_key UNIQUE (dataset_id);

-- Unique constraint for dataset_profile
ALTER TABLE dataset_profile DROP CONSTRAINT IF EXISTS dataset_profile_dataset_id_key;
ALTER TABLE dataset_profile ADD CONSTRAINT dataset_profile_dataset_id_key UNIQUE (dataset_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dataset_columns_dataset_id ON dataset_columns(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_preview_dataset_id ON dataset_preview(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_statistics_dataset_id ON dataset_statistics(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_chart_recommendations_dataset_id ON dataset_chart_recommendations(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_profile_dataset_id ON dataset_profile(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_status_dataset_id ON dataset_status(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_status_created_at ON dataset_status(dataset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dataset_quality_report_dataset_id ON dataset_quality_report(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_cleaning_history_dataset_id ON dataset_cleaning_history(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_insights_dataset_id ON dataset_insights(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_operation_history_dataset_id ON dataset_operation_history(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_operation_history_created_at ON dataset_operation_history(dataset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);