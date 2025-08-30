import React from 'react';
import { GripVertical } from 'lucide-react';

export const ResizeHandle: React.FC = () => {
  return (
    <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group">
      <div className="absolute bottom-1 right-1 text-muted-foreground group-hover:text-primary transition-colors">
        <GripVertical className="w-4 h-4 rotate-45" />
      </div>
    </div>
  );
};