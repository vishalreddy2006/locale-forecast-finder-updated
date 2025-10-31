import { Card } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, Wind, Droplets, ThermometerSun, ThermometerSnowflake } from "lucide-react";

interface WeatherCardProps {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  isCelsius: boolean;
  localTime?: string;
  // discrete fields
  city?: string;
  town?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
  // where the coords came from: 'geolocation' | 'ip' | 'search' | 'saved'
  locationSource?: string;
  todayMinTemp?: number;
  todayMaxTemp?: number;
}

const WeatherCard = ({ 
  temperature, 
  condition, 
  humidity, 
  windSpeed, 
  location,
  isCelsius,
  localTime,
  city,
  town,
  district,
  state,
  country,
  postcode,
  locationSource,
  todayMinTemp,
  todayMaxTemp,
}: WeatherCardProps) => {
  const convertTemperature = (temp: number) => {
    return isCelsius ? temp : Math.round((temp * 9/5) + 32);
  };
  const getWeatherIcon = () => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain')) {
      return <CloudRain className="w-24 h-24 text-primary" />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud className="w-24 h-24 text-muted-foreground" />;
    } else {
      return <Sun className="w-24 h-24 text-accent" />;
    }
  };

  const getBackgroundGradient = () => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain')) {
      return 'bg-gradient-rainy';
    } else if (conditionLower.includes('cloud')) {
      return 'bg-gradient-cloudy';
    } else if (conditionLower.includes('clear')) {
      return 'bg-gradient-clear';
    } else {
      return 'bg-gradient-sunny';
    }
  };

  return (
    <Card className={`${getBackgroundGradient()} p-8 text-white border-0 shadow-glass backdrop-blur-sm animate-fade-in`}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">{location}</h2>
          <p className="text-white/90 text-lg">{condition}</p>
          {localTime && (
            <p className="text-white/80 text-sm mt-1">{localTime}</p>
          )}
        </div>
        
        <div className="flex items-center justify-center">
          {getWeatherIcon()}
        </div>
        
        <div className="text-center">
          <div className="text-7xl font-bold mb-2">
            {Math.round(temperature)}°{isCelsius ? 'C' : 'F'}
          </div>
          {(todayMinTemp !== undefined && todayMaxTemp !== undefined) && (
            <div className="flex items-center justify-center gap-4 mt-3 text-white/90">
              <div className="flex items-center gap-1">
                <ThermometerSnowflake className="w-4 h-4" />
                <span className="text-sm">Min: {convertTemperature(todayMinTemp)}°</span>
              </div>
              <div className="flex items-center gap-1">
                <ThermometerSun className="w-4 h-4" />
                <span className="text-sm">Max: {convertTemperature(todayMaxTemp)}°</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            <div>
              <p className="text-sm text-white/80">Humidity</p>
              <p className="font-semibold">{humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5" />
            <div>
              <p className="text-sm text-white/80">Wind</p>
              <p className="font-semibold">{windSpeed} km/h</p>
            </div>
          </div>
        </div>
        {/* Discrete location details */}
        <div className="pt-2 text-sm text-white/90 space-y-1">
          { (city || town || state || country) && (
            <div className="flex items-center justify-center gap-2">
              <div className="text-xs text-white/70">Location:</div>
              <div className="font-medium">{[town || city, state, country].filter(Boolean).join(', ')}</div>
            </div>
          ) }
          {district && (
            <div className="flex items-center justify-center gap-2">
              <div className="text-xs text-white/70">District:</div>
              <div className="font-medium">{district}</div>
            </div>
          )}
          {postcode && (
            <div className="flex items-center justify-center gap-2">
              <div className="text-xs text-white/70">Postal:</div>
              <div className="font-medium">{postcode}</div>
            </div>
          )}
          {locationSource && (
            <div className="flex items-center justify-center">
              <span className="inline-block text-xs px-2 py-1 rounded bg-white/10">
                {locationSource === 'geolocation' ? 'From: GPS' : locationSource === 'ip' ? 'From: IP' : locationSource === 'search' ? 'From: Search' : 'From: Saved'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WeatherCard;
