-- SQL script to create co2_settings table
-- Run this in your MySQL database 'isga'

CREATE TABLE IF NOT EXISTS co2_settings (
  id INT PRIMARY KEY DEFAULT 1,
  use_co2_from_o2 TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default setting
INSERT INTO co2_settings (id, use_co2_from_o2) VALUES (1, 0)
ON DUPLICATE KEY UPDATE id = id;
