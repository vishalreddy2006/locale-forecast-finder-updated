import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AITipsCardProps {
  tips: string[];
}

const AITipsCard = ({ tips }: AITipsCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-accent/20 to-primary/20 backdrop-blur-sm border-border animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">AI Weather Tips</h3>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="text-sm text-foreground/90 flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default AITipsCard;
