import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Download, Sparkles, Brain, RefreshCw, Sun, Moon, Monitor, Clock } from "lucide-react";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettingsPanelProps {
  aiTipsEnabled: boolean;
  aiAnalyzerEnabled: boolean;
  autoRefreshEnabled: boolean;
  onAiTipsToggle: () => void;
  onAiAnalyzerToggle: () => void;
  onAutoRefreshToggle: () => void;
  onDownloadPDF: () => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  autoRefreshIntervalMin?: number;
  onAutoRefreshIntervalChange?: (min: number) => void;
}

const SettingsPanel = ({
  aiTipsEnabled,
  aiAnalyzerEnabled,
  autoRefreshEnabled,
  onAiTipsToggle,
  onAiAnalyzerToggle,
  onAutoRefreshToggle,
  onDownloadPDF,
  theme,
  onThemeChange,
  autoRefreshIntervalMin = 5,
  onAutoRefreshIntervalChange,
}: SettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />;
      case "dark":
        return <Moon className="w-4 h-4" />;
      case "system":
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="icon"
        className="bg-card/80 backdrop-blur-sm border-border hover:bg-card"
      >
        <Settings className="w-5 h-5" />
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-14 w-80 p-6 space-y-6 bg-card/95 backdrop-blur-md border-border shadow-glass z-50 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-semibold text-foreground">Settings</h3>
          </div>

          {/* Theme Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Theme</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 bg-background">
                  {getThemeIcon()}
                  <span className="capitalize">{theme}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border">
                <DropdownMenuItem onClick={() => onThemeChange("light")} className="gap-2">
                  <Sun className="w-4 h-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onThemeChange("dark")} className="gap-2">
                  <Moon className="w-4 h-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onThemeChange("system")} className="gap-2">
                  <Monitor className="w-4 h-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* AI Tips Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <Label htmlFor="ai-tips" className="text-sm font-medium cursor-pointer">
                AI Weather Tips
              </Label>
            </div>
            <Switch
              id="ai-tips"
              checked={aiTipsEnabled}
              onCheckedChange={onAiTipsToggle}
            />
          </div>

          {/* AI Analyzer Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <Label htmlFor="ai-analyzer" className="text-sm font-medium cursor-pointer">
                AI Weather Analyzer
              </Label>
            </div>
            <Switch
              id="ai-analyzer"
              checked={aiAnalyzerEnabled}
              onCheckedChange={onAiAnalyzerToggle}
            />
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="auto-refresh" className="text-sm font-medium cursor-pointer">
                Auto Refresh
              </Label>
            </div>
            <Switch
              id="auto-refresh"
              checked={autoRefreshEnabled}
              onCheckedChange={onAutoRefreshToggle}
            />
          </div>

          {/* Auto Refresh Interval */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Refresh Interval</Label>
            </div>
            <Select
              value={String(autoRefreshIntervalMin)}
              onValueChange={(v) => onAutoRefreshIntervalChange?.(parseInt(v, 10))}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Interval (minutes)" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="1">1 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="10">10 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Download PDF Button */}
          <Button
            onClick={onDownloadPDF}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Download className="w-4 h-4" />
            Download as PDF
          </Button>
        </Card>
      )}
    </div>
  );
};

export default SettingsPanel;
