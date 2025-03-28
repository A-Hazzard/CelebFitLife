import { db } from '@/lib/config/firebase';
import { ChatMessage } from '@/lib/types/stream';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export async function sendChatMessage(slug: string, userName: string, content: string) {
  try {
    console.log(`💬 Sending message: ${content} to stream: ${slug}`);
    const ref = collection(db, "streams", slug, "messages");

    await addDoc(ref, {
      userName,
      content,
      createdAt: serverTimestamp(),
    });

  } catch (error) {
    console.error("❌ Error sending chat message:", error);
  }
}

export function listenToMessages(slug: string, cb: (msgs: ChatMessage[]) => void) {
  console.log(`📡 Subscribing to chat messages for stream: ${slug}`);

  const ref = collection(db, "streams", slug, "messages");
  const q = query(ref, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((doc) => {
      console.log("🔥 New message received:", doc.data());
      return { ...doc.data(), id: doc.id } as ChatMessage;
    });

    cb(messages);
  });
}
