import { generateRawText } from '../services/aiService.js';

export const generateAIResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const replyText = await generateRawText(prompt);
    res.status(200).json({ success: true, reply: replyText });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
