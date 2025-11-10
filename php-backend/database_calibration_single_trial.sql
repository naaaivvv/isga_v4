-- Updated calibration table for single trial with 30 readings
-- This supports the new calibration approach

-- Create new unified calibration table with single trial structure
CREATE TABLE IF NOT EXISTS calibration_v2 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gas_type ENUM('CO', 'CO2', 'O2') NOT NULL,
  reference_value FLOAT NOT NULL COMMENT 'Laboratory reference value',
  
  -- Single trial data (30 samples over 240 seconds)
  trial_1_readings TEXT COMMENT 'JSON array of 30 readings',
  trial_2_readings TEXT COMMENT 'Legacy field - kept for compatibility',
  trial_3_readings TEXT COMMENT 'Legacy field - kept for compatibility',
  
  -- Calculated averages
  trial_1_avg FLOAT COMMENT 'Average of 30 readings',
  trial_2_avg FLOAT COMMENT 'Legacy field - kept for compatibility',
  trial_3_avg FLOAT COMMENT 'Legacy field - kept for compatibility',
  
  -- Statistical validation (n=30, df=29, critical value = ±2.045)
  t_value FLOAT COMMENT 'T-test result',
  passed TINYINT(1) COMMENT '1 if |t_value| <= 2.045, 0 if failed',
  
  -- Linear regression correction factors
  correction_slope FLOAT DEFAULT 1,
  correction_intercept FLOAT DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_gas_type (gas_type)
);

-- Insert default values if not exists
INSERT INTO calibration_v2 (gas_type, reference_value, passed) VALUES 
  ('CO', 0, 0),
  ('CO2', 0, 0),
  ('O2', 20.9, 0)
ON DUPLICATE KEY UPDATE gas_type = gas_type;
