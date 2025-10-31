import React from "react";
import { Card } from "@/components/ui/card";
import { Clock, Droplets, Wind } from "lucide-react";
import type { HourlyForecast } from "@/lib/types";

interface HourlyForecastCardProps {
  hourlyData: HourlyForecast[];
  isCelsius: boolean;
}

const HourlyForecastCard: React.FC<HourlyForecastCardProps> = ({ hourlyData, isCelsius }) => {
  const convertTemperature = (temp: number) => {
    return isCelsius ? temp : Math.round((temp * 9/5) + 32);
  };

  if (!hourlyData || hourlyData.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">24-Hour Forecast</h3>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {hourlyData.map((hour, index) => (
            <Card 
              key={`hour-${index}`} 
              className="flex-shrink-0 w-28 p-3 bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="text-center space-y-2">
                <p className="font-semibold text-primary text-sm">{hour.time}</p>
                <p className="text-2xl font-bold text-foreground">
                  {convertTemperature(hour.temperature)}°
                </p>
                <p className="text-xs text-muted-foreground leading-tight min-h-[2.5rem] flex items-center justify-center">
                  {hour.condition}
                </p>
                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Droplets className="w-3 h-3" />
                    <span>{hour.humidity}%</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Wind className="w-3 h-3" />
                    <span>{hour.windSpeed} km/h</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center rounded-md bg-accent/20 px-2 py-1 border border-border">
          Next 24 hours from now
        </span>
      </div>
    </Card>
  );
};

export default HourlyForecastCard;
