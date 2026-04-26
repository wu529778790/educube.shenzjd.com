"use client";

import ToolIframeOverlay from "@/components/tool-iframe/ToolIframeOverlay";
import { useToolIframeState } from "@/components/tool-iframe/useToolIframeState";

interface ToolIframeProps {
  src: string;
  title: string;
}

export default function ToolIframe({ src, title }: ToolIframeProps) {
  const { iframeRef, state, handleLoad, handleError } = useToolIframeState({
    src,
  });

  return (
    <div className="relative flex-1 overflow-hidden min-h-0">
      <ToolIframeOverlay state={state} />
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        className="w-full h-full border-0"
        title={title}
        sandbox="allow-scripts"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
