import { useState, useEffect } from "react";
import { Activity, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import SystemStatus from "@/components/SystemStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SingleGasCalibrationSection } from "@/components/calibration/SingleGasCalibrationSection";
import { DualGasCalibrationSection } from "@/components/calibration/DualGasCalibrationSection";
import { useCalibration } from "@/hooks/useCalibration";
import { useCalibrationContext } from "@/contexts/CalibrationContext";

const Calibration = () => {
  const {
    coData,
    co2Data,
    o2Data,
    coCalibrationStep,
    co2O2CalibrationStep,
    startCoCalibration,
    startCo2O2Calibration,
    resetCalibration,
    fetchSensorData,
  } = useCalibration();

  const { refreshCalibration } = useCalibrationContext();

  const [coReference, setCoReference] = useState("0");
  const [co2Reference, setCo2Reference] = useState("0");
  const [o2Reference, setO2Reference] = useState("20.9");

  const [currentReadings, setCurrentReadings] = useState({ co: 0, co2: 0, o2: 0 });
  const [coCaptureProgress, setCoCaptureProgress] = useState(0);
  const [co2O2CaptureProgress, setCo2O2CaptureProgress] = useState(0);
  const [coReadingsCollected, setCoReadingsCollected] = useState(0);
  const [co2O2ReadingsCollected, setCo2O2ReadingsCollected] = useState(0);

  const TOTAL_READINGS = 30;
  const TOTAL_TIME_MS = 180000; // 3 minutes

  // Real-time sensor reading during CO calibration
  useEffect(() => {
    if (coCalibrationStep !== 'calibrating') {
      return;
    }

    let readingInterval: NodeJS.Timeout;

    const updateReadings = async () => {
      try {
        const data = await fetchSensorData();
        setCurrentReadings(data);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    updateReadings();
    readingInterval = setInterval(updateReadings, 1000);

    return () => {
      clearInterval(readingInterval);
    };
  }, [coCalibrationStep, fetchSensorData]);

  // Real-time sensor reading during CO2/O2 calibration
  useEffect(() => {
    if (co2O2CalibrationStep !== 'calibrating') {
      return;
    }

    let readingInterval: NodeJS.Timeout;

    const updateReadings = async () => {
      try {
        const data = await fetchSensorData();
        setCurrentReadings(data);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    updateReadings();
    readingInterval = setInterval(updateReadings, 1000);

    return () => {
      clearInterval(readingInterval);
    };
  }, [co2O2CalibrationStep, fetchSensorData]);

  const handleStartCoCalibration = async () => {
    setCoReadingsCollected(0);
    setCoCaptureProgress(0);
    
    const result = await startCoCalibration(parseFloat(coReference), (collected, total) => {
      setCoReadingsCollected(collected);
      setCoCaptureProgress((collected / total) * 100);
    });
    
    // Refresh calibration factors after successful calibration
    if (result.success) {
      await refreshCalibration();
    }
  };

  const handleStartCo2O2Calibration = async () => {
    setCo2O2ReadingsCollected(0);
    setCo2O2CaptureProgress(0);
    
    const result = await startCo2O2Calibration(
      parseFloat(co2Reference), 
      parseFloat(o2Reference),
      (collected, total) => {
        setCo2O2ReadingsCollected(collected);
        setCo2O2CaptureProgress((collected / total) * 100);
      }
    );
    
    // Refresh calibration factors after successful calibration
    if (result.success) {
      await refreshCalibration();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Sensor Calibration</h1>
          <p className="text-muted-foreground">
            Independent calibration for CO, CO₂, and O₂ sensors with statistical validation
          </p>
        </header>

        <SystemStatus />

        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">
                  Pre-Calibration Checklist
                </h4>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>Ensure ESP32 is connected and powered on</li>
                  <li>Verify all sensors (CO, CO₂, O₂) are properly connected</li>
                  <li>Allow sensors to warm up for at least 5 minutes before calibration</li>
                  <li>Prepare laboratory-verified reference gases</li>
                  <li>Ensure stable environmental conditions (temperature, humidity)</li>
                  <li>Each calibration trial takes 3 minutes (30 readings)</li>
                  <li>CO is calibrated independently; CO₂ and O₂ are calibrated together</li>
                </ul>
                <p className="text-sm text-amber-800 mt-3 font-medium">
                  ⚠️ Do not interrupt the calibration process once started. Statistical validation requires |t-value| ≤ 2.045 to pass.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Calibration Process</AlertTitle>
          <AlertDescription>
            Set reference values → Start calibration (3 min per section) → Review t-test results
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* CO Calibration Section */}
          <SingleGasCalibrationSection
            gasName="CO"
            gasUnit="ppm"
            icon={<Activity className="w-5 h-5 text-red-500" />}
            referenceValue={coReference}
            onReferenceChange={setCoReference}
            calibrationData={coData}
            calibrationStep={coCalibrationStep}
            onStartCalibration={handleStartCoCalibration}
            currentReading={currentReadings.co}
            captureProgress={coCaptureProgress}
            readingsCollected={coReadingsCollected}
            totalReadings={TOTAL_READINGS}
          />

          {/* CO2 & O2 Calibration Section */}
          <DualGasCalibrationSection
            co2Reference={co2Reference}
            o2Reference={o2Reference}
            onCo2ReferenceChange={setCo2Reference}
            onO2ReferenceChange={setO2Reference}
            co2Data={co2Data}
            o2Data={o2Data}
            calibrationStep={co2O2CalibrationStep}
            onStartCalibration={handleStartCo2O2Calibration}
            currentCo2Reading={currentReadings.co2}
            currentO2Reading={currentReadings.o2}
            captureProgress={co2O2CaptureProgress}
            readingsCollected={co2O2ReadingsCollected}
            totalReadings={TOTAL_READINGS}
          />

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button
              onClick={resetCalibration}
              variant="outline"
              disabled={coCalibrationStep !== 'idle' || co2O2CalibrationStep !== 'idle'}
            >
              Reset All Calibration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calibration;