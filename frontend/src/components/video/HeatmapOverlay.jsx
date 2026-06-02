import React, { useEffect, useRef } from 'react';

const HeatmapOverlay = ({ heatmapData, videoWidth, videoHeight }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!heatmapData || !heatmapData.data || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Ensure dimensions are valid or fallback
        const w = videoWidth || canvas.clientWidth || 100;
        const h = videoHeight || canvas.clientHeight || 100;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { grid_size, data } = heatmapData;
        if (!grid_size || !data || !data.length) return;

        const cellWidth = canvas.width / grid_size;
        const cellHeight = canvas.height / grid_size;

        // Draw heatmap
        for (let y = 0; y < grid_size; y++) {
            if (!data[y]) continue;
            for (let x = 0; x < grid_size; x++) {
                const value = data[y][x];
                if (value > 0.05) { // Only draw cells with significant activity
                    // Color gradient: blue (low) -> cyan -> yellow -> red (high)
                    const color = getHeatmapColor(value);
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x * cellWidth,
                        y * cellHeight,
                        cellWidth,
                        cellHeight
                    );
                }
            }
        }
    }, [heatmapData, videoWidth, videoHeight]);

    // Color mapping function
    const getHeatmapColor = (value) => {
        // value is 0-1
        const alpha = Math.min(0.6, value * 0.8); // Max 60% opacity

        if (value < 0.25) {
            // Blue
            return `rgba(59, 130, 246, ${alpha})`;
        } else if (value < 0.5) {
            // Cyan
            return `rgba(34, 211, 238, ${alpha})`;
        } else if (value < 0.75) {
            // Yellow
            return `rgba(250, 204, 21, ${alpha})`;
        } else {
            // Red
            return `rgba(239, 68, 68, ${alpha})`;
        }
    };

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
                zIndex: 2 // Above video, below tracking boxes
            }}
        />
    );
};

export default HeatmapOverlay;
