import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    required: true,
    enum: [
      'admin',
      'regionalDirector',
      'areaManager',
      'branchManager',
      'lineManager',
      'subTeamLeader',
      'staff',
    ],
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: function() {
      return this.role !== 'admin';
    },
  },
  branch_code: {
    type: String,
    trim: true,
    required: function() {
      return this.role !== 'admin';
    },
  },
  sub_team: {
    type: String,
    trim: true,
  },
  regionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
  },
  position: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Branch Manager',
      'MSM',
      'Accountant',
      'Auditor',
      'MSO I',
      'MSO II',
      'MSO III',
    ],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Validate position is required
userSchema.pre('save', function(next) {
  if (!this.position || this.position.trim() === '') {
    return next(new Error('Position is required'));
  }
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);

