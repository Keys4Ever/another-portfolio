import { useState, useEffect } from 'react';
import { 
    subscribeToLatestThought, 
    subscribeToListeningTo, 
    type ThoughtData, 
    type ListeningData 
} from '../lib/firestore';

export const useThoughtsData = () => {
    const [thought, setThought] = useState<ThoughtData | null>(null);
    const [listening, setListening] = useState<ListeningData | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [thoughtLoaded, setThoughtLoaded] = useState(false);
    const [listeningLoaded, setListeningLoaded] = useState(false);

    useEffect(() => {
        const unsubscribeThought = subscribeToLatestThought((data) => {
            setThought(data);
            setThoughtLoaded(true);
        });

        const unsubscribeListening = subscribeToListeningTo((data) => {
            setListening(data);
            setListeningLoaded(true);
        });

        return () => {
            unsubscribeThought();
            unsubscribeListening();
        };
    }, []);

    useEffect(() => {
        if (thoughtLoaded && listeningLoaded) {
            setLoading(false);
        }
    }, [thoughtLoaded, listeningLoaded]);

    return { thought, listening, loading };
};
