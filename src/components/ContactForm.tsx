import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DeviceInfo {
    userAgent: string;
    platform: string;
    isMobile: boolean;
}

const getDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return {
        userAgent,
        platform,
        isMobile,
    };
};

export default function ContactForm() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [clientIp, setClientIp] = useState<string | null>(null);

    useEffect(() => {
        const fetchIp = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                setClientIp(data.ip);
            } catch (err) {
                console.error('Error fetching IP:', err);
            }
        };
        
        fetchIp();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !message) {
            setError('Please, complete all the fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const deviceInfo = getDeviceInfo();
            const referrer = document.referrer || 'direct';
            
            await addDoc(collection(db, 'contact_messages'), {
                email,
                message,
                clientIp: clientIp || 'unknown',
                referrer,
                device: {
                    userAgent: deviceInfo.userAgent,
                    platform: deviceInfo.platform,
                    isMobile: deviceInfo.isMobile,
                },
                timestamp: serverTimestamp(),
            });
            
            setSubmitted(true);
            setEmail('');
            setMessage('');
            
            setTimeout(() => {
                setSubmitted(false);
            }, 5000);
        } catch (err) {
            setError('Error sending message. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono">
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100%_3px]"></div>

            <div className="border-b border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-ank uppercase tracking-widest text-zinc-400">
                &gt; Contact
            </div>

            <div className="relative px-4 py-4">
                {submitted ? (
                    <div className="flex items-center gap-2 text-[#d16c8a]">
                        <span className="text-lg">✓</span>
                        <span className="text-sm">Message sended properly!</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-2 font-ank">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#d16c8a] focus:ring-1 focus:ring-[#d16c8a]/20 transition-all"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-500 mb-2 font-ank">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your message here..."
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#d16c8a] focus:ring-1 focus:ring-[#d16c8a]/20 transition-all resize-none h-24"
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="text-xs text-red-500">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#d16c8a] text-zinc-950 font-ank text-xs uppercase tracking-widest py-2 rounded hover:bg-[#d16c8a]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Sending...' : 'Send message...'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
