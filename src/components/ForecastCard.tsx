import { Card } from "@/components/ui/card";
import { Cloud, CloudRain, Sun } from "lucide-react";

interface ForecastCardProps {
  day: string;
  temperature: number;
  condition: string;
  isCelsius: boolean;
}

const ForecastCard = ({ day, temperature, condition, isCelsius }: ForecastCardProps) => {
  const getWeatherIcon = () => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain')) {
      return <CloudRain className="w-8 h-8 text-primary" />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-muted-foreground" />;
    } else {
      return <Sun className="w-8 h-8 text-accent" />;
    }
  };

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-border hover:shadow-card-custom transition-all duration-300 hover:scale-105">
      <div className="flex flex-col items-center gap-3">
        <p className="font-semibold text-foreground">{day}</p>
        {getWeatherIcon()}
        <p className="text-2xl font-bold text-foreground">
          {Math.round(temperature)}°{isCelsius ? 'C' : 'F'}
        </p>
        <p className="text-sm text-muted-foreground">{condition}</p>
      </div>
    </Card>
  );
};

export default ForecastCard;
