import { useState } from 'react'

function CodeWorkspace({ files, updating, onUpdateWithAI, onSaveManualFiles }) {
  const [activeFileIndex, setActiveFileIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isEditingManual, setIsEditingManual] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [isAddingFile, setIsAddingFile] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')

  const safeIndex = activeFileIndex < files.length ? activeFileIndex : 0
  const currentFile = files[safeIndex] || { path: 'file.txt', code: '' }

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleManualSave = async () => {
    const updatedFiles = files.map((file, idx) =>
      idx === safeIndex ? { ...file, code: manualCode } : file
    )
    await onSaveManualFiles(updatedFiles)
    setIsEditingManual(false)
  }

  const handleCreateNewFile = async (e) => {
    e.preventDefault()
    const cleanPath = newFilePath.trim().replace(/^\/+/, '')
    if (!cleanPath) return

    const exists = files.some((f) => f.path === cleanPath)
    if (exists) {
      alert('A file with this path already exists!')
      return
    }

    const updatedFiles = [...files, { path: cleanPath, code: '' }]
    await onSaveManualFiles(updatedFiles)
    setNewFilePath('')
    setIsAddingFile(false)
    setActiveFileIndex(updatedFiles.length - 1)
    setManualCode('')
    setIsEditingManual(true)
  }

  const handleDeleteSingleFile = async (e, idxToDelete) => {
    if (e) e.stopPropagation()
    if (files.length <= 1) {
      alert('Cannot delete the last remaining file.')
      return
    }
    const targetFile = files[idxToDelete]
    if (!targetFile) return

    if (!window.confirm(`Are you sure you want to delete "${targetFile.path}"?`)) return

    const updatedFiles = files.filter((_, idx) => idx !== idxToDelete)
    await onSaveManualFiles(updatedFiles)
    setActiveFileIndex((prev) => (prev >= updatedFiles.length ? updatedFiles.length - 1 : prev))
    setIsEditingManual(false)
  }

  const handleAISubmit = async (e) => {
    e.preventDefault()
    if (!editPrompt.trim()) return
    await onUpdateWithAI(editPrompt)
    setEditPrompt('')
    setIsEditingManual(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 h-fit max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            📁 Files ({files.length})
          </h2>
          <button
            onClick={() => setIsAddingFile(!isAddingFile)}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
          >
            {isAddingFile ? '✕ Close' : '+ New File'}
          </button>
        </div>

        {isAddingFile && (
          <form onSubmit={handleCreateNewFile} className="mb-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <input
              type="text"
              placeholder="e.g. client/src/components/Navbar.jsx"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={updating}
              className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {updating ? 'Creating...' : 'Create & Open File'}
            </button>
          </form>
        )}

        <div className="space-y-1">
          {files.map((file, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveFileIndex(idx)
                setCopied(false)
                setIsEditingManual(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex items-center justify-between gap-2 cursor-pointer ${
                safeIndex === idx
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span>📄</span>
                <span className="truncate" title={file.path}>
                  {file.path}
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteSingleFile(e, idx)}
                disabled={updating}
                title={`Delete ${file.path}`}
                className={`shrink-0 p-1 rounded-md text-xs transition cursor-pointer disabled:opacity-40 ${
                  safeIndex === idx
                    ? 'hover:bg-red-500/80 text-white'
                    : 'hover:bg-red-600/20 text-neutral-400 hover:text-red-400'
                }`}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-neutral-900 border-b border-neutral-800">
          <span className="font-mono text-sm text-emerald-400 font-semibold truncate max-w-md">
            {currentFile.path}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {isEditingManual ? (
              <>
                <button
                  onClick={handleManualSave}
                  disabled={updating}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {updating ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditingManual(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setManualCode(currentFile.code)
                  setIsEditingManual(true)
                }}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-amber-300 transition cursor-pointer"
              >
                ✏️ Edit File
              </button>
            )}

            <button
              onClick={() => handleCopyCode(currentFile.code)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-white transition cursor-pointer"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>

            <button
              onClick={(e) => handleDeleteSingleFile(e, safeIndex)}
              disabled={updating || files.length <= 1}
              className="px-3 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold text-red-400 transition cursor-pointer disabled:opacity-40"
            >
              🗑️ Delete File
            </button>
          </div>
        </div>

        {isEditingManual ? (
          <textarea
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full h-[58vh] p-5 bg-neutral-950 text-sm font-mono text-neutral-200 focus:outline-none resize-none leading-relaxed"
          />
        ) : (
          <pre className="p-5 bg-neutral-950 text-sm font-mono text-neutral-200 overflow-x-auto whitespace-pre leading-relaxed h-[58vh] overflow-y-auto">
            <code>{currentFile.code}</code>
          </pre>
        )}

        <form
          onSubmit={handleAISubmit}
          className="p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            placeholder="Ask AI to modify existing files or add new files (e.g., Create a new Navbar.jsx and connect in App.jsx)..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            disabled={updating}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-950 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={updating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            {updating ? 'Updating Project...' : '✨ Update with AI'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default CodeWorkspace
