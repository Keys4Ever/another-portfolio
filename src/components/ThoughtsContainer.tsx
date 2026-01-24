import { useThoughtsData } from '../hooks/useThoughtsData';

const TerminalCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="relative overflow-hidden border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono h-full">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100%_3px]"></div>

        <div className="border-b border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-ank uppercase tracking-widest text-zinc-400">
            &gt; {title}
        </div>

        <div className="relative px-4 py-4 text-sm leading-relaxed">
            {children}
        </div>
    </div>
);

export default function ThoughtsContainer() {
    const { thought, listening, loading } = useThoughtsData();

    if (loading) {
        return (
            <div className="grid md:grid-cols-2 gap-6">
                <TerminalCard title="Latest thought">
                    <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-zinc-800 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-2 bg-zinc-800 rounded"></div>
                            <div className="h-2 bg-zinc-800 rounded w-5/6"></div>
                        </div>
                    </div>
                </TerminalCard>
                <TerminalCard title="Listening to">
                    <div className="animate-pulse h-[152px] bg-zinc-800 rounded"></div>
                </TerminalCard>
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <TerminalCard title="Latest thought">
                {thought ? (
                    <div className="flex items-start gap-3">
                        <img
                            src={thought.userAvatarUrl || "/placeholder.svg"}
                            alt={thought.username}
                            width="40"
                            height="40"
                            className="border border-zinc-700 rounded-full"
                        />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-primary">{thought.username}</span>
                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-500">
                                    {thought.timestamp?.toDate
                                        ? thought.timestamp.toDate().toLocaleDateString()
                                        : new Date().toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-zinc-300 text-sm whitespace-pre-wrap">{thought.content}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-zinc-500 italic">No thoughts yet...</p>
                )}
            </TerminalCard>

            <TerminalCard title="Listening to">
                {listening ? (
                    <div className="space-y-3">
                        <iframe
                            src={`https://open.spotify.com/embed/track/${listening.song}?utm_source=generator&theme=0`}
                            width="100%"
                            height="152"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            style={{ background: 'transparent', border: 'none' }}
                        ></iframe>
                    </div>
                ) : (
                    <p className="text-zinc-500 italic">Not listening to anything right now...</p>
                )}
            </TerminalCard>
        </div>
    );
}
