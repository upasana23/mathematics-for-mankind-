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
    enum: ['5', '6', '7', '8', '9', '10', '11', '12']
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  category: {
    type: String,
    required: true,
    default: 'Other'
  }
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

export default Note;
