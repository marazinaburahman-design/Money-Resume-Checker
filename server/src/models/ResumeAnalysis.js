import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner userId is required'],
      index: true,
    },
    jobRole: {
      type: String,
      required: [true, 'jobRole is required'],
      trim: true,
    },
    score: {
      type: Number,
      required: [true, 'score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [100, 'Score cannot exceed 100'],
    },
    skillsFound: {
      type: [String],
      default: [],
    },
    skillsMissing: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    originalFilename: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for fast user-specific chronological lookups
resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
