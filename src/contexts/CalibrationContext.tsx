import React, { createContext, useContext, useState, useEffect } from 'react';

interface CalibrationFactors {
  co: { slope: number; intercept: number; passed: boolean } | null;
  co2: { slope: number; intercept: number; passed: boolean } | null;
  o2: { slope: number; intercept: number; passed: boolean } | null;
}

interface CalibrationContextType {
  calibrationFactors: CalibrationFactors;
  useCalibration: boolean;
  toggleCalibration: () => void;
  applyCorrectionCO: (raw: number) => number;
  applyCorrectionCO2: (raw: number) => number;
  applyCorrectionO2: (raw: number) => number;
  isCalibrated: boolean;
  refreshCalibration: () => Promise<void>;
}

const CalibrationContext = createContext<CalibrationContextType | undefined>(undefined);

const BACKEND_URL = 'http://169.254.13.182/isga_v4/php-backend';

export const CalibrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calibrationFactors, setCalibrationFactors] = useState<CalibrationFactors>({
    co: null,
    co2: null,
    o2: null,
  });
  const [useCalibration, setUseCalibration] = useState(true);

  const fetchCalibrationFactors = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/get_calibration.php`);
      if (!response.ok) {
        console.error('Failed to fetch calibration factors, HTTP status:', response.status);
        return;
      }
      
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Invalid JSON response from calibration endpoint:', text.substring(0, 200));
        return;
      }
      
      // Handle error response
      if (data.error) {
        console.error('API error:', data.error);
        return;
      }
      
      setCalibrationFactors({
        co: data.CO ? {
          slope: data.CO.correction_slope || 1,
          intercept: data.CO.correction_intercept || 0,
          passed: data.CO.passed === 1,
        } : null,
        co2: data.CO2 ? {
          slope: data.CO2.correction_slope || 1,
          intercept: data.CO2.correction_intercept || 0,
          passed: data.CO2.passed === 1,
        } : null,
        o2: data.O2 ? {
          slope: data.O2.correction_slope || 1,
          intercept: data.O2.correction_intercept || 0,
          passed: data.O2.passed === 1,
        } : null,
      });
    } catch (error) {
      console.error('Error fetching calibration factors:', error);
    }
  };

  useEffect(() => {
    fetchCalibrationFactors();
    
    // Refresh calibration factors every 30 seconds
    const interval = setInterval(fetchCalibrationFactors, 30000);
    return () => clearInterval(interval);
  }, []);

  const applyCorrectionCO = (raw: number): number => {
    if (!useCalibration || !calibrationFactors.co || !calibrationFactors.co.passed) {
      return raw;
    }
    const corrected = (raw * calibrationFactors.co.slope) + calibrationFactors.co.intercept;
    return Math.max(0, corrected); // Ensure non-negative
  };

  const applyCorrectionCO2 = (raw: number): number => {
    if (!useCalibration || !calibrationFactors.co2 || !calibrationFactors.co2.passed) {
      return raw;
    }
    const corrected = (raw * calibrationFactors.co2.slope) + calibrationFactors.co2.intercept;
    return Math.max(0, corrected);
  };

  const applyCorrectionO2 = (raw: number): number => {
    if (!useCalibration || !calibrationFactors.o2 || !calibrationFactors.o2.passed) {
      return raw;
    }
    const corrected = (raw * calibrationFactors.o2.slope) + calibrationFactors.o2.intercept;
    return Math.max(0, corrected);
  };

  const toggleCalibration = () => {
    setUseCalibration(prev => !prev);
  };

  const isCalibrated = !!(
    calibrationFactors.co?.passed || 
    calibrationFactors.co2?.passed || 
    calibrationFactors.o2?.passed
  );

  return (
    <CalibrationContext.Provider
      value={{
        calibrationFactors,
        useCalibration,
        toggleCalibration,
        applyCorrectionCO,
        applyCorrectionCO2,
        applyCorrectionO2,
        isCalibrated,
        refreshCalibration: fetchCalibrationFactors,
      }}
    >
      {children}
    </CalibrationContext.Provider>
  );
};

export const useCalibrationContext = () => {
  const context = useContext(CalibrationContext);
  if (context === undefined) {
    throw new Error('useCalibrationContext must be used within a CalibrationProvider');
  }
  return context;
};
