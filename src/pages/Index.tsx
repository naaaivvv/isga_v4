import { useEffect, useState, useMemo } from "react";
import { Activity, Droplet, Wind } from "lucide-react";
import '../ChartColor.css';
import Navbar from "@/components/Navbar";
import SystemStatus from "@/components/SystemStatus";
import SensorDataCards from "@/components/SensorDataCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useCalibrationContext } from "@/contexts/CalibrationContext";

interface HistoricalData {
  timestamp: string;
  co: number;
  co2: number;
  o2: number;
}

const Index = () => {
  const [historicalDataRaw, setHistoricalDataRaw] = useState<HistoricalData[]>([]);
  const { applyCorrectionCO, applyCorrectionCO2, applyCorrectionO2 } = useCalibrationContext();

  // Fetch historical sensor data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch("http://192.168.1.9/isga_v4/php-backend/get_sensor_history.php");
        const data: HistoricalData[] = await response.json();

        // Store raw data and convert CO2 from ppm to percent
        const processedData = data.map(item => ({
          timestamp: item.timestamp,
          co: Number(item.co) || 0,
          co2: (Number(item.co2) || 0) / 10000, // Convert ppm to percent
          o2: Number(item.o2) || 0,
        }));

        setHistoricalDataRaw(processedData);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchHistoricalData();
    const interval = setInterval(fetchHistoricalData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Apply calibration to historical data based on toggle
  const historicalData = useMemo(() => {
    return historicalDataRaw.map(item => ({
      timestamp: item.timestamp,
      co: Math.min(applyCorrectionCO(item.co), 2000), // Cap CO at 2000 ppm
      co2: applyCorrectionCO2(item.co2),
      o2: applyCorrectionO2(item.o2),
    }));
  }, [historicalDataRaw, applyCorrectionCO, applyCorrectionCO2, applyCorrectionO2]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Industrial Stack Gas Analyzer - Real-time monitoring and control system
          </p>
        </header>

        <SystemStatus />
        
        <SensorDataCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CO Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Carbon Monoxide (CO)
              </CardTitle>
              <CardDescription>Historical CO levels (ppm)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  co: {
                    label: "CO",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px] w-full"
              >
                <LineChart data={historicalData} width={400} height={200}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 2000]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="co" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* CO2 Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-orange-500" />
                Carbon Dioxide (CO₂)
              </CardTitle>
              <CardDescription>Historical CO₂ levels (%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  co2: {
                    label: "CO₂",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[200px] w-full"
              >
                <LineChart data={historicalData} width={400} height={200}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="co2" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* O2 Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-primary" />
                Oxygen (O₂)
              </CardTitle>
              <CardDescription>Historical O₂ levels (%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  o2: {
                    label: "O₂",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[200px] w-full"
              >
                <LineChart data={historicalData} width={400} height={200}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="o2" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
