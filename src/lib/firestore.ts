import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

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
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            callback({ id: doc.id, ...doc.data() } as ListeningData);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to listening status:", error);
        callback(null);
    });
};

export const getLatestThought = async (): Promise<ThoughtData | null> => {
    try {
        const q = query(
            collection(db, 'thoughts'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as ThoughtData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching latest thought:", error);
        return null;
    }
};

export const getListeningTo = async (): Promise<ListeningData | null> => {
    try {
        const q = query(
            collection(db, 'listening_to'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as ListeningData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching listening status:", error);
        return null;
    }
};
