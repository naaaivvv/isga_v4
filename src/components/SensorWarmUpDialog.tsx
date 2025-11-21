import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Clock, AlertTriangle } from "lucide-react";

interface SensorWarmUpDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

const WARMUP_DURATION = 300; // 5 minutes in seconds

export const SensorWarmUpDialog = ({ isOpen, onComplete }: SensorWarmUpDialogProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(WARMUP_DURATION);

  useEffect(() => {
    if (!isOpen) {
      setRemainingSeconds(WARMUP_DURATION);
      sessionStorage.removeItem('warmUpStartTime');
      return;
    }

    // Get or create warm-up start time (same pattern as UptimeContext)
    let warmUpStart = sessionStorage.getItem('warmUpStartTime');
    
    if (!warmUpStart) {
      warmUpStart = Date.now().toString();
      sessionStorage.setItem('warmUpStartTime', warmUpStart);
    }

    // Calculate remaining time (same pattern as UptimeContext)
    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - parseInt(warmUpStart!)) / 1000);
      const remaining = Math.max(0, WARMUP_DURATION - elapsed);
      
      setRemainingSeconds(remaining);
      
      if (remaining === 0) {
        sessionStorage.removeItem('warmUpStartTime');
        setTimeout(onComplete, 500);
      }
    };

    // Calculate immediately
    calculateRemaining();

    // Update every second
    const timer = setInterval(calculateRemaining, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((WARMUP_DURATION - remainingSeconds) / WARMUP_DURATION) * 100;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Thermometer className="w-16 h-16 text-orange-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Sensors Warming Up
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="text-center space-y-4 text-sm text-muted-foreground">
          <div className="text-base">
            Please wait while the gas sensors reach optimal operating temperature.
            This process ensures accurate readings.
          </div>
          
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-mono text-2xl">{formatTime(remainingSeconds)}</span>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="text-sm text-muted-foreground">
              {remainingSeconds > 240 ? "Initializing sensors..." : 
               remainingSeconds > 120 ? "Stabilizing temperature..." :
               remainingSeconds > 60 ? "Almost ready..." :
               "Final calibration..."}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Do not disconnect power or interrupt the system during this warm-up period.
                Sensor readings will be available once complete.
              </span>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
