import { Droplet, Wind } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GasCalibrationData } from "@/hooks/useCalibration";

interface DualGasCalibrationSectionProps {
  co2Reference: string;
  o2Reference: string;
  onCo2ReferenceChange: (value: string) => void;
  onO2ReferenceChange: (value: string) => void;
  co2Data: GasCalibrationData;
  o2Data: GasCalibrationData;
  calibrationStep: 'idle' | 'calibrating' | 'computing' | 'complete';
  onStartCalibration: () => void;
  currentCo2Reading: number;
  currentO2Reading: number;
  captureProgress: number;
  readingsCollected: number;
  totalReadings: number;
}

export const DualGasCalibrationSection = ({
  co2Reference,
  o2Reference,
  onCo2ReferenceChange,
  onO2ReferenceChange,
  co2Data,
  o2Data,
  calibrationStep,
  onStartCalibration,
  currentCo2Reading,
  currentO2Reading,
  captureProgress,
  readingsCollected,
  totalReadings,
}: DualGasCalibrationSectionProps) => {
  const isCalibrating = calibrationStep === 'calibrating' || calibrationStep === 'computing';
  const hasResults = co2Data.passed !== null && o2Data.passed !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>CO₂ & O₂ Calibration</CardTitle>
          {hasResults && (
            <div className="flex gap-2">
              <Badge variant={co2Data.passed ? "default" : "destructive"}>
                CO₂: {co2Data.passed ? "PASSED" : "FAILED"}
              </Badge>
              <Badge variant={o2Data.passed ? "default" : "destructive"}>
                O₂: {o2Data.passed ? "PASSED" : "FAILED"}
              </Badge>
            </div>
          )}
        </div>
        <CardDescription>
          Simultaneous calibration | 30 readings over 3 minutes | Critical t-value: ±2.045
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reference Value Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co2-reference">CO₂ Reference (%)</Label>
            <Input
              id="co2-reference"
              type="number"
              step="0.01"
              value={co2Reference}
              onChange={(e) => onCo2ReferenceChange(e.target.value)}
              disabled={isCalibrating}
              placeholder="Enter CO₂ reference"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="o2-reference">O₂ Reference (%)</Label>
            <Input
              id="o2-reference"
              type="number"
              step="0.01"
              value={o2Reference}
              onChange={(e) => onO2ReferenceChange(e.target.value)}
              disabled={isCalibrating}
              placeholder="Enter O₂ reference"
            />
          </div>
        </div>

        {/* Start Calibration Button */}
        {!hasResults && (
          <Button
            onClick={onStartCalibration}
            disabled={isCalibrating || !co2Reference || !o2Reference}
            className="w-full"
            size="lg"
          >
            {calibrationStep === 'calibrating'
              ? `Calibrating... (${readingsCollected}/${totalReadings})`
              : calibrationStep === 'computing'
              ? 'Computing Results...'
              : 'Start CO₂ & O₂ Calibration'}
          </Button>
        )}

        {/* Progress Display */}
        {isCalibrating && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{readingsCollected} / {totalReadings} readings</span>
            </div>
            <Progress value={captureProgress} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-background rounded">
                <Droplet className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{currentCo2Reading.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">CO₂ (%)</p>
              </div>
              <div className="text-center p-3 bg-background rounded">
                <Wind className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{currentO2Reading.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">O₂ (%)</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {hasResults && (
          <div className="grid grid-cols-2 gap-4">
            {/* CO2 Results */}
            <div className={`space-y-3 p-4 rounded-lg ${co2Data.passed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                <h4 className="font-semibold">CO₂ Results</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Reference</p>
                  <p className="text-lg font-semibold">{co2Data.reference_value.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Measured Avg</p>
                  <p className="text-lg font-semibold">{co2Data.trial_avg.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">T-Value</p>
                  <p className="text-lg font-semibold">{co2Data.t_value?.toFixed(3) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{co2Data.passed ? '✓ Pass' : '✗ Fail'}</p>
                </div>
              </div>
            </div>

            {/* O2 Results */}
            <div className={`space-y-3 p-4 rounded-lg ${o2Data.passed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-4 h-4 text-green-500" />
                <h4 className="font-semibold">O₂ Results</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Reference</p>
                  <p className="text-lg font-semibold">{o2Data.reference_value.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Measured Avg</p>
                  <p className="text-lg font-semibold">{o2Data.trial_avg.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">T-Value</p>
                  <p className="text-lg font-semibold">{o2Data.t_value?.toFixed(3) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{o2Data.passed ? '✓ Pass' : '✗ Fail'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
