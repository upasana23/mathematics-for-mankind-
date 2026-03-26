import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  classLevel: {
    type: String,
    required: true,
    enum: ['6', '7', '8', '9', '10', '11', '12']
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Vedic', 'Algebra', 'Geometry', 'Calculus', 'Other'],
    default: 'Other'
  }
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

export default Note;
