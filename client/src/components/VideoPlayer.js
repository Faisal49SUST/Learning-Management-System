import React from 'react';

const VideoPlayer = ({ videoUrl, title }) => {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
            <video
                controls
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                <source src={`http://localhost:5000/${videoUrl}`} type="video/mp4" />
                <source src={`http://localhost:5000/${videoUrl}`} type="video/webm" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoPlayer;
