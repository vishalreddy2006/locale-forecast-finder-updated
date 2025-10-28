import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, AlertTriangle, ThumbsUp } from "lucide-react";

interface AIAnalyzerCardProps {
  analysis: {
    trend: string;
    warning?: string;
    recommendation: string;
  };
}

const AIAnalyzerCard = ({ analysis }: AIAnalyzerCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border-border animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Weather Analysis</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary mt-1" />
          <div>
            <p className="text-sm font-medium text-foreground">Weather Trend</p>
            <p className="text-sm text-muted-foreground">{analysis.trend}</p>
          </div>
        </div>

        {analysis.warning && (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-1" />
            <div>
              <p className="text-sm font-medium text-foreground">Warning</p>
              <p className="text-sm text-muted-foreground">{analysis.warning}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <ThumbsUp className="w-5 h-5 text-accent mt-1" />
          <div>
            <p className="text-sm font-medium text-foreground">Recommendation</p>
            <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AIAnalyzerCard;
