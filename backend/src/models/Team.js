import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Line Manager (MSM)
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

teamSchema.index({ branchId: 1, code: 1 }, { unique: true });

export default mongoose.model('Team', teamSchema);

