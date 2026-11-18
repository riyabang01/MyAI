import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String },
    title: { type: String },
    prompt: { type: String },
    description: { type: String },
    code: { type: String },
    liveUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    files: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true, strict: false }
);

export default mongoose.model('Project', projectSchema);
