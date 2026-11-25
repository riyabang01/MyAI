import { useState, useEffect } from 'react'
import axios from 'axios'
import ProjectForm from './components/ProjectForm'
import ProjectList from './components/ProjectList'
import ProjectHeader from './components/ProjectHeader'
import LivePreview from './components/LivePreview'
import CodeWorkspace from './components/CodeWorkspace'

function App() {
  const [projects, setProjects] = useState([])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('code')
  const [deploying, setDeploying] = useState(false)
  const [liveUrl, setLiveUrl] = useState('')
  const [pushingGithub, setPushingGithub] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/projects' : '/api/projects')

  const checkLiveUrlStatus = async (url) => {
    if (!url) return false
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.status === 404) return false
      return true
    } catch {
      return true
    }
  }

  const handleRemoveLiveUrl = async (projectId) => {
    setLiveUrl('')
    setSelectedProject((prev) => (prev && prev._id === projectId ? { ...prev, liveUrl: '' } : prev))
    setProjects((prev) =>
      prev.map((p) => (p._id === projectId ? { ...p, liveUrl: '' } : p))
    )
    try {
      await axios.put(`${BACKEND_URL}/${projectId}`, { liveUrl: '' })
    } catch (err) {
      console.error(err)
    }
  }


  useEffect(() => {
    axios
      .get(BACKEND_URL)
      .then(async (res) => {
        const list = Array.isArray(res.data) ? res.data : []
        const verifiedList = await Promise.all(
          list.map(async (proj) => {
            if (!proj.liveUrl) return proj
            const isAlive = await checkLiveUrlStatus(proj.liveUrl)
            if (isAlive) return proj
            axios.put(`${BACKEND_URL}/${proj._id}`, { manualFiles: proj.files, liveUrl: '' }).catch(() => { })
            return { ...proj, liveUrl: '' }
          })
        )
        setProjects(verifiedList)
      })
      .catch((err) => console.error(err))
  }, [BACKEND_URL])

  const openProject = async (proj) => {
    setSelectedProject(proj)
    setActiveTab('code')
    setGithubUrl(proj.githubUrl || '')
    setLiveUrl(proj.liveUrl || '')

    if (proj.liveUrl) {
      const isAlive = await checkLiveUrlStatus(proj.liveUrl)
      if (!isAlive) {
        await handleRemoveLiveUrl(proj._id)
      }
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)

    try {
      const res = await axios.post(BACKEND_URL, { prompt })
      const created = res.data.project || res.data
      if (created && created._id) {
        setProjects([created, ...projects])
        setPrompt('')
        openProject(created)
      }
    } catch (error) {
      console.error(error)
      alert('Error generating project. Check server terminal.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateWithAI = async (editPrompt) => {
    if (!selectedProject) return
    setUpdating(true)

    try {
      const res = await axios.put(`${BACKEND_URL}/${selectedProject._id}`, {
        editPrompt,
        existingFiles: selectedProject.files,
      })
      const updated = res.data.project || res.data
      setSelectedProject(updated)
      setProjects(projects.map((p) => (p._id === updated._id ? updated : p)))
    } catch (error) {
      console.error(error)
      alert('Error updating project. Check server terminal.')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveManualFiles = async (manualFiles) => {
    if (!selectedProject) return
    setUpdating(true)

    try {
      const res = await axios.put(`${BACKEND_URL}/${selectedProject._id}`, { manualFiles })
      const updated = res.data.project || res.data
      setSelectedProject(updated)
      setProjects(projects.map((p) => (p._id === updated._id ? updated : p)))
    } catch (error) {
      console.error(error)
      alert('Failed to save manual changes.')
    } finally {
      setUpdating(false)
    }
  }

  const handlePushToGithub = async () => {
    if (!selectedProject) return
    setPushingGithub(true)

    try {
      const res = await axios.post(`${BACKEND_URL}/${selectedProject._id}/github`)
      if (res.data && res.data.githubUrl) {
        setGithubUrl(res.data.githubUrl)
        const updatedProj = { ...selectedProject, githubUrl: res.data.githubUrl }
        setSelectedProject(updatedProj)
        setProjects(projects.map((p) => (p._id === updatedProj._id ? updatedProj : p)))
      }
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || 'GitHub push failed. Check GITHUB_TOKEN in backend.')
    } finally {
      setPushingGithub(false)
    }
  }

  const handleDeployToVercel = async () => {
    if (!selectedProject) return
    setDeploying(true)

    try {
      const res = await axios.post(`${BACKEND_URL}/${selectedProject._id}/deploy`)
      if (res.data && res.data.url) {
        setLiveUrl(res.data.url)
        const updatedProj = { ...selectedProject, liveUrl: res.data.url }
        setSelectedProject(updatedProj)
        setProjects(projects.map((p) => (p._id === updatedProj._id ? updatedProj : p)))
      }
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || 'Vercel deployment failed. Check VERCEL_TOKEN in backend.')
    } finally {
      setDeploying(false)
    }
  }

  const handleDeleteProject = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project?')) return

    try {
      await axios.delete(`${BACKEND_URL}/${id}`)
      setProjects(projects.filter((p) => p._id !== id))
      if (selectedProject && selectedProject._id === id) {
        setSelectedProject(null)
      }
    } catch (error) {
      console.error(error)
      alert('Failed to delete project.')
    }
  }

  if (selectedProject) {
    const files =
      selectedProject.files && selectedProject.files.length > 0
        ? selectedProject.files
        : [
          {
            path: 'generated-code.txt',
            code: selectedProject.generatedCode || selectedProject.code || 'No code available',
          },
        ]

    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <ProjectHeader
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            deploying={deploying}
            onDeployVercel={handleDeployToVercel}
            liveUrl={liveUrl}
            pushingGithub={pushingGithub}
            onPushGithub={handlePushToGithub}
            githubUrl={githubUrl}
            onDelete={handleDeleteProject}
            onRemoveLiveUrl={handleRemoveLiveUrl}

          />

          {activeTab === 'preview' ? (
            <LivePreview files={files} vercelUrl={liveUrl || selectedProject.liveUrl} />
          ) : (
            <CodeWorkspace
              files={files}
              updating={updating}
              onUpdateWithAI={handleUpdateWithAI}
              onSaveManualFiles={handleSaveManualFiles}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-3 tracking-tight">
            🚀 MyAI MERN Builder
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Generate complete Full-Stack MERN apps with Tailwind CSS, push to GitHub, preview live, or deploy on Vercel.
          </p>
        </header>

        <main className="space-y-12">
          <ProjectForm
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            onSubmit={handleSubmit}
          />
          <ProjectList
            projects={projects}
            onOpenProject={openProject}
            onDeleteProject={handleDeleteProject}
          />
        </main>
      </div>
    </div>
  )
}

export default App
