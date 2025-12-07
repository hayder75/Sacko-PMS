import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
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
  regionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true,
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true,
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Branch', branchSchema);

