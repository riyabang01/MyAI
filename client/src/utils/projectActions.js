import JSZip from 'jszip'

export const downloadProjectZip = async (project) => {
  if (!project) return
  const zip = new JSZip()
  const files = project.files || []

  files.forEach((file) => {
    const cleanPath = file.path.replace(/^\/+/, '')
    zip.file(cleanPath, file.code || '')
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const folderName = (project.name || 'mern-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  a.href = url
  a.download = `${folderName}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export const openProjectInVSCode = async (project, githubUrl = '', onPushGithub = null) => {
  let repoUrl = githubUrl || project?.githubUrl

  if (!repoUrl && typeof onPushGithub === 'function') {
    const pushedUrl = await onPushGithub()
    if (typeof pushedUrl === 'string') {
      repoUrl = pushedUrl
    }
  }

  if (!repoUrl) {
    alert('Please push the project to GitHub first to open it in VS Code.')
    return
  }

  const cleanRepo = repoUrl.replace(/^https?:\/\//, '')
  window.open('https://vscode.dev' + cleanRepo, '_blank', 'noopener,noreferrer')
}

export const buildLivePreviewHtml = (files) => {
  const appFile = files.find((f) => f.path.endsWith('App.jsx') || f.path.endsWith('App.js'))
  const cssFile = files.find((f) => f.path.endsWith('.css'))
  const htmlFile = files.find((f) => f.path.endsWith('index.html'))

  if (htmlFile && !appFile) return htmlFile.code

  let rawCode = appFile
    ? appFile.code
    : 'function App() { return <div className="p-8 text-center text-white">No React UI file found</div> }'

  rawCode = rawCode
    .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '')
    .replace(/export\s+default\s+function\s+App/g, 'function App')
    .replace(/export\s+default\s+App;?/g, '')

  return (
    '<!DOCTYPE html><html><head><meta charset="UTF-8" />' +
    '<script src="https://cdn.tailwindcss.com"></script>' +
    '<script src="https://unpkg.com" crossorigin></script>' +
    '<script src="https://unpkg.com" crossorigin></script>' +
    '<script src="https://unpkg.com"></script>' +
    '<style>' + (cssFile ? cssFile.code : '') + ' body { background: #09090b; color: #f4f4f5; font-family: sans-serif; }</style>' +
    '</head><body><div id="root"></div><script type="text/babel">' +
    'const { useState, useEffect, useRef } = React;' +
    'const axios = { get: () => Promise.resolve({ data: [] }), post: (_, payload) => Promise.resolve({ data: { _id: Date.now(), ...payload } }), put: (_, payload) => Promise.resolve({ data: payload }), delete: () => Promise.resolve({ data: { success: true } }) };' +
    'try {' +
    rawCode +
    '\nconst root = ReactDOM.createRoot(document.getElementById("root")); root.render(<App />);' +
    '} catch (err) { document.getElementById("root").innerHTML = \'<pre style="color:#f87171;padding:20px;">Preview Error: \' + err.message + \'</pre>\'; }' +
    '</script></body></html>'
  )
}
