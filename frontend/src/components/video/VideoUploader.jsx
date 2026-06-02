import React, { useRef, useState } from 'react';

const VideoUploader = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                setProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    onUploadSuccess(data);
                } catch (err) {
                    console.error("Failed to parse response", err);
                    alert("上传成功但响应解析失败");
                }
            } else {
                console.error("Upload failed", xhr.status, xhr.statusText);
                alert(`上传失败: ${xhr.status} ${xhr.statusText}`);
            }
            setUploading(false);
        });

        xhr.addEventListener('error', () => {
            console.error('Network error during upload');
            alert('网络错误，上传中断');
            setUploading(false);
        });

        xhr.open('POST', 'http://localhost:8090/api/v1/videos/upload');
        xhr.send(formData);

        // Reset file input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ padding: '0 10px' }}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                style={{ display: 'none' }}
            />
            <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                style={{
                    background: uploading ? 'rgba(34, 211, 238, 0.4)' : 'var(--color-accent-cyan)',
                    color: uploading ? '#fff' : 'var(--color-bg-primary)',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    cursor: uploading ? 'wait' : 'pointer',
                    width: '100%',
                    marginTop: '20px',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {uploading ? (
                    <span style={{ position: 'relative', zIndex: 2 }}>正在上传 {progress}%...</span>
                ) : (
                    '上传比赛视频'
                )}

                {/* Progress bar background */}
                {uploading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        background: 'rgba(34, 211, 238, 0.8)',
                        zIndex: 1,
                        transition: 'width 0.2s ease-out'
                    }} />
                )}
            </button>

            {uploading && (
                <div style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: 'var(--color-accent-cyan)',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                }}>
                    正在写入磁盘，请勿关闭页面...
                </div>
            )}
        </div>
    );
};

export default VideoUploader;
