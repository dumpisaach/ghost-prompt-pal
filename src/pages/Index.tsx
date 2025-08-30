import React, { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { TransparencyControls } from '@/components/TransparencyControls';
import { ResizeHandle } from '@/components/ResizeHandle';

const Index = () => {
  const [opacity, setOpacity] = useState(0.95);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  return (
    <div className="h-screen w-screen bg-background relative overflow-hidden">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-muted/20" />
      
      {/* Main chat container */}
      <div className="relative h-full p-4">
        <div className="h-full max-w-4xl mx-auto">
          <ChatInterface opacity={opacity} />
        </div>
      </div>

      {/* Transparency controls */}
      {isControlsVisible && (
        <TransparencyControls
          opacity={opacity}
          onOpacityChange={setOpacity}
          isVisible={isControlsVisible}
          onToggleVisibility={() => setIsControlsVisible(!isControlsVisible)}
        />
      )}

      {/* Resize handle for Electron */}
      <ResizeHandle />
      
      {/* Instructions overlay for first-time users */}
      <div className="absolute bottom-4 left-4 bg-gradient-glass backdrop-blur-xl border border-white/20 rounded-lg p-3 max-w-sm">
        <h3 className="text-sm font-medium text-foreground mb-2">Ready for Electron</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This interface is optimized for screen sharing overlays. Wrap in Electron with transparency and "skip taskbar" options for the perfect invisible assistant.
        </p>
      </div>
    </div>
  );
};

export default Index;
