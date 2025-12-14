import mongoose from 'mongoose';

const subTeamSchema = new mongoose.Schema({
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
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Accountant / Sub-team leader
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // MSOs
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

subTeamSchema.index({ branchId: 1, code: 1 }, { unique: true });

export default mongoose.model('SubTeam', subTeamSchema);

