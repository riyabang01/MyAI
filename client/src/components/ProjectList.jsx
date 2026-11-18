import { useState } from 'react'

function ProjectList({ projects, onOpenProject, onDeleteProject }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProjects = projects.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.prompt || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white tracking-wide">
          Generated Projects ({filteredProjects.length})
        </h2>
        {projects.length > 0 && (
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30">
          <p className="text-neutral-500 italic text-base">
            No projects found. Type your idea above to generate a complete MERN project!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj._id}
              onClick={() => onOpenProject(proj)}
              className="group p-6 border border-neutral-800 hover:border-indigo-500/60 rounded-2xl bg-neutral-900 hover:bg-neutral-900/80 shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-indigo-400 group-hover:text-indigo-300 transition">
                    {proj.name || 'Untitled Project'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-800 text-xs font-mono text-neutral-300">
                      {proj.files?.length || 1} files
                    </span>
                    <button
                      onClick={(e) => onDeleteProject(e, proj._id)}
                      title="Delete Project"
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-600/20 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-neutral-400 text-sm line-clamp-2">{proj.prompt}</p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:text-purple-300">
                <span>
                  {proj.liveUrl ? '🟢 Live on Vercel • Open Code' : 'Open Code, Live Preview & VS Code'}
                </span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProjectList
