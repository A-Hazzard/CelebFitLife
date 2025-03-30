import { db } from '@/lib/config/firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

export const fetchStreamersWithStreams = async () => {
  const streamerCol = collection(db, 'streamer');
  const streamerSnap = await getDocs(streamerCol);

  const streamerData: any[] = [];

  for (const streamerDoc of streamerSnap.docs) {
    const streamer = { id: streamerDoc.id, ...streamerDoc.data() };

    const streamQuery = query(
      collection(db, 'streams'),
      where('streamerId', '==', streamerDoc.id) // Make sure this matches
    );

    const streamSnap = await getDocs(streamQuery);
    const streams = streamSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    streamerData.push({ ...streamer, streams });
  }

  return streamerData;
};
