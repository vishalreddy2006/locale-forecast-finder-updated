import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TemperatureToggleProps {
  isCelsius: boolean;
  onToggle: () => void;
}

const TemperatureToggle = ({ isCelsius, onToggle }: TemperatureToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-full shadow-card-custom">
      <Label htmlFor="temp-toggle" className="text-sm font-medium cursor-pointer">
        °C
      </Label>
      <Switch 
        id="temp-toggle"
        checked={!isCelsius}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
      <Label htmlFor="temp-toggle" className="text-sm font-medium cursor-pointer">
        °F
      </Label>
    </div>
  );
};

export default TemperatureToggle;
