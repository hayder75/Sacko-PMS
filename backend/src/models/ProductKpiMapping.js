import mongoose from 'mongoose';

const productKpiMappingSchema = new mongoose.Schema({
  cbs_product_name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  kpi_category: {
    type: String,
    required: true,
    enum: [
      'Deposit Mobilization',
      'Digital Channel Growth',
      'Loan & NPL',
      'Customer Base',
      'Member Registration',
      'Shareholder Recruitment',
    ],
    index: true,
  },
  // Additional conditions for some products
  conditions: {
    // For loan products, check if balance > 0
    min_balance: {
      type: Number,
      default: 0,
    },
    // Other conditions can be added here
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'active',
    index: true,
  },
  mapped_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mapped_at: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
productKpiMappingSchema.index({ cbs_product_name: 1, status: 1 });
productKpiMappingSchema.index({ kpi_category: 1, status: 1 });

export default mongoose.model('ProductKpiMapping', productKpiMappingSchema);

