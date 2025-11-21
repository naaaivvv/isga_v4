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
  applyCorrectionCO2: (raw: number, o2Value?: number) => number;
  applyCorrectionO2: (raw: number) => number;
  isCalibrated: boolean;
  refreshCalibration: () => Promise<void>;
  useCO2FromO2: boolean;
  toggleCO2FromO2: () => void;
}

const CalibrationContext = createContext<CalibrationContextType | undefined>(undefined);

const BACKEND_URL = 'http://192.168.1.3/isga_v4/php-backend';

export const CalibrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calibrationFactors, setCalibrationFactors] = useState<CalibrationFactors>({
    co: null,
    co2: null,
    o2: null,
  });
  const [useCalibration, setUseCalibration] = useState(true);
  const [useCO2FromO2, setUseCO2FromO2] = useState(false);

  // Fetch CO2 from O2 setting from backend
  const fetchCO2Setting = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/get_co2_setting.php`);
      if (response.ok) {
        const data = await response.json();
        setUseCO2FromO2(data.use_co2_from_o2 === 1);
      }
    } catch (error) {
      console.error('Error fetching CO2 setting:', error);
    }
  };

  // Save CO2 from O2 setting to backend
  const saveCO2Setting = async (enabled: boolean) => {
    try {
      const formData = new FormData();
      formData.append('use_co2_from_o2', enabled ? '1' : '0');
      
      await fetch(`${BACKEND_URL}/save_co2_setting.php`, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Error saving CO2 setting:', error);
    }
  };

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
    fetchCO2Setting();
    
    // Refresh calibration factors every 30 seconds
    const interval = setInterval(() => {
      fetchCalibrationFactors();
      fetchCO2Setting();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const applyCorrectionCO = (raw: number): number => {
    if (!useCalibration || !calibrationFactors.co || !calibrationFactors.co.passed) {
      return raw;
    }
    const corrected = (raw * calibrationFactors.co.slope) + calibrationFactors.co.intercept;
    return Math.max(0, corrected); // Ensure non-negative
  };

  const applyCorrectionCO2 = (raw: number, o2Value?: number): number => {
    // If O2-based calculation is enabled, calculate CO2 from O2
    if (useCO2FromO2 && o2Value !== undefined) {
      return Math.max(0, 20.90 - o2Value);
    }
    
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

  const toggleCO2FromO2 = () => {
    setUseCO2FromO2(prev => {
      const newValue = !prev;
      saveCO2Setting(newValue);
      return newValue;
    });
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
        useCO2FromO2,
        toggleCO2FromO2,
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
