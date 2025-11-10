import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface GasCalibrationData {
  reference_value: number;
  readings: number[];
  average: number;
  t_value: number | null;
  passed: boolean | null;
  correction_slope: number;
  correction_intercept: number;
}

type CalibrationStep = 'idle' | 'calibrating' | 'computing' | 'complete';
type GasType = 'CO' | 'CO2' | 'O2';

const BACKEND_URL = 'http://169.254.13.182/isga_v4/php-backend';
const TOTAL_READINGS = 30;
const READING_INTERVAL_MS = 6000; // 6 seconds between readings (180s total / 30 readings)
const CRITICAL_T_VALUE = 2.045; // For n=30, df=29, α=0.05

const createEmptyCalibrationData = (defaultRef = 0): GasCalibrationData => ({
  reference_value: defaultRef,
  readings: [],
  average: 0,
  t_value: null,
  passed: null,
  correction_slope: 1,
  correction_intercept: 0,
});

export const useCalibration = () => {
  const { toast } = useToast();

  const [coData, setCoData] = useState<GasCalibrationData>(createEmptyCalibrationData(0));
  const [co2Data, setCo2Data] = useState<GasCalibrationData>(createEmptyCalibrationData(0));
  const [o2Data, setO2Data] = useState<GasCalibrationData>(createEmptyCalibrationData(20.9));

  const [coCalibrationStep, setCoCalibrationStep] = useState<CalibrationStep>('idle');
  const [co2O2CalibrationStep, setCo2O2CalibrationStep] = useState<CalibrationStep>('idle');

  const fetchSensorData = async () => {
    const response = await fetch(`${BACKEND_URL}/get_sensor_data.php`);
    const data = await response.json();
    return {
      co: parseFloat(data.co) || 0,
      co2: parseFloat(data.co2) || 0,
      o2: parseFloat(data.o2) || 0,
    };
  };

  const startCoCalibration = async (coReference: number, onProgress?: (collected: number, total: number) => void) => {
    if (isNaN(coReference)) {
      toast({
        title: "Reference Value Required",
        description: "Please set CO reference value before starting calibration",
        variant: "destructive",
      });
      return { success: false };
    }

    setCoCalibrationStep('calibrating');

    toast({
      title: "CO Calibration Started",
      description: `Capturing 30 readings over 3 minutes...`,
    });

    try {
      const coReadings: number[] = [];

      for (let i = 0; i < TOTAL_READINGS; i++) {
        const sensorData = await fetchSensorData();
        const coValue = Math.min(sensorData.co, 2000); // Cap at 2000 ppm
        coReadings.push(coValue);

        // Update progress
        if (onProgress) {
          onProgress(i + 1, TOTAL_READINGS);
        }

        if (i < TOTAL_READINGS - 1) {
          await new Promise(resolve => setTimeout(resolve, READING_INTERVAL_MS));
        }
      }

      if (coReadings.length === 0) {
        throw new Error("No sensor readings captured");
      }

      const coAvg = coReadings.reduce((a, b) => a + b, 0) / coReadings.length;

      setCoData(prev => ({
        ...prev,
        reference_value: coReference,
        readings: coReadings,
        average: coAvg,
      }));

      toast({
        title: "CO Calibration Complete",
        description: `Average: ${coAvg.toFixed(2)} ppm from ${coReadings.length} readings`,
      });

      setCoCalibrationStep('idle');

      // Auto-compute results
      setTimeout(() => {
        computeCoCalibration(coReference, coReadings, coAvg);
      }, 500);

      return { success: true };
    } catch (error) {
      console.error('Error during CO calibration:', error);
      toast({
        title: "Calibration Failed",
        description: "Failed to capture CO sensor data.",
        variant: "destructive",
      });
      setCoCalibrationStep('idle');
      return { success: false };
    }
  };

  const startCo2O2Calibration = async (co2Reference: number, o2Reference: number, onProgress?: (collected: number, total: number) => void) => {
    if (isNaN(co2Reference) || isNaN(o2Reference)) {
      toast({
        title: "Reference Values Required",
        description: "Please set CO2 and O2 reference values before starting calibration",
        variant: "destructive",
      });
      return { success: false };
    }

    setCo2O2CalibrationStep('calibrating');

    toast({
      title: "CO2 & O2 Calibration Started",
      description: `Capturing 30 readings over 3 minutes...`,
    });

    try {
      const co2Readings: number[] = [];
      const o2Readings: number[] = [];

      for (let i = 0; i < TOTAL_READINGS; i++) {
        const sensorData = await fetchSensorData();
        co2Readings.push(sensorData.co2);
        o2Readings.push(sensorData.o2);

        // Update progress
        if (onProgress) {
          onProgress(i + 1, TOTAL_READINGS);
        }

        if (i < TOTAL_READINGS - 1) {
          await new Promise(resolve => setTimeout(resolve, READING_INTERVAL_MS));
        }
      }

      if (co2Readings.length === 0 || o2Readings.length === 0) {
        throw new Error("No sensor readings captured");
      }

      const co2Avg = co2Readings.reduce((a, b) => a + b, 0) / co2Readings.length;
      const o2Avg = o2Readings.reduce((a, b) => a + b, 0) / o2Readings.length;

      setCo2Data(prev => ({
        ...prev,
        reference_value: co2Reference,
        readings: co2Readings,
        average: co2Avg,
      }));

      setO2Data(prev => ({
        ...prev,
        reference_value: o2Reference,
        readings: o2Readings,
        average: o2Avg,
      }));

      toast({
        title: "CO2 & O2 Calibration Complete",
        description: `CO2: ${co2Avg.toFixed(2)}% | O2: ${o2Avg.toFixed(2)}%`,
      });

      setCo2O2CalibrationStep('idle');

      // Auto-compute results
      setTimeout(() => {
        computeCo2O2Calibration(co2Reference, co2Readings, co2Avg, o2Reference, o2Readings, o2Avg);
      }, 500);

      return { success: true };
    } catch (error) {
      console.error('Error during CO2/O2 calibration:', error);
      toast({
        title: "Calibration Failed",
        description: "Failed to capture CO2/O2 sensor data.",
        variant: "destructive",
      });
      setCo2O2CalibrationStep('idle');
      return { success: false };
    }
  };

  const computeCoCalibration = async (
    referenceValue: number,
    readings: number[],
    sampleMean: number
  ) => {
    setCoCalibrationStep('computing');

    try {
      const n = readings.length;
      const sampleVariance = readings.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) / (n - 1);
      const sampleStdDev = Math.sqrt(sampleVariance);
      const standardError = sampleStdDev / Math.sqrt(n);
      
      const tValue = standardError !== 0 ? (sampleMean - referenceValue) / standardError : 0;
      const passed = Math.abs(tValue) <= CRITICAL_T_VALUE;

      const correctionSlope = sampleMean !== 0 ? referenceValue / sampleMean : 1;
      const correctionIntercept = 0;

      const payload = {
        gas_type: 'CO',
        reference_value: Number(referenceValue),
        readings: readings,
        average: Number(sampleMean),
        t_value: Number(tValue),
        passed: passed ? 1 : 0,
        correction_slope: Number(correctionSlope),
        correction_intercept: Number(correctionIntercept),
      };

      const response = await fetch(`${BACKEND_URL}/save_calibration.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save CO calibration:', errorText);
        throw new Error('Failed to save CO calibration');
      }

      const updatedData: GasCalibrationData = {
        reference_value: referenceValue,
        readings: readings,
        average: sampleMean,
        t_value: tValue,
        passed: passed,
        correction_slope: correctionSlope,
        correction_intercept: correctionIntercept,
      };

      setCoData(updatedData);

      toast({
        title: passed ? "CO Calibration Passed ✓" : "CO Calibration Failed ✗",
        description: `t-value: ${tValue.toFixed(3)} (must be between -2.045 and 2.045)`,
        variant: passed ? "default" : "destructive",
      });

      setCoCalibrationStep('complete');
      setTimeout(() => setCoCalibrationStep('idle'), 3000);

      return { success: true };
    } catch (error) {
      console.error('Error computing CO calibration:', error);
      toast({
        title: "Computation Error",
        description: "Failed to compute CO calibration results",
        variant: "destructive",
      });
      setCoCalibrationStep('idle');
      return { success: false };
    }
  };

  const computeCo2O2Calibration = async (
    co2Reference: number,
    co2Readings: number[],
    co2Mean: number,
    o2Reference: number,
    o2Readings: number[],
    o2Mean: number
  ) => {
    setCo2O2CalibrationStep('computing');

    try {
      // CO2 computation
      const co2N = co2Readings.length;
      const co2Variance = co2Readings.reduce((sum, x) => sum + Math.pow(x - co2Mean, 2), 0) / (co2N - 1);
      const co2StdDev = Math.sqrt(co2Variance);
      const co2SE = co2StdDev / Math.sqrt(co2N);
      const co2TValue = co2SE !== 0 ? (co2Mean - co2Reference) / co2SE : 0;
      const co2Passed = Math.abs(co2TValue) <= CRITICAL_T_VALUE;
      const co2Slope = co2Mean !== 0 ? co2Reference / co2Mean : 1;

      // O2 computation
      const o2N = o2Readings.length;
      const o2Variance = o2Readings.reduce((sum, x) => sum + Math.pow(x - o2Mean, 2), 0) / (o2N - 1);
      const o2StdDev = Math.sqrt(o2Variance);
      const o2SE = o2StdDev / Math.sqrt(o2N);
      const o2TValue = o2SE !== 0 ? (o2Mean - o2Reference) / o2SE : 0;
      const o2Passed = Math.abs(o2TValue) <= CRITICAL_T_VALUE;
      const o2Slope = o2Mean !== 0 ? o2Reference / o2Mean : 1;

      // Save CO2
      const co2Payload = {
        gas_type: 'CO2',
        reference_value: Number(co2Reference),
        readings: co2Readings,
        average: Number(co2Mean),
        t_value: Number(co2TValue),
        passed: co2Passed ? 1 : 0,
        correction_slope: Number(co2Slope),
        correction_intercept: 0,
      };

      // Save O2
      const o2Payload = {
        gas_type: 'O2',
        reference_value: Number(o2Reference),
        readings: o2Readings,
        average: Number(o2Mean),
        t_value: Number(o2TValue),
        passed: o2Passed ? 1 : 0,
        correction_slope: Number(o2Slope),
        correction_intercept: 0,
      };

      await Promise.all([
        fetch(`${BACKEND_URL}/save_calibration.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(co2Payload),
        }),
        fetch(`${BACKEND_URL}/save_calibration.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(o2Payload),
        }),
      ]);

      setCo2Data({
        reference_value: co2Reference,
        readings: co2Readings,
        average: co2Mean,
        t_value: co2TValue,
        passed: co2Passed,
        correction_slope: co2Slope,
        correction_intercept: 0,
      });

      setO2Data({
        reference_value: o2Reference,
        readings: o2Readings,
        average: o2Mean,
        t_value: o2TValue,
        passed: o2Passed,
        correction_slope: o2Slope,
        correction_intercept: 0,
      });

      toast({
        title: co2Passed && o2Passed ? "CO2 & O2 Calibration Passed ✓" : "Calibration Results",
        description: `CO2: ${co2Passed ? '✓' : '✗'} | O2: ${o2Passed ? '✓' : '✗'}`,
        variant: co2Passed && o2Passed ? "default" : "destructive",
      });

      setCo2O2CalibrationStep('complete');
      setTimeout(() => setCo2O2CalibrationStep('idle'), 3000);

      return { success: true };
    } catch (error) {
      console.error('Error computing CO2/O2 calibration:', error);
      toast({
        title: "Computation Error",
        description: "Failed to compute CO2/O2 calibration results",
        variant: "destructive",
      });
      setCo2O2CalibrationStep('idle');
      return { success: false };
    }
  };

  const fetchCalibrationData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/get_calibration.php`);
      if (!response.ok) throw new Error('Failed to fetch calibration data');
      
      const data = await response.json();
      
      if (data.CO) {
        setCoData({
          reference_value: data.CO.reference_value || 0,
          readings: data.CO.readings || [],
          average: data.CO.average || 0,
          t_value: data.CO.t_value,
          passed: data.CO.passed === 1,
          correction_slope: data.CO.correction_slope || 1,
          correction_intercept: data.CO.correction_intercept || 0,
        });
      }
      
      if (data.CO2) {
        setCo2Data({
          reference_value: data.CO2.reference_value || 0,
          readings: data.CO2.readings || [],
          average: data.CO2.average || 0,
          t_value: data.CO2.t_value,
          passed: data.CO2.passed === 1,
          correction_slope: data.CO2.correction_slope || 1,
          correction_intercept: data.CO2.correction_intercept || 0,
        });
      }
      
      if (data.O2) {
        setO2Data({
          reference_value: data.O2.reference_value || 20.9,
          readings: data.O2.readings || [],
          average: data.O2.average || 0,
          t_value: data.O2.t_value,
          passed: data.O2.passed === 1,
          correction_slope: data.O2.correction_slope || 1,
          correction_intercept: data.O2.correction_intercept || 0,
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching calibration data:', error);
      return null;
    }
  };

  const resetCalibration = () => {
    setCoData(createEmptyCalibrationData(0));
    setCo2Data(createEmptyCalibrationData(0));
    setO2Data(createEmptyCalibrationData(20.9));
    setCoCalibrationStep('idle');
    setCo2O2CalibrationStep('idle');

    toast({
      title: "Calibration Reset",
      description: "All calibration data cleared",
    });
  };

  return {
    coData,
    co2Data,
    o2Data,
    coCalibrationStep,
    co2O2CalibrationStep,
    startCoCalibration,
    startCo2O2Calibration,
    resetCalibration,
    fetchSensorData,
    fetchCalibrationData,
  };
};
