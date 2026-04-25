interface AgentPreviewPanelProps {
  html: string;
  onClose: () => void;
}

export default function AgentPreviewPanel({
  html,
  onClose,
}: AgentPreviewPanelProps) {
  return (
    <div className="agent-preview">
      <div className="preview-header">
        <span>实时预览</span>
        <button className="preview-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <iframe
        className="preview-iframe"
        sandbox="allow-scripts"
        srcDoc={html}
        title="教具预览"
      />
    </div>
  );
}
