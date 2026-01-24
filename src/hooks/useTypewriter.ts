import { useState, useEffect, useRef } from 'react';

export interface UseTypewriterProps {
    words: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}

export const useTypewriter = ({
    words,
    typingSpeed = 150,
    deletingSpeed = 75,
    pauseDuration = 2000,
}: UseTypewriterProps) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);
    
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const currentWord = words[wordIndex % words.length];
        
        const type = () => {
            const currentLength = text.length;
            
            if (isDeleting) {
                // DELETING
                if (currentLength > 0) {
                    setText(currentWord.substring(0, currentLength - 1));
                    timeoutRef.current = setTimeout(type, deletingSpeed);
                } else {
                    // Finished deleting
                    setIsDeleting(false);
                    setWordIndex((prev) => prev + 1);
                    timeoutRef.current = setTimeout(type, typingSpeed); // Start typing next word immediately
                }
            } else {
                // TYPING
                if (currentLength < currentWord.length) {
                    setText(currentWord.substring(0, currentLength + 1));
                    timeoutRef.current = setTimeout(type, typingSpeed);
                } else {
                    // Finished typing
                    timeoutRef.current = setTimeout(() => {
                        setIsDeleting(true);
                        // Start deletion loop after pause
                        timeoutRef.current = setTimeout(type, deletingSpeed);
                    }, pauseDuration);
                }
            }
        };

        // Start the typing loop
        timeoutRef.current = setTimeout(type, typingSpeed);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [wordIndex, isDeleting, text, words, typingSpeed, deletingSpeed, pauseDuration]);

    return text;
};
