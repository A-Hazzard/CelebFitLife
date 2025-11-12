import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for type safety
export interface IWaitlist extends Document {
  email: string;
  paymentStatus: 'pending' | 'complete';
  stripeCheckoutId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const WaitlistSchema = new Schema<IWaitlist>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'complete'],
      default: 'pending',
      required: true
    },
    stripeCheckoutId: {
      type: String,
      default: null
    },
    stripeCustomerId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true, // This automatically adds createdAt & updatedAt
    collection: 'waitlist'
  }
);

// Prevent model recompilation in Next.js hot reload
const Waitlist: Model<IWaitlist> = 
  mongoose.models.Waitlist || mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);

export default Waitlist;