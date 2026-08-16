import { useEffect, useRef, useState } from 'react';
import type { ListeningData } from '../lib/firestore';
import {
    getYoutubeId,
    getYoutubeThumbnail,
    loadYoutubeApi,
    type YoutubePlayer,
} from '../lib/youtube';

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ratioFromPointer = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
};

export default function NowPlayingPlayer({ listening }: { listening: ListeningData }) {
    const boxRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YoutubePlayer | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const volumeRef = useRef<HTMLDivElement>(null);
    const volumeValueRef = useRef(80);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [clipStart, setClipStart] = useState(listening.startTime ?? 0);
    const [clipEnd, setClipEnd] = useState(listening.endTime ?? 0);
    const [current, setCurrent] = useState(listening.startTime ?? 0);
    const [title, setTitle] = useState('');
    const [volume, setVolume] = useState(80);
    const [muted, setMuted] = useState(false);

    const videoId = getYoutubeId(listening.song);
    const thumbnail = getYoutubeThumbnail(listening.song);
    const sourceUrl = listening.song;

    useEffect(() => {
        if (!videoId || !boxRef.current) return;

        const box = boxRef.current;
        const host = document.createElement('div');
        host.className = 'h-full w-full';
        box.appendChild(host);

        let cancelled = false;
        const start = listening.startTime ?? 0;
        setTitle('');

        loadYoutubeApi().then((YT) => {
            if (cancelled) return;

            const playerVars: Record<string, string | number> = {
                autoplay: 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                fs: 0,
                disablekb: 1,
                playsinline: 1,
                iv_load_policy: 3,
                origin: window.location.origin,
                start: Math.floor(start),
            };

            if (listening.endTime) {
                playerVars.end = Math.floor(listening.endTime);
            }

            const player = new YT.Player(host, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars,
                events: {
                    onReady: (event) => {
                        const duration = event.target.getDuration();
                        const end = listening.endTime && listening.endTime > start
                            ? listening.endTime
                            : duration;
                        setClipStart(start);
                        setClipEnd(end);
                        setCurrent(start);
                        setProgress(0);
                        setTitle(event.target.getVideoData().title ?? '');
                        event.target.seekTo(start, true);
                        event.target.setVolume(volumeValueRef.current);
                        if (volumeValueRef.current === 0) event.target.mute();
                        else event.target.unMute();
                    },
                    onStateChange: (event) => {
                        setPlaying(event.data === YT.PlayerState.PLAYING);
                        if (event.data === YT.PlayerState.ENDED) {
                            event.target.seekTo(start, true);
                            event.target.pauseVideo();
                        }
                    },
                },
            });

            playerRef.current = player;
        });

        return () => {
            cancelled = true;
            playerRef.current?.destroy();
            playerRef.current = null;
            host.remove();
        };
    }, [videoId, listening.startTime, listening.endTime]);

    useEffect(() => {
        if (!playing) return;

        const tick = () => {
            const player = playerRef.current;
            if (!player) return;

            const start = clipStart;
            const end = clipEnd;
            const time = player.getCurrentTime();

            if (end > start && time >= end) {
                player.pauseVideo();
                player.seekTo(start, true);
                setPlaying(false);
                setProgress(0);
                setCurrent(start);
                return;
            }

            setCurrent(time);
            if (end > start) setProgress((time - start) / (end - start));
        };

        const id = window.setInterval(tick, 200);
        return () => window.clearInterval(id);
    }, [playing, clipStart, clipEnd]);

    const seekToRatio = (ratio: number) => {
        const player = playerRef.current;
        if (!player || clipEnd <= clipStart) return;
        const next = clipStart + Math.min(1, Math.max(0, ratio)) * (clipEnd - clipStart);
        player.seekTo(next, true);
        setCurrent(next);
        setProgress((next - clipStart) / (clipEnd - clipStart));
    };

    const applyVolume = (next: number) => {
        const value = Math.round(Math.min(100, Math.max(0, next)));
        volumeValueRef.current = value;
        setVolume(value);
        setMuted(value === 0);

        const player = playerRef.current;
        if (!player) return;
        player.setVolume(value);
        if (value === 0) player.mute();
        else player.unMute();
    };

    const toggleMute = () => {
        const player = playerRef.current;
        if (!player) return;

        if (muted || volume === 0) {
            const restored = volume === 0 ? 80 : volume;
            applyVolume(restored);
            return;
        }

        setMuted(true);
        player.mute();
    };

    const onVolumePointer = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        applyVolume(ratioFromPointer(event) * 100);
    };

    const onVolumeMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        applyVolume(ratioFromPointer(event) * 100);
    };

    const onTrackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        seekToRatio(ratioFromPointer(event));
    };

    const onTrackMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        seekToRatio(ratioFromPointer(event));
    };

    const togglePlay = () => {
        const player = playerRef.current;
        if (!player) return;

        if (playing) {
            player.pauseVideo();
            return;
        }

        const time = player.getCurrentTime();
        if (time < clipStart || (clipEnd && time >= clipEnd)) {
            player.seekTo(clipStart, true);
        }
        player.playVideo();
    };

    return (
        <div className="flex items-center gap-4">
            <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir el tema"
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-zinc-700"
            >
                {thumbnail && (
                    <img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div
                    ref={boxRef}
                    className="absolute inset-0 overflow-hidden pointer-events-none [&_iframe]:absolute [&_iframe]:left-1/2 [&_iframe]:top-1/2 [&_iframe]:h-full [&_iframe]:w-[177.78%] [&_iframe]:max-w-none [&_iframe]:-translate-x-1/2 [&_iframe]:-translate-y-1/2 [&_iframe]:border-0"
                />
            </a>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir el tema"
                    className="truncate text-sm text-zinc-200 hover:text-[#d16c8a] transition-colors"
                >
                    {title || '…'}
                </a>

                <div
                    ref={trackRef}
                    role="slider"
                    aria-label="Progreso"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    tabIndex={0}
                    onPointerDown={onTrackPointer}
                    onPointerMove={onTrackMove}
                    className="relative h-6 cursor-pointer touch-none"
                >
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-700" />
                    <div
                        className="absolute top-1/2 h-px -translate-y-1/2 bg-[#d16c8a]"
                        style={{ width: `${progress * 100}%` }}
                    />
                    <div
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d16c8a] bg-zinc-950"
                        style={{ left: `${progress * 100}%` }}
                    />
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center text-[10px] font-ank uppercase tracking-widest text-zinc-500">
                    <div />
                    <div className="flex items-center gap-3">
                        <span className="w-8">{formatTime(current - clipStart)}</span>
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={playing ? 'Pausar' : 'Reproducir'}
                            className="flex h-7 w-7 items-center justify-center text-zinc-300 hover:text-[#d16c8a] transition-colors"
                        >
                            {playing ? (
                                <span className="flex gap-[3px]" aria-hidden>
                                    <span className="h-3 w-[3px] bg-current" />
                                    <span className="h-3 w-[3px] bg-current" />
                                </span>
                            ) : (
                                <span
                                    className="ml-0.5 h-0 w-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-current"
                                    aria-hidden
                                />
                            )}
                        </button>
                        <span className="w-8">{formatTime(Math.max(0, clipEnd - clipStart))}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 pl-3">
                        <button
                            type="button"
                            onClick={toggleMute}
                            aria-label={muted || volume === 0 ? 'Activar sonido' : 'Silenciar'}
                            className="flex h-7 w-7 shrink-0 items-center justify-center text-zinc-400 hover:text-[#d16c8a] transition-colors"
                        >
                            {muted || volume === 0 ? (
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                                    <path d="m16 10 5 5M21 10l-5 5" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                                    <path d="M16 9.5a5 5 0 0 1 0 5M18.5 7a8 8 0 0 1 0 10" />
                                </svg>
                            )}
                        </button>
                        <div
                            ref={volumeRef}
                            role="slider"
                            aria-label="Volumen"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={muted ? 0 : volume}
                            tabIndex={0}
                            onPointerDown={onVolumePointer}
                            onPointerMove={onVolumeMove}
                            className="relative h-6 w-8 cursor-pointer touch-none"
                        >
                            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-700" />
                            <div
                                className="absolute top-1/2 h-px -translate-y-1/2 bg-[#d16c8a]"
                                style={{ width: `${muted ? 0 : volume}%` }}
                            />
                            <div
                                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d16c8a] bg-zinc-950"
                                style={{ left: `${muted ? 0 : volume}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
