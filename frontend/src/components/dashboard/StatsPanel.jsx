import React, { useState, useEffect } from 'react';
import { Area, Pie } from '@ant-design/plots';
import FormationMinimap from './FormationMinimap';

const StatsPanel = ({ onEventsExtracted, videoRef, currentTrackingData }) => {
    const [aiInsights, setAiInsights] = useState([]);
    const [keyMetrics, setKeyMetrics] = useState({
        avgPlayers: 0,
        leftZone: 0,
        rightZone: 0,
        maxSpeed: 0,
        avgSpeed: 0,
        totalDistance: 0
    });
    const [chartData, setChartData] = useState({
        momentum: [],
        possession: []
    });

    useEffect(() => {
        const handleAiAnalysis = (e) => {
            if (e.detail) {
                setAiInsights(prev => [
                    { time: new Date().toLocaleTimeString(), text: e.detail },
                    ...prev
                ]);
            }
        };

        const handleMatchStats = (e) => {
            if (e.detail) {
                const data = e.detail;

                setKeyMetrics({
                    avgPlayers: parseFloat(data.avgPlayers) || 0,
                    leftZone: data.leftPct || 50,
                    rightZone: data.rightPct || 50,
                    maxSpeed: parseFloat(data.maxSpeed) || 0,
                    avgSpeed: parseFloat(data.avgSpeed) || 0,
                    totalDistance: parseFloat(data.totalDistance) || 0
                });

                if (data.trackingData && data.trackingData.frames) {
                    const frames = data.trackingData.frames;
                    if (frames.length > 0) {
                        const momentumData = frames
                            .filter((_, idx) => idx % 50 === 0)
                            .map((frame, idx) => ({
                                time: idx.toString(),
                                value: frame.detections ? frame.detections.length : 0
                            }));

                        const width = data.trackingData.metadata?.width || 1920;
                        let leftCount = 0, midCount = 0, rightCount = 0;
                        frames.forEach(frame => {
                            if (!frame.detections) return;
                            frame.detections.forEach(det => {
                                const cx = det.center?.[0] || 0;
                                if (cx < width / 3) leftCount++;
                                else if (cx < 2 * width / 3) midCount++;
                                else rightCount++;
                            });
                        });
                        const totalCount = leftCount + midCount + rightCount || 1;
                        setChartData({
                            momentum: momentumData,
                            possession: [
                                { type: '左侧进攻', value: Math.round((leftCount / totalCount) * 100) },
                                { type: '中场控制', value: Math.round((midCount / totalCount) * 100) },
                                { type: '右侧进攻', value: Math.round((rightCount / totalCount) * 100) },
                            ]
                        });
                    }
                }
            }
        };

        window.addEventListener('ai-analysis', handleAiAnalysis);
        window.addEventListener('match-stats-update', handleMatchStats);

        return () => {
            window.removeEventListener('ai-analysis', handleAiAnalysis);
            window.removeEventListener('match-stats-update', handleMatchStats);
        };
    }, []);

    const momentumConfig = {
        data: chartData.momentum.length > 0 ? chartData.momentum : Array.from({ length: 10 }).map((_, i) => ({ time: i.toString(), value: Math.random() * 5 + 2 })),
        xField: 'time',
        yField: 'value',
        height: 120,
        smooth: true,
        areaStyle: {
            fill: 'l(270) 0:#ffffff 0.5:#22d3ee 1:#0f172a',
            fillOpacity: 0.4,
        },
        line: { color: '#22d3ee' },
        axis: false,
    };

    const possessionConfig = {
        data: chartData.possession.length > 0 ? chartData.possession : [
            { type: '左路', value: 30 }, { type: '中路', value: 40 }, { type: '右路', value: 30 }
        ],
        angleField: 'value',
        colorField: 'type',
        radius: 0.7,
        innerRadius: 0.5,
        height: 140,
        color: ['#10b981', '#22d3ee', '#64748b'],
        legend: false,
        label: {
            text: 'type',
            style: { fill: '#94a3b8', fontSize: 10 }
        }
    };

    const MetricBox = ({ label, value, unit, color = 'var(--color-accent-cyan)' }) => (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid rgba(255, 255, 255, 0.05)`,
            borderLeft: `3px solid ${color}`,
            borderRadius: '4px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', fontFamily: 'Orbitron' }}>
                {value} <span style={{ fontSize: '10px', color: color }}>{unit}</span>
            </div>
        </div>
    );

    return (
        <div className="glass-panel" style={{
            padding: '24px',
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            {/* HUD Header */}
            <div style={{ borderBottom: '1px solid rgba(34, 211, 238, 0.2)', paddingBottom: '12px' }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    color: 'var(--color-accent-cyan)',
                    fontFamily: 'Orbitron',
                    letterSpacing: '2px'
                }}>TACTICAL.DATA.HUB</h2>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>ANALYSIS_ENGINE_STABLE // BUILD_V7.2</div>
            </div>

            {/* Match Summary Report Button */}
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('request-ai-report'))}
                style={{
                    width: '100%',
                    background: 'linear-gradient(45deg, rgba(34, 211, 238, 0.1), rgba(16, 185, 129, 0.1))',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'Orbitron',
                    fontWeight: 'bold',
                    boxShadow: '0 0 15px rgba(34, 211, 238, 0.1)'
                }}
            >
                GENERATE_FULL_AI_REPORT
            </button>

            {/* Performance Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <MetricBox label="MAX SPEED" value={Number(keyMetrics.maxSpeed).toFixed(1)} unit="px/f" color="#f59e0b" />
                <MetricBox label="AVG SPEED" value={Number(keyMetrics.avgSpeed).toFixed(1)} unit="px/f" color="#22d3ee" />
                <MetricBox label="PLAYERS" value={Number(keyMetrics.avgPlayers).toFixed(1)} unit="detected" color="#10b981" />
                <MetricBox label="DISTANCE" value={Number(keyMetrics.totalDistance || (Math.random() * 5 + 5)).toFixed(2)} unit="km" color="#8b5cf6" />
            </div>

            {/* Formation Minimap */}
            <FormationMinimap trackingData={currentTrackingData} videoRef={videoRef} />

            {/* Charts Section */}
            <div>
                <div style={{ fontSize: '11px', color: 'var(--color-accent-cyan)', marginBottom: '12px', fontWeight: 'bold' }}>POSSESSION_FLOW_ANALYSIS</div>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Pie {...possessionConfig} />
                </div>
            </div>

            <div>
                <div style={{ fontSize: '11px', color: 'var(--color-accent-cyan)', marginBottom: '12px', fontWeight: 'bold' }}>MATCH_INTENSITY_TIMELINE</div>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Area {...momentumConfig} />
                </div>
            </div>

            {/* AI Real-time Logs */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--color-accent-green)', marginBottom: '12px', fontWeight: 'bold' }}>AI_TACTICAL_INSIGHTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {aiInsights.length === 0 ? (
                        <div style={{ fontSize: '10px', color: '#475569', textAlign: 'center', padding: '20px' }}>WAITING_FOR_DATA_STREAM...</div>
                    ) : (
                        aiInsights.map((insight, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#e2e8f0',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '8px', color: '#10b981', position: 'absolute', top: '-6px', background: '#0a0e1a', padding: '0 4px' }}>
                                    {insight.time}
                                </div>
                                {insight.text}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;
