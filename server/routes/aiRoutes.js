import express from 'express';
import { generateAIResponse } from '../controllers/aiController.js';
import {
  getAllProjects,
  createProject,
  updateProject,
  pushToGithub,
  deployToVercel,
  deleteProject,
} from '../controllers/projectController.js';

const router = express.Router();

router.post('/chat', generateAIResponse);

router.get('/projects', getAllProjects);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.post('/projects/:id/github', pushToGithub);
router.post('/projects/:id/deploy', deployToVercel);
router.delete('/projects/:id', deleteProject);

export default router;
