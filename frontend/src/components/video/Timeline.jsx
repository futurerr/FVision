import React, { useState, useEffect, useRef } from 'react';

const Timeline = ({ videoRef, duration, events = [] }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [hoverTime, setHoverTime] = useState(0);
    const timelineRef = useRef(null);

    useEffect(() => {
        if (!videoRef?.current) return;

        const video = videoRef.current;
        const updateTime = () => setCurrentTime(video.currentTime);

        video.addEventListener('timeupdate', updateTime);
        return () => video.removeEventListener('timeupdate', updateTime);
    }, [videoRef]);

    const handleTimelineClick = (e) => {
        if (!timelineRef.current || !videoRef?.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = percentage * duration;

        videoRef.current.currentTime = newTime;
    };

    const handleMouseMove = (e) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
        setHoverTime(percentage * duration);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const hoverProgress = duration > 0 ? (hoverTime / duration) * 100 : 0;

    return (
        <div style={{
            background: 'rgba(6, 10, 20, 0.9)',
            backdropFilter: 'blur(30px) saturate(200%)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            position: 'relative'
        }}>
            {/* HUD Scanline Effect */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 2px, 3px 100%',
                pointerEvents: 'none',
                opacity: 0.1,
                borderRadius: '16px'
            }} />

            {/* Header Info */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '4px', height: '16px', background: 'var(--color-accent-cyan)',
                        boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)'
                    }} />
                    <span style={{
                        fontSize: '12px', fontWeight: '900', color: 'var(--color-accent-cyan)',
                        letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Orbitron'
                    }}>TACTICAL_TIMELINE_V7</span>
                </div>
                <div style={{
                    fontSize: '18px', color: '#fff', fontWeight: 'bold',
                    fontFamily: 'Orbitron, monospace', textShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
                }}>
                    {formatTime(currentTime)} <span style={{ color: '#64748b', fontSize: '12px' }}>/ {formatTime(duration)}</span>
                </div>
            </div>

            {/* Main Timeline Control */}
            <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                style={{
                    position: 'relative',
                    height: '60px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '4px',
                    cursor: 'crosshair',
                    marginBottom: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}
            >
                {/* Background Grid Marks */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '5% 100%',
                    pointerEvents: 'none'
                }} />

                {/* Progress Bar (Glow) */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress}%`,
                    background: 'linear-gradient(90deg, rgba(34, 211, 238, 0.05), rgba(34, 211, 238, 0.2))',
                    borderRight: '2px solid var(--color-accent-cyan)',
                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
                    transition: 'width 0.1s linear'
                }} />

                {/* Hover Indicator */}
                {isHovering && (
                    <div style={{
                        position: 'absolute', left: `${hoverProgress}%`, top: 0, bottom: 0,
                        width: '1px', background: 'rgba(255,255,255,0.3)', zIndex: 5,
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-25px', left: '50%',
                            transform: 'translateX(-50%)', background: '#22d3ee',
                            padding: '2px 6px', borderRadius: '4px', color: '#000',
                            fontSize: '10px', fontWeight: 'bold'
                        }}>
                            {formatTime(hoverTime)}
                        </div>
                    </div>
                )}

                {/* Event Markers (Upgraded) */}
                {events.map((event, idx) => {
                    const eventPos = (event.time / duration) * 100;
                    return (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute', left: `${eventPos}%`, top: '10px', bottom: '10px',
                                width: '2px', background: event.type === 'high_activity' ? '#f59e0b' : '#22d3ee',
                                boxShadow: `0 0 10px ${event.type === 'high_activity' ? '#f59e0b' : '#22d3ee'}`,
                                zIndex: 10
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                width: '6px', height: '6px', borderRadius: '50%', background: 'inherit'
                            }} />
                        </div>
                    );
                })}

                {/* Scrubber Playhead */}
                <div style={{
                    position: 'absolute', left: `${progress}%`, top: '-10px', bottom: '-10px',
                    width: '2px', background: '#fff', zIndex: 20, pointerEvents: 'none',
                    boxShadow: '0 0 15px #fff'
                }}>
                    <div style={{
                        position: 'absolute', top: '0', left: '50%', transform: 'translate(-50%, -50%)',
                        width: '10px', height: '10px', background: '#fff', transform: 'translateX(-50%) rotate(45deg)'
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '0', left: '50%', transform: 'translate(-50%, 50%)',
                        width: '10px', height: '10px', background: '#fff', transform: 'translateX(-50%) rotate(45deg)'
                    }} />
                </div>
            </div>

            {/* Time Graduation Marks */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0 5px', fontSize: '9px', color: '#64748b', fontFamily: 'monospace'
            }}>
                {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '1px', height: '5px', background: '#334155', marginBottom: '4px' }} />
                        {formatTime((duration * i) / 10)}
                    </div>
                ))}
            </div>

            {/* Event Log (Sub-HUD) */}
            <div style={{
                marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', gap: '20px', overflowX: 'auto'
            }}>
                {events.slice(0, 5).map((ev, i) => (
                    <div key={i} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-accent-cyan)', fontSize: '10px', fontWeight: 'bold' }}>{formatTime(ev.time)}</span>
                        <span style={{ color: '#94a3b8', fontSize: '10px' }}>{ev.description}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timeline;
