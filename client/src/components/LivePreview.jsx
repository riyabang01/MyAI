import { buildLivePreviewHtml } from '../utils/projectActions'

function LivePreview({ files }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-xs font-mono text-emerald-400">Live UI Sandbox Preview</span>
        <span className="text-xs text-neutral-500">
          Click "Deploy Live on Vercel" for live cloud hosting
        </span>
      </div>
      <iframe
        title="Live Project Preview"
        srcDoc={buildLivePreviewHtml(files)}
        className="w-full h-[68vh] bg-neutral-950 border-0"
        sandbox="allow-scripts"
      />
    </div>
  )
}

export default LivePreview
