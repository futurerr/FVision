import React, { useEffect, useRef, useState } from 'react';

const TrajectoryOverlay = ({ trackingData, videoRef, videoWidth, videoHeight, showTrajectories }) => {
    const canvasRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (!videoRef?.current) return;
        const video = videoRef.current;
        const updateTime = () => setCurrentTime(video.currentTime);
        video.addEventListener('timeupdate', updateTime);
        return () => video.removeEventListener('timeupdate', updateTime);
    }, [videoRef]);

    useEffect(() => {
        if (!trackingData || !canvasRef.current || !showTrajectories) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const w = videoWidth || canvas.clientWidth || 100;
        const h = videoHeight || canvas.clientHeight || 100;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const frames = trackingData.frames || [];
        if (frames.length === 0) return;

        const fps = trackingData.metadata?.fps || 25;
        const currentFrameIdx = Math.floor(currentTime * fps);
        const scaleX = canvas.width / (trackingData.metadata?.width || 1920);
        const scaleY = canvas.height / (trackingData.metadata?.height || 1080);

        const trajectories = {};
        frames.forEach((frame, idx) => {
            frame.detections?.forEach(det => {
                if (det.id !== null && det.id !== undefined) {
                    if (!trajectories[det.id]) trajectories[det.id] = [];
                    trajectories[det.id].push({ x: det.center[0], y: det.center[1], frame: idx, team_id: det.team_id });
                }
            });
        });

        const drawTensionArrow = (ctx, sx, sy, ex, ey, color) => {
            const angle = Math.atan2(ey - sy, ex - sx);
            const dist = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
            if (dist < 8) return;

            // Arrow metrics based on speed/distance
            const baseWidth = Math.min(6, dist / 15 + 2);
            const headLength = Math.min(25, dist / 4 + 10);
            const headWidth = headLength * 0.8;

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);

            // Shadow/Glow
            ctx.shadowBlur = 12;
            ctx.shadowColor = color;

            // Create Gradient for the body
            const grad = ctx.createLinearGradient(0, 0, dist, 0);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            grad.addColorStop(0.5, color);
            grad.addColorStop(1, '#fff');

            ctx.fillStyle = grad;

            // Draw tapered arrow body + head as one polygon for 'tension'
            ctx.beginPath();
            ctx.moveTo(0, -baseWidth / 2); // Start top
            ctx.lineTo(dist - headLength, -baseWidth / 1.5); // Body top
            ctx.lineTo(dist - headLength, -headWidth / 2); // Shoulder top
            ctx.lineTo(dist, 0); // Tip
            ctx.lineTo(dist - headLength, headWidth / 2); // Shoulder bottom
            ctx.lineTo(dist - headLength, baseWidth / 1.5); // Body bottom
            ctx.lineTo(0, baseWidth / 2); // Start bottom
            ctx.closePath();
            ctx.fill();

            // Add a sharp center line for more 'hi-tech' feel
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(dist * 0.2, 0);
            ctx.lineTo(dist * 0.8, 0);
            ctx.stroke();

            ctx.restore();
        };

        // Render dynamic arrows only
        Object.values(trajectories).forEach(points => {
            const currentIdx = points.findIndex(p => p.frame === currentFrameIdx);
            if (currentIdx === -1) return;

            // 20-frame vector for more substantial arrow
            const windowSize = 20;
            const startIdx = Math.max(0, currentIdx - windowSize);
            const pStart = points[startIdx];
            const pCurrent = points[currentIdx];
            if (!pStart || !pCurrent) return;

            const teamId = pCurrent.team_id;
            const color = teamId === 0 ? '#22d3ee' : teamId === 1 ? '#10b981' : 'rgba(255, 255, 255, 0.6)';

            const sx = pStart.x * scaleX;
            const sy = pStart.y * scaleY;
            const ex = pCurrent.x * scaleX;
            const ey = pCurrent.y * scaleY;

            // Draw the Tension Arrow
            drawTensionArrow(ctx, sx, sy, ex, ey, color);

            // Stationary indicator if needed
            const movement = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
            if (movement < 8) {
                ctx.fillStyle = color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = color;
                ctx.beginPath();
                ctx.arc(ex, ey, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

    }, [trackingData, showTrajectories, currentTime, videoWidth, videoHeight]);

    if (!showTrajectories) return null;

    return (
        <canvas
            ref={canvasRef}
            width={videoWidth}
            height={videoHeight}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2
            }}
        />
    );
};

export default TrajectoryOverlay;
