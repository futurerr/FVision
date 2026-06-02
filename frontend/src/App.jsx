import React, { useRef, useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import VideoPlayer from './components/video/VideoPlayer';
import StatsPanel from './components/dashboard/StatsPanel';
import Timeline from './components/video/Timeline';

function App() {
  const videoRef = useRef(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [currentFilename, setCurrentFilename] = useState(null);
  const [trackingData, setTrackingData] = useState(null);

  // Listen for video upload
  useEffect(() => {
    const handleVideoUploaded = (e) => {
      const data = e.detail;
      if (data && data.filename) {
        setCurrentFilename(data.filename);
      }
    };

    const handleAnalysisComplete = async (e) => {
      if (currentFilename) {
        // Fetch events for timeline
        try {
          const res = await fetch(`http://localhost:8090/api/v1/videos/${currentFilename}/events`);
          if (res.ok) {
            const data = await res.json();
            setTimelineEvents(data.events || []);
          }
        } catch (err) {
          console.error("Failed to fetch events:", err);
        }

        // We also want to sync trackingData to App state if VideoPlayer just finished it
        if (e.detail?.trackingData) {
          setTrackingData(e.detail.trackingData);
        }
      }
    };

    window.addEventListener('video-uploaded', handleVideoUploaded);
    window.addEventListener('match-stats-update', handleAnalysisComplete);

    return () => {
      window.removeEventListener('video-uploaded', handleVideoUploaded);
      window.removeEventListener('match-stats-update', handleAnalysisComplete);
    };
  }, [currentFilename]);

  return (
    <MainLayout>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '20px',
        height: '100%'
      }}>
        {/* Left Column: Video + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <VideoPlayer
            onVideoLoad={(ref, duration) => {
              videoRef.current = ref;
              setVideoDuration(duration);
            }}
            setGlobalTrackingData={setTrackingData}
          />

          {/* Timeline */}
          <Timeline
            videoRef={videoRef}
            duration={videoDuration}
            events={timelineEvents}
          />
        </div>

        {/* Right Column: Stats */}
        <StatsPanel
          videoRef={videoRef}
          currentTrackingData={trackingData}
        />
      </div>
    </MainLayout>
  );
}

export default App;
