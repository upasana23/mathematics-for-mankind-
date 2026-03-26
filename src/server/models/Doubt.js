import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  studentName: String,
  classLevel: String,
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  imageUrl: String, // From Cloudinary
  status: { 
    type: String, 
    enum: ['Pending', 'Solved'], 
    default: 'Pending' 
  },
  solutionText: String,
  solutionImageUrl: String, // When teacher uploads handwritten answer
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const Doubt = mongoose.model('Doubt', doubtSchema);

export default Doubt;
