const GITHUB_API = Buffer.from('aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbQ==', 'base64').toString('utf-8');
const VERCEL_API = Buffer.from('aHR0cHM6Ly9hcGkudmVyY2VsLmNvbQ==', 'base64').toString('utf-8');

async function safeParseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid response (${response.status}): ${text.slice(0, 150)}`);
  }
}

export async function pushProjectToGitHub(project) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN missing in backend .env file');
  }

  if (!Array.isArray(project.files) || project.files.length === 0) {
    throw new Error('No files found in project to push to GitHub');
  }

  const repoName = `${(project.name || 'mern-ai-project')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'mern-ai-project'}-${Date.now().toString().slice(-4)}`;

  const cleanDescription = String(project.prompt || 'Generated with MyAI')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 200);

  const repoRes = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      description: cleanDescription,
      private: false,
      auto_init: false,
    }),
  });

  const repoData = await safeParseJson(repoRes);
  if (!repoRes.ok) {
    throw new Error(repoData.message || 'Failed to create GitHub repository');
  }

  const owner = repoData.owner.login;
  let pushedCount = 0;

  for (const file of project.files) {
    const cleanPath = String(file.path || '').replace(/^\/+/, '');
    if (!cleanPath) continue;

    const base64Content = Buffer.from(String(file.code || ''), 'utf-8').toString('base64');

    const fileRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/contents/${cleanPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add ${cleanPath}`,
          content: base64Content,
        }),
      }
    );

    if (!fileRes.ok) {
      const errData = await safeParseJson(fileRes);
      throw new Error(`Failed to push ${cleanPath}: ${errData.message || fileRes.status}`);
    }

    pushedCount++;
  }

  if (pushedCount === 0) {
    throw new Error('No valid files were pushed to GitHub');
  }

  return repoData.html_url;
}


export async function deployProjectToVercel(project) {
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    throw new Error('VERCEL_TOKEN missing in backend .env file');
  }

  let teamId = process.env.VERCEL_TEAM_ID || '';
  if (!teamId) {
    const userRes = await fetch(`${VERCEL_API}/v2/user`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });
    if (userRes.ok) {
      const userData = await safeParseJson(userRes);
      teamId = userData.user?.defaultTeamId || '';
    }
  }

  const rawFiles = (project.files || [])
    .map((file) => ({
      file: String(file.path || '').replace(/^\/+/, ''),
      data: String(file.code || ''),
    }))
    .filter((f) => f.file.length > 0);

  const hasClient = rawFiles.some((f) => f.file.startsWith('client/'));
  const hasServer = rawFiles.some((f) => f.file.startsWith('server/'));
  const serverEntry = rawFiles.find(
    (f) => f.file === 'server/server.js' || f.file === 'server/index.js'
  );

  let vercelFiles = [...rawFiles];
  let projectSettings = {};

  const cleanName =
    (project.name || 'mern-ai-app')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'mern-ai-app';

  const deploymentName = `${cleanName}-${Date.now().toString().slice(-4)}`;

  if (hasClient && hasServer && serverEntry) {
    const serverFiles = vercelFiles.filter((f) => f.file.startsWith('server/'));
    const serverPkgFile = serverFiles.find((f) => f.file === 'server/package.json');
    let serverDeps = { express: '^4.19.2', cors: '^2.8.5', dotenv: '^16.4.5', mongoose: '^8.5.0' };
    if (serverPkgFile) {
      try {
        const parsedServerPkg = JSON.parse(serverPkgFile.data);
        serverDeps = { ...serverDeps, ...(parsedServerPkg.dependencies || {}) };
      } catch {}
    }

    vercelFiles = vercelFiles.map((f) => {
      if (f.file === 'client/package.json') {
        try {
          const clientPkg = JSON.parse(f.data);
          clientPkg.dependencies = { ...serverDeps, ...(clientPkg.dependencies || {}) };
          return { file: f.file, data: JSON.stringify(clientPkg, null, 2) };
        } catch {
          return f;
        }
      }
      return f;
    });

    vercelFiles.push({
      file: 'api/index.js',
      data: `import app from '../${serverEntry.file}';\nexport default app;\n`,
    });

    vercelFiles = vercelFiles.filter((f) => f.file !== 'vercel.json');
    vercelFiles.push({
      file: 'vercel.json',
      data: JSON.stringify(
        {
          rewrites: [
            { source: '/api/(.*)', destination: '/api/index.js' },
            { source: '/(.*)', destination: '/index.html' },
          ],
        },
        null,
        2
      ),
    });

    projectSettings = {
      framework: 'vite',
      installCommand: 'cd client && npm install',
      buildCommand: 'cd client && npm run build',
      outputDirectory: 'client/dist',
    };
  } else {
    if (hasClient) {
      vercelFiles = vercelFiles.map((f) => ({
        file: f.file.startsWith('client/') ? f.file.replace(/^client\//, '') : f.file,
        data: f.data,
      }));
    }

    const hasPackageJson = vercelFiles.some((f) => f.file === 'package.json');
    if (!hasPackageJson) {
      vercelFiles.push({
        file: 'package.json',
        data: JSON.stringify(
          {
            name: 'vite-react-app',
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^0.460.0',
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.3.4',
              autoprefixer: '^10.4.20',
              postcss: '^8.4.49',
              tailwindcss: '^3.4.15',
              vite: '^6.0.1',
            },
          },
          null,
          2
        ),
      });
    }

    const hasViteConfig = vercelFiles.some(
      (f) => f.file === 'vite.config.js' || f.file === 'vite.config.ts'
    );
    if (!hasViteConfig) {
      vercelFiles.push({
        file: 'vite.config.js',
        data: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})\n`,
      });
    }

    vercelFiles = vercelFiles.filter((f) => f.file !== 'vercel.json');
    vercelFiles.push({
      file: 'vercel.json',
      data: JSON.stringify(
        {
          rewrites: [{ source: '/(.*)', destination: '/index.html' }],
        },
        null,
        2
      ),
    });

    projectSettings = {
      framework: 'vite',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      installCommand: 'npm install',
    };
  }

  const queryParams = new URLSearchParams({
    skipAutoDetectionConfirmation: '1',
  });
  if (teamId) {
    queryParams.set('teamId', teamId);
  }

  const response = await fetch(
    `${VERCEL_API}/v13/deployments?${queryParams.toString()}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: deploymentName,
        files: vercelFiles,
        target: 'production',
        projectSettings,
      }),
    }
  );

  const data = await safeParseJson(response);
  if (!response.ok) {
    const detailedError =
      data.error?.message ||
      (data.error ? JSON.stringify(data.error) : `HTTP ${response.status} from Vercel`);
    throw new Error(`Vercel Error: ${detailedError}`);
  }

  const deploymentId = data.id;
  if (deploymentId) {
    for (let i = 0; i < 15; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const statusUrl = teamId
        ? `${VERCEL_API}/v13/deployments/${deploymentId}?teamId=${teamId}`
        : `${VERCEL_API}/v13/deployments/${deploymentId}`;
      const statusRes = await fetch(statusUrl, {
        headers: { Authorization: `Bearer ${vercelToken}` },
      });
      if (statusRes.ok) {
        const statusData = await safeParseJson(statusRes);
        if (statusData.readyState === 'READY') {
          break;
        }
        if (statusData.readyState === 'ERROR' || statusData.readyState === 'CANCELED') {
          throw new Error(`Vercel Build Failed: ${statusData.errorMessage || 'Check Vercel build logs'}`);
        }
      }
    }
  }

  return `https://${data.url}`;
}
