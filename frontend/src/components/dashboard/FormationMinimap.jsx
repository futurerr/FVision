import React, { useEffect, useState, useRef } from 'react';

const FormationMinimap = ({ trackingData, videoRef }) => {
    const canvasRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (!videoRef?.current) return;
        const video = videoRef.current;
        const update = () => setCurrentTime(video.currentTime);
        video.addEventListener('timeupdate', update);
        return () => video.removeEventListener('timeupdate', update);
    }, [videoRef]);

    useEffect(() => {
        if (!trackingData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Clear and draw pitch
        ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
        ctx.fillRect(0, 0, w, h);

        // Pitch markings
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(5, 5, w - 10, h - 10);
        ctx.beginPath();
        ctx.moveTo(w / 2, 5);
        ctx.lineTo(w / 2, h - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 20, 0, Math.PI * 2);
        ctx.stroke();

        const fps = trackingData.metadata?.fps || 25;
        const frameIdx = Math.floor(currentTime * fps);
        const frameData = trackingData.frames?.find(f => f.frame === frameIdx);

        if (frameData && frameData.detections) {
            const videoW = trackingData.metadata?.width || 1920;
            const videoH = trackingData.metadata?.height || 1080;

            frameData.detections.forEach(det => {
                const [cx, cy] = det.center || [0, 0];
                const px = (cx / videoW) * (w - 10) + 5;
                const py = (cy / videoH) * (h - 10) + 5;

                const color = det.team_id === 0 ? '#22d3ee' : det.team_id === 1 ? '#10b981' : '#94a3b8';

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();

                // Active glow for the dots
                ctx.shadowBlur = 5;
                ctx.shadowColor = color;
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        }
    }, [trackingData, currentTime]);

    return (
        <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px',
            marginTop: '10px'
        }}>
            <div style={{ fontSize: '10px', color: 'var(--color-accent-cyan)', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'Orbitron' }}>LIVE_FORMATION_MINIMAP</div>
            <canvas
                ref={canvasRef}
                width={300}
                height={180}
                style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
            />
        </div>
    );
};

export default FormationMinimap;
