import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GasCalibrationData } from "@/hooks/useCalibration";

interface SingleGasCalibrationSectionProps {
  gasName: string;
  gasUnit: string;
  icon: React.ReactNode;
  referenceValue: string;
  onReferenceChange: (value: string) => void;
  calibrationData: GasCalibrationData;
  calibrationStep: 'idle' | 'calibrating' | 'computing' | 'complete';
  onStartCalibration: () => void;
  currentReading: number;
  captureProgress: number;
  readingsCollected: number;
  totalReadings: number;
}

export const SingleGasCalibrationSection = ({
  gasName,
  gasUnit,
  icon,
  referenceValue,
  onReferenceChange,
  calibrationData,
  calibrationStep,
  onStartCalibration,
  currentReading,
  captureProgress,
  readingsCollected,
  totalReadings,
}: SingleGasCalibrationSectionProps) => {
  const isCalibrating = calibrationStep === 'calibrating' || calibrationStep === 'computing';
  const hasResults = calibrationData.passed !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{gasName} Calibration</CardTitle>
          </div>
          {hasResults && (
            <Badge variant={calibrationData.passed ? "default" : "destructive"}>
              {calibrationData.passed ? "PASSED" : "FAILED"}
            </Badge>
          )}
        </div>
        <CardDescription>
          30 readings over 3 minutes | Critical t-value: ±2.045
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reference Value Input */}
        <div className="space-y-2">
          <Label htmlFor={`${gasName}-reference`}>Reference Value ({gasUnit})</Label>
          <Input
            id={`${gasName}-reference`}
            type="number"
            step="0.01"
            value={referenceValue}
            onChange={(e) => onReferenceChange(e.target.value)}
            disabled={isCalibrating}
            placeholder={`Enter ${gasName} reference value`}
          />
        </div>

        {/* Start Calibration Button */}
        {!hasResults && (
          <Button
            onClick={onStartCalibration}
            disabled={isCalibrating || !referenceValue}
            className="w-full"
            size="lg"
          >
            {calibrationStep === 'calibrating'
              ? `Calibrating... (${readingsCollected}/${totalReadings})`
              : calibrationStep === 'computing'
              ? 'Computing Results...'
              : `Start ${gasName} Calibration`}
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
            <div className="text-center">
              <p className="text-2xl font-bold">
                {gasName === "CO" && currentReading > 2000 ? ">2000" : currentReading.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Current Reading ({gasUnit})</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {hasResults && (
          <div className={`space-y-3 p-4 rounded-lg ${calibrationData.passed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Reference Value</p>
                <p className="text-lg font-semibold">
                  {calibrationData.reference_value.toFixed(2)} {gasUnit}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Measured Average</p>
                <p className="text-lg font-semibold">
                  {calibrationData.average.toFixed(2)} {gasUnit}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">T-Value</p>
                <p className="text-lg font-semibold">
                  {calibrationData.t_value?.toFixed(3) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">
                  {calibrationData.passed ? '✓ Pass' : '✗ Fail'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Correction Factor</p>
              <p className="text-sm">
                Slope: {calibrationData.correction_slope.toFixed(4)} | 
                Intercept: {calibrationData.correction_intercept.toFixed(4)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
