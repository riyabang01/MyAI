function ProjectForm({ prompt, setPrompt, loading, onSubmit }) {
  return (
    <section className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-2xl shadow-xl shadow-black/40">
      <h2 className="text-2xl font-bold mb-6 text-white tracking-wide">
        Ask AI to Build a Full MERN Project
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <textarea
          placeholder="Example: Make a Task Manager MERN app with client React UI and server Express models, controllers, routes, and server.js..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 text-base min-h-[110px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 resize-y disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-base shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? 'AI is generating Client & Server architecture... Please wait...'
            : 'Generate Complete MERN Project ⚡'}
        </button>
      </form>
    </section>
  )
}

export default ProjectForm
