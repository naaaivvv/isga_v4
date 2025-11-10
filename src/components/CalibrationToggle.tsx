import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useCalibrationContext } from "@/contexts/CalibrationContext";

export const CalibrationToggle = () => {
  const { useCalibration, toggleCalibration, isCalibrated } = useCalibrationContext();

  if (!isCalibrated) {
    return (
      <Badge variant="outline" className="gap-2">
        <AlertCircle className="w-3 h-3" />
        Uncalibrated
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        {useCalibration ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-600" />
        )}
        <Label htmlFor="calibration-toggle" className="text-sm cursor-pointer">
          {useCalibration ? 'Calibrated Values' : 'Raw Values'}
        </Label>
      </div>
      <Switch
        id="calibration-toggle"
        checked={useCalibration}
        onCheckedChange={toggleCalibration}
      />
    </div>
  );
};
