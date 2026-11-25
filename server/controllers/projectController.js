import Project from '../models/Project.js';
import {
  generateStructuredMERNProject,
  regenerateUpdatedMERNProject,
} from '../services/aiService.js';
import {
  pushProjectToGitHub,
  deployProjectToVercel,
} from '../services/deployService.js';

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });

    const verifiedProjects = await Promise.all(
      projects.map(async (project) => {
        if (project.liveUrl) {
          try {
            const response = await fetch(project.liveUrl, {
              method: 'GET',
              headers: { 'User-Agent': 'Mozilla/5.0' },
            });
            const html = await response.text();
            if (
              response.status === 404 ||
              html.includes('DEPLOYMENT_NOT_FOUND') ||
              html.includes('404: NOT_FOUND')
            ) {
              project.liveUrl = '';
              await project.save();
            }
          } catch (err) {
            console.error(err);
          }
        }
        return project;
      })
    );

    res.status(200).json(verifiedProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const createProject = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiData = await generateStructuredMERNProject(prompt);

    const newProject = await Project.create({
      name: aiData.name || 'MERN Project',
      prompt,
      files: aiData.files || [],
      generatedCode: aiData.files?.map((f) => `// === ${f.path} ===\n${f.code}`).join('\n\n') || '',
    });

    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { editPrompt, existingFiles, manualFiles, liveUrl } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (liveUrl !== undefined && !editPrompt && !manualFiles) {
      project.liveUrl = liveUrl;
      await project.save();
      return res.status(200).json({ success: true, project });
    }

    if (manualFiles) {
      project.files = manualFiles;
      project.generatedCode = manualFiles.map((f) => `// === ${f.path} ===\n${f.code}`).join('\n\n');
      if (liveUrl !== undefined) {
        project.liveUrl = liveUrl;
      }
      await project.save();
      return res.status(200).json({ success: true, project });
    }

    if (!editPrompt) {
      return res.status(400).json({ error: 'Edit prompt is required' });
    }

    const baseFiles = existingFiles || project.files || [];
    const aiData = await regenerateUpdatedMERNProject(baseFiles, editPrompt);
    const updatedChanges = aiData.files || [];

    const mergedMap = new Map();
    baseFiles.forEach((file) => {
      mergedMap.set(file.path.replace(/^\/+/, ''), file);
    });

    updatedChanges.forEach((changedFile) => {
      const cleanPath = changedFile.path.replace(/^\/+/, '');
      mergedMap.set(cleanPath, { path: cleanPath, code: changedFile.code });
    });

    const finalFiles = Array.from(mergedMap.values());

    project.files = finalFiles;
    project.prompt = `${project.prompt} | Update: ${editPrompt}`;
    project.generatedCode = finalFiles.map((f) => `// === ${f.path} ===\n${f.code}`).join('\n\n');
    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error('AI Update Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const pushToGithub = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const githubUrl = await pushProjectToGitHub(project);
    project.githubUrl = githubUrl;
    await project.save();

    res.status(200).json({ success: true, githubUrl, project });
  } catch (error) {
    console.error('GitHub Push Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deployToVercel = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const liveUrl = await deployProjectToVercel(project);
    project.liveUrl = liveUrl;
    await project.save();

    res.status(200).json({ success: true, url: liveUrl, project });
  } catch (error) {
    console.error('Vercel Deploy Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
