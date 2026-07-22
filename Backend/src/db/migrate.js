const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const migrationSQL = `
-- Add unique constraint for dataset_columns to support upsert
ALTER TABLE dataset_columns DROP CONSTRAINT IF EXISTS dataset_columns_dataset_id_column_name_key;
ALTER TABLE dataset_columns ADD CONSTRAINT dataset_columns_dataset_id_column_name_key UNIQUE (dataset_id, column_name);

-- Create dataset_statistics table
CREATE TABLE IF NOT EXISTS dataset_statistics (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  column_name VARCHAR(255) NOT NULL,
  min_value DECIMAL(20,4),
  max_value DECIMAL(20,4),
  mean_value DECIMAL(20,4),
  median_value DECIMAL(20,4),
  mode_value VARCHAR(255),
  std_dev DECIMAL(20,4),
  variance DECIMAL(20,4),
  q1 DECIMAL(20,4),
  q3 DECIMAL(20,4),
  iqr DECIMAL(20,4),
  range_value DECIMAL(20,4),
  missing_count INTEGER DEFAULT 0,
  missing_percentage DECIMAL(5,2) DEFAULT 0,
  unique_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dataset_chart_recommendations table
CREATE TABLE IF NOT EXISTS dataset_chart_recommendations (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chart_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  columns JSONB NOT NULL,
  reason TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dataset_status table for tracking processing history
CREATE TABLE IF NOT EXISTS dataset_status (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure projects table has proper status values and constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'status' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'draft';
  END IF;
END $$;

-- Add dataset_status if not present (legacy migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ 
    JOIN pg_enum en ON en.enumtypid = typ.oid 
    WHERE typ.typname = 'dataset_status_enum'
  ) THEN
    -- Not using enum to keep it simple, just use varchar
  END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_dataset_statistics_dataset_id ON dataset_statistics(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_chart_recommendations_dataset_id ON dataset_chart_recommendations(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_status_dataset_id ON dataset_status(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_status_created_at ON dataset_status(dataset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dataset_preview_row_index ON dataset_preview(dataset_id, row_index);

-- Create dataset_quality_report table
CREATE TABLE IF NOT EXISTS dataset_quality_report (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  total_rows INTEGER DEFAULT 0,
  missing_values INTEGER DEFAULT 0,
  missing_percentage DECIMAL(5,2) DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  duplicate_percentage DECIMAL(5,2) DEFAULT 0,
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

-- Create dataset_cleaning_history table
CREATE TABLE IF NOT EXISTS dataset_cleaning_history (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  operation VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dataset_insights table
CREATE TABLE IF NOT EXISTS dataset_insights (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  details JSONB DEFAULT '{}',
  severity VARCHAR(20) DEFAULT 'info',
  confidence DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dataset_operation_history table
CREATE TABLE IF NOT EXISTS dataset_operation_history (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  operation VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_quality_report_dataset_id ON dataset_quality_report(dataset_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_history_dataset_id ON dataset_cleaning_history(dataset_id);
CREATE INDEX IF NOT EXISTS idx_insights_dataset_id ON dataset_insights(dataset_id);
CREATE INDEX IF NOT EXISTS idx_operation_history_dataset_id ON dataset_operation_history(dataset_id);
CREATE INDEX IF NOT EXISTS idx_operation_history_created_at ON dataset_operation_history(dataset_id, created_at DESC);
`;

async function runMigration() {
  try {
    console.log('Running database migration...');
    await pool.query(migrationSQL);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();