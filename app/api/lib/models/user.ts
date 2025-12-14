import mongoose, { Document, Model, Schema } from 'mongoose';



export interface IUser extends Document {
  email: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';
  stripeCheckoutId?: string;
  stripeCustomerId?: string;
  waitListEmailSent?: boolean;
  
  // Email Verification
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  
  // Voting & Roles
  votedFor?: string;
  role: 'user' | 'admin';
  password?: string; // select: false
  
  // Metadata
  ip?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  deviceType?: string;
  
  paidAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
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
      enum: ['unpaid', 'pending', 'paid', 'refunded', 'failed'],
      default: 'unpaid',
      required: true
    },
    stripeCheckoutId: { type: String, default: null },
    stripeCustomerId: { type: String, default: null },
    waitListEmailSent: { type: Boolean, default: false },
    
    // Email Verification
    isVerified: { type: Boolean, default: false, required: true },
    verificationToken: { type: String, default: null, index: true },
    verificationTokenExpiry: { type: Date, default: null },
    
    votedFor: { type: String },
    
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    password: { type: String, select: false },
    
    ip: { type: String },
    country: { type: String },
    city: { type: String },
    userAgent: { type: String },
    deviceType: { type: String },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Prevent model recompilation
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
