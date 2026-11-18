import { downloadProjectZip, openProjectInVSCode } from '../utils/projectActions';

function ProjectHeader({
  project,
  onBack,
  activeTab,
  setActiveTab,
  deploying,
  onDeployVercel,
  liveUrl,
  pushingGithub,
  onPushGithub,
  githubUrl,
  onDelete,
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-sm font-semibold text-neutral-200 transition cursor-pointer"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-indigo-400">
              {project.name || 'MERN Project'}
            </h1>
            <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1 max-w-xl">
              {project.prompt}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'code' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              💻 Code Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'preview' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🌐 Live Preview
            </button>
          </div>

          <button
            onClick={onPushGithub}
            disabled={pushingGithub}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            {pushingGithub ? '⏳ Pushing...' : '🐙 Push to GitHub'}
          </button>

          <button
            onClick={onDeployVercel}
            disabled={deploying}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            {deploying ? '⏳ Deploying...' : '▲ Deploy Live on Vercel'}
          </button>

          <button
            onClick={() => openProjectInVSCode(project)}
            className="px-3.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition cursor-pointer"
          >
            ⚡ Open in VS Code
          </button>

          <button
            onClick={() => downloadProjectZip(project)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
          >
            📦 Download ZIP
          </button>

          <button
            onClick={(e) => onDelete(e, project._id)}
            className="px-3.5 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition cursor-pointer"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {githubUrl && (
        <div className="mb-4 p-4 rounded-2xl bg-neutral-800/70 border border-neutral-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-neutral-200 font-bold text-sm">🐙 GitHub Repo:</span>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono text-indigo-300 underline hover:text-indigo-200"
            >
              {githubUrl}
            </a>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-semibold transition"
          >
            Open Repo ↗
          </a>
        </div>
      )}

      {liveUrl && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-sm">🎉 Live on Vercel:</span>
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono text-emerald-300 underline hover:text-emerald-200"
            >
              {liveUrl}
            </a>
          </div>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
          >
            Open Live Site ↗
          </a>
        </div>
      )}
    </>
  );
}

export default ProjectHeader;
