import React from 'react';
import '../../styles/theme.css';
import VideoUploader from '../video/VideoUploader';

const MainLayout = ({ children }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'var(--sidebar-width) 1fr',
      gridTemplateRows: 'var(--header-height) 1fr',
      height: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at top, #1a2332 0%, #0a0e1a 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <header className="glass-panel" style={{
        gridColumn: '1 / -1',
        margin: '10px 20px 0 20px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--color-accent-cyan)', borderRadius: '50%', boxShadow: '0 0 15px var(--color-accent-cyan)' }}></div>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '2px' }} className="tech-glow-text">FVISION <span style={{ color: 'var(--color-accent-cyan)', fontSize: '14px' }}>AI</span></h1>
        </div>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          {[
            { key: 'DASHBOARD', label: '总览' },
            { key: 'TACTICS', label: '战术' },
            { key: 'REPORTS', label: '报告' },
            { key: 'SETTINGS', label: '设置' }
          ].map(item => (
            <div key={item.key} style={{
              color: item.key === 'DASHBOARD' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}>{item.label}</div>
          ))}
        </nav>
      </header>

      {/* Sidebar */}
      <aside className="glass-panel" style={{
        gridRow: '2 / -1',
        margin: '20px 0 20px 20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Upload Button */}
        <VideoUploader onUploadSuccess={(data) => {
          console.log('Video uploaded:', data);
          window.dispatchEvent(new CustomEvent('video-uploaded', { detail: data }));
        }} />

        <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>球员分析</div>
        {/* Placeholder for list */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid transparent',
            cursor: 'pointer'
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent-cyan)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ width: '30px', height: '30px', background: '#334155', borderRadius: '50%' }}></div>
            <div style={{ fontSize: '14px' }}>球员 {i}</div>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{
        gridRow: '2 / -1',
        gridColumn: '2 / -1',
        padding: '20px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
