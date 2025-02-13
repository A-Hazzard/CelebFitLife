// lib/services/SubscriptionService.ts
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Assuming this is the path to your Firebase configuration

export async function createSubscription({
    userId,
    planId,
    maxStreamers,
    status,
    price,
  }: {
    userId: string;
    planId: string;   // e.g. 'basic', 'plus', 'unlimited'
    maxStreamers: number;  // now just 'number'
    status: string;   // e.g. 'trialing', 'active'
    price: number;
  }) {
    const subRef = doc(collection(db, 'subscriptions'));
    const subId = subRef.id;
  
    await setDoc(subRef, {
      sub_id: subId,
      user_id: userId,
      plan_id: planId,
      max_streamers: maxStreamers,
      status,
      price,
      created_at: serverTimestamp(),
    });
  
    return subId;
  }