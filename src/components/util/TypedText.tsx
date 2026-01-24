import { useTypewriter } from '../../hooks/useTypewriter';

interface TypedTextProps {
    words?: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
    className?: string;
}

export default function TypedText({
    words = ["Developer", "Designer", "Creator"],
    typingSpeed = 150,
    deletingSpeed = 75,
    pauseDuration = 2000,
    className = ""
}: TypedTextProps) {
    const text = useTypewriter({
        words,
        typingSpeed,
        deletingSpeed,
        pauseDuration
    });

    return (
        <div className={`inline-flex items-center font-mono text-lg ${className}`}>
            <span className="text-foreground">{text}</span>
            <span className="cursor ml-1 w-2 h-5 bg-current block animate-blink"></span>
            <style>{`
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
        </div>
    );
}
