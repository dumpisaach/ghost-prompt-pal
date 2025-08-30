import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransparencyControlsProps {
  opacity: number;
  onOpacityChange: (value: number) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const TransparencyControls: React.FC<TransparencyControlsProps> = ({
  opacity,
  onOpacityChange,
  isVisible,
  onToggleVisibility,
}) => {
  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-gradient-glass backdrop-blur-xl border border-white/20 rounded-lg p-3 min-w-[200px]">
        <div className="flex items-center gap-3 mb-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleVisibility}
            className="w-8 h-8 p-0 hover:bg-white/10"
          >
            {isVisible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
          <span className="text-sm font-medium text-foreground">
            {Math.round(opacity * 100)}%
          </span>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Window Opacity
          </label>
          <Slider
            value={[opacity]}
            onValueChange={(values) => onOpacityChange(values[0])}
            max={1}
            min={0.1}
            step={0.05}
            className="w-full"
          />
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-muted-foreground">
            Perfect for screen sharing overlay
          </p>
        </div>
      </div>
    </div>
  );
};