-- Calibration table for single trial with 30 readings
-- Simplified structure matching actual usage

CREATE TABLE IF NOT EXISTS calibration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gas_type ENUM('CO', 'CO2', 'O2') NOT NULL,
  reference_value FLOAT NOT NULL COMMENT 'Laboratory reference value',
  
  -- Single trial data (30 samples over 180 seconds)
  readings TEXT COMMENT 'JSON array of 30 readings',
  average FLOAT COMMENT 'Average of 30 readings',
  
  -- Statistical validation (n=30, df=29, critical value = ±2.045)
  t_value FLOAT COMMENT 'T-test result',
  passed TINYINT(1) DEFAULT 0 COMMENT '1 if |t_value| <= 2.045, 0 if failed',
  
  -- Correction factors for calibration
  correction_slope FLOAT DEFAULT 1,
  correction_intercept FLOAT DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_gas_type (gas_type)
);

-- Insert default values if not exists
INSERT INTO calibration (gas_type, reference_value, passed) VALUES 
  ('CO', 0, 0),
  ('CO2', 0, 0),
  ('O2', 20.9, 0)
ON DUPLICATE KEY UPDATE gas_type = gas_type;
