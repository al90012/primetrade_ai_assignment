import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  user: mongoose.Schema.Types.ObjectId;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending' 
  },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, {
  timestamps: true,
});

const Task = mongoose.model<ITask>('Task', TaskSchema);

export default Task;
