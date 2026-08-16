export const getYoutubeId = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? null;
};

export const getYoutubeThumbnail = (url?: string): string | null => {
    const id = getYoutubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
};

export type YoutubePlayer = {
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    getPlayerState: () => number;
    getVideoData: () => { title?: string; video_id?: string; author?: string };
    setVolume: (volume: number) => void;
    getVolume: () => number;
    mute: () => void;
    unMute: () => void;
    isMuted: () => boolean;
    destroy: () => void;
};

type YoutubeApi = {
    Player: new (
        element: HTMLElement,
        options: {
            videoId: string;
            width?: string | number;
            height?: string | number;
            playerVars?: Record<string, string | number | undefined>;
            events?: {
                onReady?: (event: { target: YoutubePlayer }) => void;
                onStateChange?: (event: { data: number; target: YoutubePlayer }) => void;
            };
        }
    ) => YoutubePlayer;
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

declare global {
    interface Window {
        YT?: YoutubeApi;
        onYouTubeIframeAPIReady?: () => void;
    }
}

export const loadYoutubeApi = (): Promise<YoutubeApi> => {
    if (window.YT?.Player) {
        return Promise.resolve(window.YT);
    }

    return new Promise((resolve) => {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            if (window.YT) resolve(window.YT);
        };

        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }
    });
};
