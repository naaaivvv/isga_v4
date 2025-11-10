import { useEffect, useState } from "react";
import { Activity, Droplet, Wind } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCalibrationContext } from "@/contexts/CalibrationContext";

const SensorDataCards = () => {
  const [coRaw, setCoRaw] = useState(0);
  const [co2Raw, setCo2Raw] = useState(0);
  const [o2Raw, setO2Raw] = useState(0);
  
  const { applyCorrectionCO, applyCorrectionCO2, applyCorrectionO2, useCalibration } = useCalibrationContext();

  // Fetch sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("http://169.254.13.182/isga_v4/php-backend/get_sensor_data.php");
        const data = await response.json();

        // Store raw values
        setCoRaw(Number(data.co) || 0);
        const co2ppm = Number(data.co2) || 0;
        setCo2Raw(co2ppm / 10000); // Convert ppm to percent
        setO2Raw(Number(data.o2) || 0);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Apply calibration based on toggle
  const coLevel = applyCorrectionCO(coRaw);
  const co2Level = applyCorrectionCO2(co2Raw);
  const o2Level = applyCorrectionO2(o2Raw);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* CO Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Carbon Monoxide (CO)
            </span>
            {useCalibration && <Badge variant="secondary" className="text-xs">Calibrated</Badge>}
          </CardTitle>
          <CardDescription>Current CO levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                {coLevel > 2000 ? ">2000" : coLevel.toFixed(1)}
              </span>
              <span className="text-muted-foreground">ppm</span>
            </div>
            <Progress value={Math.min(coLevel, 2000)} className="h-2" />
            <p className="text-sm text-muted-foreground">Safe limit: 50 ppm | Max detection: 2000 ppm</p>
          </div>
        </CardContent>
      </Card>

      {/* CO2 Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-orange-500" />
              Carbon Dioxide (CO₂)
            </span>
            {useCalibration && <Badge variant="secondary" className="text-xs">Calibrated</Badge>}
          </CardTitle>
          <CardDescription>Current CO₂ levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                {co2Level.toFixed(2)}
              </span>
              <span className="text-muted-foreground">%</span>
            </div>
            <Progress value={(co2Level / 5) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground">Safe limit: ≤ 0.5%</p>
          </div>
        </CardContent>
      </Card>

      {/* O2 Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              Oxygen (O₂)
            </span>
            {useCalibration && <Badge variant="secondary" className="text-xs">Calibrated</Badge>}
          </CardTitle>
          <CardDescription>Current O₂ levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                {o2Level.toFixed(1)}
              </span>
              <span className="text-muted-foreground">%</span>
            </div>
            <Progress value={(o2Level / 21) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground">Normal: 19.5–23.5%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorDataCards;
