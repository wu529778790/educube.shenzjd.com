export interface ToolIframeState {
  loading: boolean;
  error: boolean;
}

export const TOOL_IFRAME_READY_TIMEOUT_MS = 15_000;

export function createInitialToolIframeState(): ToolIframeState {
  return {
    loading: true,
    error: false,
  };
}

export function markToolIframeLoaded(): ToolIframeState {
  return {
    loading: false,
    error: false,
  };
}

export function markToolIframeErrored(): ToolIframeState {
  return {
    loading: false,
    error: true,
  };
}
