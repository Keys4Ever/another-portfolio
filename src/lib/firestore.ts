import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { getYoutubeId } from './youtube';

export interface ThoughtData {
    id: string;
    content: string;
    username: string;
    userAvatarUrl: string;
    timestamp: any;
}

export interface ListeningData {
    id: string;
    song: string;
    startTime?: number;
    endTime?: number;
    username: string;
    userAvatarUrl: string;
    timestamp: any;
}

export const subscribeToLatestThought = (callback: (data: ThoughtData | null) => void) => {
    const q = query(
        collection(db, 'thoughts'),
        orderBy('timestamp', 'desc'),
        limit(1)
    );

    return onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            callback({ id: doc.id, ...doc.data() } as ThoughtData);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to latest thought:", error);
        callback(null);
    });
};

export const subscribeToListeningTo = (callback: (data: ListeningData | null) => void) => {
    const q = query(
        collection(db, 'listening_to'),
        orderBy('timestamp', 'desc'),
        limit(1)
    );

    return onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            callback(null);
            return;
        }

        const doc = querySnapshot.docs[0];
        const data = { id: doc.id, ...doc.data() } as ListeningData;
        callback(getYoutubeId(data.song) ? data : null);
    }, (error) => {
        console.error("Error subscribing to listening status:", error);
        callback(null);
    });
};
