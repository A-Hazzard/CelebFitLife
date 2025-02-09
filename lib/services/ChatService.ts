import { db } from '@/config/firebase';
import { ChatMessage } from '@/types/stream';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export async function sendChatMessage(slug: string, userName: string, content: string) {
  const ref = collection(db, 'streams', slug, 'messages');
  await addDoc(ref, {
    userName,
    content,
    createdAt: serverTimestamp(),
  });
}

export function listenToMessages(slug: string, cb: (msgs: ChatMessage[]) => void) {
  const ref = collection(db, 'streams', slug, 'messages');
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((doc) => ({
      ...doc.data() as ChatMessage,
    }));
    cb(messages);
  });
}
