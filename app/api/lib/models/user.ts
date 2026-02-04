/**
 * User Model - Firestore
 *
 * Provides CRUD operations for users collection.
 * Mirrors the previous Mongoose User model API for migration compatibility.
 *
 * @module app/api/lib/models/user
 */

import { getFirestore } from './db';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';
export type UserRole = 'user' | 'admin';

export type User = {
  _id: string;
  email: string;
  paymentStatus: PaymentStatus;
  stripeCheckoutId?: string;
  stripeCustomerId?: string;
  waitListEmailSent?: boolean;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  votedFor?: string;
  role: UserRole;
  password?: string;
  ip?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  deviceType?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCreateInput = Partial<Omit<User, '_id' | 'createdAt' | 'updatedAt'>> & {
  email: string;
  paymentStatus: PaymentStatus;
  isVerified: boolean;
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserUpdateInput = {
  [K in keyof Omit<User, '_id' | 'email'>]?: User[K] | null;
};

const USERS_COLLECTION = 'users';

function mapTimestamp(t: unknown): Date | undefined {
  if (!t) return undefined;
  if (t instanceof Date) return t;
  const val = t as { toDate?: () => Date };
  if (typeof val.toDate === 'function') return val.toDate();
  return new Date(t as string | number);
}

function toUserData(data: Record<string, unknown>, id: string): User {
  return {
    _id: id,
    email: String(data.email || ''),
    paymentStatus: (data.paymentStatus as PaymentStatus) ?? 'unpaid',
    stripeCheckoutId: (data.stripeCheckoutId as string | undefined) ?? undefined,
    stripeCustomerId: (data.stripeCustomerId as string | undefined) ?? undefined,
    waitListEmailSent: Boolean(data.waitListEmailSent ?? false),
    isVerified: Boolean(data.isVerified ?? false),
    verificationToken: (data.verificationToken as string | undefined) ?? undefined,
    verificationTokenExpiry: data.verificationTokenExpiry
      ? mapTimestamp(data.verificationTokenExpiry)
      : undefined,
    votedFor: (data.votedFor as string | undefined) ?? undefined,
    role: (data.role as UserRole) ?? 'user',
    password: (data.password as string | undefined) ?? undefined,
    ip: (data.ip as string | undefined) ?? undefined,
    country: (data.country as string | undefined) ?? undefined,
    city: (data.city as string | undefined) ?? undefined,
    userAgent: (data.userAgent as string | undefined) ?? undefined,
    deviceType: (data.deviceType as string | undefined) ?? undefined,
    paidAt: data.paidAt ? mapTimestamp(data.paidAt) : undefined,
    createdAt: mapTimestamp(data.createdAt) ?? new Date(),
    updatedAt: mapTimestamp(data.updatedAt) ?? new Date(),
  };
}

function toFirestoreDate(date: Date) {
  const { Timestamp } = require('firebase-admin/firestore');
  return Timestamp.fromDate(date);
}

function toFirestore(data: Partial<User> | UserUpdateInput): Record<string, unknown> {
  const { FieldValue } = require('firebase-admin/firestore');
  const out: Record<string, unknown> = {};
  const fields = [
    'email',
    'paymentStatus',
    'stripeCheckoutId',
    'stripeCustomerId',
    'waitListEmailSent',
    'isVerified',
    'verificationToken',
    'verificationTokenExpiry',
    'votedFor',
    'role',
    'password',
    'ip',
    'country',
    'city',
    'userAgent',
    'deviceType',
    'paidAt',
    'createdAt',
    'updatedAt',
  ] as const;

  for (const key of fields) {
    const val = (data as Record<string, unknown>)[key];
    if (val === undefined) continue;
    if (val === null) {
      out[key] = FieldValue.delete();
    } else if (val instanceof Date) {
      out[key] = toFirestoreDate(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Find user by email */
export async function findOneByEmail(email: string): Promise<User | null> {
  const db = getFirestore();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', email.toLowerCase().trim())
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return toUserData(docSnap.data(), docSnap.id);
}

/** Find user by verification token */
export async function findOneByVerificationToken(
  token: string
): Promise<User | null> {
  const db = getFirestore();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('verificationToken', '==', token)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return toUserData(docSnap.data(), docSnap.id);
}

/** Find user by ID (document ID) */
export async function findById(id: string): Promise<User | null> {
  const db = getFirestore();
  const docRef = db.collection(USERS_COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;
  return toUserData(docSnap.data() ?? {}, docSnap.id);
}

/** Find user by email with password (for admin login) */
export async function findOneByEmailWithPassword(
  email: string
): Promise<User | null> {
  return findOneByEmail(email);
}

/** Find user by Stripe customer ID */
export async function findOneByStripeCustomerId(
  stripeCustomerId: string
): Promise<User | null> {
  const db = getFirestore();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('stripeCustomerId', '==', stripeCustomerId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return toUserData(docSnap.data(), docSnap.id);
}

/** Create new user */
export async function createUser(input: UserCreateInput): Promise<User> {
  const db = getFirestore();
  const usersRef = db.collection(USERS_COLLECTION);
  const now = new Date();
  const withDefaults = {
    role: 'user' as UserRole,
    ...input,
  };
  const data = {
    ...toFirestore(withDefaults),
    createdAt: toFirestoreDate(now),
    updatedAt: toFirestoreDate(now),
  };
  const docRef = await usersRef.add(data);
  const created = await docRef.get();
  return toUserData(created.data() ?? {}, created.id);
}

/** Update user by ID */
export async function updateById(
  id: string,
  update: UserUpdateInput
): Promise<User | null> {
  const db = getFirestore();
  const docRef = db.collection(USERS_COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;

  const firestoreUpdate = toFirestore({
    ...update,
    updatedAt: new Date(),
  });
  await docRef.update(firestoreUpdate);
  const updated = await docRef.get();
  return toUserData(updated.data() ?? {}, updated.id);
}

/** Find all users */
export async function findAll(): Promise<User[]> {
  const db = getFirestore();
  const snapshot = await db.collection(USERS_COLLECTION).get();
  return snapshot.docs.map((d) => toUserData(d.data(), d.id));
}

/** Count all users */
export async function countDocuments(): Promise<number> {
  const db = getFirestore();
  const snapshot = await db.collection(USERS_COLLECTION).get();
  return snapshot.size;
}

/** Find users with pagination (sort by createdAt desc) */
export async function findWithPagination(
  skip: number,
  take: number
): Promise<User[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(skip + take)
    .get();
  const docs = snapshot.docs.slice(skip, skip + take);
  return docs.map((d) => toUserData(d.data(), d.id));
}
