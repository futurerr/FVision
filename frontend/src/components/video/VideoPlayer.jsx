import React, { useRef, useEffect, useState } from 'react';
import HeatmapOverlay from './HeatmapOverlay';
import TrajectoryOverlay from './TrajectoryOverlay';

const VideoPlayer = ({ onVideoLoad, onEventsExtracted, setGlobalTrackingData }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [heatmapData, setHeatmapData] = useState(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showTrajectories, setShowTrajectories] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (trackingData) {
            setGlobalTrackingData?.(trackingData);
        }
    }, [trackingData, setGlobalTrackingData]);

    useEffect(() => {
        const handleVideoUploaded = (e) => {
            const data = e.detail;
            if (data && data.url) {
                const fullUrl = data.url.startsWith('http') ? data.url : `http://localhost:8090${data.url}`;
                setVideoUrl(fullUrl);
            }
        };

        const handleRequestReport = async () => {
            if (!videoUrl) {
                alert("未加载视频，无法分析。");
                return;
            }
            const filename = videoUrl.split('/').pop();
            try {
                alert("正在生成战术报告... 这将触发大模型分析。");
                const res = await fetch(`http://localhost:8090/api/v1/videos/${filename}/summary`, { method: 'POST' });
                if (!res.ok) throw new Error("报告生成失败");

                const data = await res.json();
                window.dispatchEvent(new CustomEvent('ai-analysis', { detail: data.summary }));
                alert("报告已生成！");
            } catch (err) {
                console.error(err);
                alert("报告生成失败。请确保已完成全场分析。");
            }
        };

        window.addEventListener('video-uploaded', handleVideoUploaded);
        window.addEventListener('request-ai-report', handleRequestReport);

        return () => {
            window.removeEventListener('video-uploaded', handleVideoUploaded);
            window.removeEventListener('request-ai-report', handleRequestReport);
        };
    }, [videoUrl]);

    // 绘制追踪轨迹逻辑
    useEffect(() => {
        if (!trackingData || !canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!video || video.paused || video.ended) {
                requestAnimationFrame(draw);
                return;
            }

            // 同步画布尺寸
            if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
                canvas.width = video.clientWidth;
                canvas.height = video.clientHeight;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const currentTime = video.currentTime;
            const fps = trackingData.metadata.fps || 25;
            const frameIndex = Math.floor(currentTime * fps);

            const frameData = trackingData.frames.find(f => f.frame === frameIndex);

            if (frameData && frameData.detections) {
                const scaleX = canvas.width / trackingData.metadata.width;
                const scaleY = canvas.height / trackingData.metadata.height;

                frameData.detections.forEach(det => {
                    const [x1, y1, x2, y2] = det.bbox;
                    const sx1 = x1 * scaleX;
                    const sy1 = y1 * scaleY;
                    const sx2 = x2 * scaleX;
                    const sy2 = y2 * scaleY;

                    // 球队颜色逻辑
                    let color = '#22d3ee'; // 默认青色
                    if (det.team_id === 0) color = '#22d3ee';
                    else if (det.team_id === 1) color = '#10b981'; // 绿色
                    else if (det.team_id === null || det.team_id === undefined) color = '#94a3b8'; // 未分配灰色

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

                    if (det.id !== null) {
                        ctx.fillStyle = color;
                        ctx.font = '10px monospace';
                        const teamTag = (det.team_id !== null && det.team_id !== undefined) ? `[T${det.team_id}]` : '';
                        ctx.fillText(`${teamTag} #${det.id}`, sx1, sy1 - 5);
                    }
                });
            }
            requestAnimationFrame(draw);
        };

        const animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, [trackingData]);

    // 视频加载后通知父组件
    useEffect(() => {
        if (videoRef.current && videoRef.current.duration) {
            onVideoLoad?.(videoRef.current, videoRef.current.duration);
        }
    }, [videoUrl, onVideoLoad]);

    // 单帧分析
    const captureAndAnalyze = async () => {
        if (!videoRef.current || analyzing) return;
        setAnalyzing(true);

        const canvas = document.createElement('canvas');
        // 限制最大尺寸以适应本地 AI 模型（建议 640px 左右）
        const maxW = 640;
        const maxH = 640;
        let w = videoRef.current.videoWidth;
        let h = videoRef.current.videoHeight;

        if (w > maxW) {
            h = (maxW / w) * h;
            w = maxW;
        }
        if (h > maxH) {
            w = (maxH / h) * w;
            h = maxH;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, w, h);

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'frame.jpg');
            formData.append('prompt', "识别并分析这个足球比赛动态，识别关键球员位置和战术机会。");

            try {
                const response = await fetch('http://localhost:8090/api/v1/ai/analyze', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error("AI 服务异常: " + response.status);
                const data = await response.json();
                window.dispatchEvent(new CustomEvent('ai-analysis', { detail: data.analysis }));
            } catch (err) {
                console.error(err);
                alert("AI 分析失败: " + err.message);
            } finally {
                setAnalyzing(false);
            }
        }, 'image/jpeg');
    };

    // 全场分析
    const runFullAnalysis = async () => {
        if (!videoUrl || analyzing) return;
        const filename = videoUrl.split('/').pop();
        setAnalyzing(true);
        alert("分析已开始。请稍候...");

        try {
            const startRes = await fetch(`http://localhost:8090/api/v1/videos/${filename}/analyze`, { method: 'POST' });
            if (!startRes.ok) throw new Error("无法启动分析流程");

            const checkStatus = async () => {
                try {
                    const statusRes = await fetch(`http://localhost:8090/api/v1/videos/${filename}/status`);
                    const statusData = await statusRes.json();

                    if (statusData.status === 'completed') {
                        const resultRes = await fetch(`http://localhost:8090${statusData.result_url}`);
                        const resultData = await resultRes.json();
                        setTrackingData(resultData);

                        // 广播统计指标
                        const frames = resultData.frames || [];
                        const totalDets = frames.reduce((a, f) => a + (f.detections?.length || 0), 0);
                        const avgPlayers = frames.length > 0 ? (totalDets / frames.length).toFixed(1) : "0.0";
                        window.dispatchEvent(new CustomEvent('match-stats-update', {
                            detail: {
                                avgPlayers,
                                trackingData: resultData,
                                leftPct: resultData.left_pct, // Ensure backend fields are mapped if available
                                rightPct: resultData.right_pct,
                                maxSpeed: resultData.max_speed,
                                avgSpeed: resultData.avg_speed
                            }
                        }));

                        // 获取热力图数据
                        const hmRes = await fetch(`http://localhost:8090/api/v1/videos/${filename}/heatmap`);
                        if (hmRes.ok) setHeatmapData(await hmRes.json());

                        // 获取事件数据
                        try {
                            const eventsRes = await fetch(`http://localhost:8090/api/v1/videos/${filename}/events`);
                            if (eventsRes.ok) {
                                const eventsData = await eventsRes.json();
                                onEventsExtracted?.(eventsData.events);
                            }
                        } catch (e) {
                            console.error("无法获取事件：", e);
                        }

                        setAnalyzing(false);
                        alert("全场分析已完成！");
                    } else if (statusData.status === 'failed') {
                        throw new Error("后端处理失败");
                    } else {
                        // 继续轮询
                        setTimeout(checkStatus, 3000);
                    }
                } catch (e) {
                    console.error("状态轮询错误：", e);
                    setAnalyzing(false);
                }
            };
            setTimeout(checkStatus, 3000);
        } catch (err) {
            console.error(err);
            setAnalyzing(false);
            alert("分析启动失败：" + err.message);
        }
    };

    return (
        <div className="glass-panel" style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '12px'
        }}>
            {/* 播放器区域 */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                {videoUrl ? (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        crossOrigin="anonymous"
                        controls
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
                        尚未加载视频
                    </div>
                )}

                {/* 状态叠加层 */}
                {videoUrl && (
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        left: '15px',
                        zIndex: 10,
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            backdropFilter: 'blur(4px)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            播放：{videoUrl ? '已上传分析视频' : '载入中'} <span style={{ color: 'var(--color-accent-cyan)', marginLeft: '8px' }}>Active System</span>
                        </div>
                    </div>
                )}

                {/* 叠加层组件 */}
                {showHeatmap && heatmapData && <HeatmapOverlay heatmapData={heatmapData} videoWidth={videoRef.current?.clientWidth} videoHeight={videoRef.current?.clientHeight} />}
                {showTrajectories && trackingData && <TrajectoryOverlay trackingData={trackingData} videoRef={videoRef} videoWidth={videoRef.current?.clientWidth} videoHeight={videoRef.current?.clientHeight} showTrajectories={showTrajectories} />}

                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />
            </div>

            {/* 底部控制栏 */}
            <div style={{ display: 'flex', gap: '10px', padding: '12px', background: 'rgba(15,23,42,0.6)', alignItems: 'center' }}>
                <button
                    onClick={captureAndAnalyze}
                    disabled={analyzing || !videoUrl}
                    className="glass-panel"
                    style={{ padding: '6px 12px', color: 'var(--color-accent-cyan)', fontSize: '12px', border: '1px solid var(--color-accent-cyan)', background: 'transparent', cursor: 'pointer' }}
                >
                    {analyzing ? '分析中...' : '单帧分析 (QWEN)'}
                </button>
                <button
                    onClick={runFullAnalysis}
                    disabled={analyzing || !videoUrl}
                    className="glass-panel glow-button"
                    style={{ padding: '6px 12px', color: '#fff', background: 'var(--color-accent-cyan)', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                >
                    {analyzing ? '处理中...' : '全场分析 (YOLO)'}
                </button>

                <div style={{ flex: 1 }} />

                <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    disabled={!heatmapData}
                    className="glass-panel"
                    style={{
                        padding: '6px 12px',
                        color: showHeatmap ? '#fff' : 'var(--color-accent-cyan)',
                        background: showHeatmap ? 'var(--color-accent-cyan)' : 'transparent',
                        border: '1px solid var(--color-accent-cyan)',
                        fontSize: '11px',
                        cursor: heatmapData ? 'pointer' : 'not-allowed'
                    }}
                >
                    {showHeatmap ? '隐藏热力图' : '显示热力图'}
                </button>
                <button
                    onClick={() => setShowTrajectories(!showTrajectories)}
                    disabled={!trackingData}
                    className="glass-panel"
                    style={{
                        padding: '6px 12px',
                        color: showTrajectories ? '#fff' : 'var(--color-accent-green)',
                        background: showTrajectories ? 'var(--color-accent-green)' : 'transparent',
                        border: '1px solid var(--color-accent-green)',
                        fontSize: '11px',
                        cursor: trackingData ? 'pointer' : 'not-allowed'
                    }}
                >
                    {showTrajectories ? '隐藏轨迹' : '显示轨迹'}
                </button>
            </div>
        </div>
    );
};

export default VideoPlayer;
