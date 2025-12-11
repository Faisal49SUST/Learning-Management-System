import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({ src, title, uploadedAt }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        const seekTime = (e.target.value / 100) * duration;
        audio.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = e.target.value / 100;
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
    };

    const skipTime = (seconds) => {
        const audio = audioRef.current;
        audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
    };

    const handleDownload = () => {
        try {
            let downloadUrl = src;

            // For Cloudinary URLs: Use fl_attachment to force direct download
            if (src.includes('cloudinary.com') && src.includes('/upload/')) {
                downloadUrl = src.replace('/upload/', '/upload/fl_attachment/');
            }

            // Open directly - this starts the download immediately like video downloads
            window.location.href = downloadUrl;
            setShowMenu(false);
        } catch (error) {
            console.error('Download error:', error);
            window.open(src, '_blank');
            setShowMenu(false);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="custom-audio-player">
            <audio ref={audioRef} src={src} preload="metadata" />

            <div className="audio-player-container">
                {/* Waveform/Progress Background */}
                <div className="audio-visual-bg">
                    <div className="audio-wave"></div>
                    <div className="audio-wave"></div>
                    <div className="audio-wave"></div>
                    <div className="audio-wave"></div>
                    <div className="audio-wave"></div>
                </div>

                {/* Controls Section */}
                <div className="audio-controls">
                    {/* Skip Backward */}
                    <button
                        className="control-btn skip-btn"
                        onClick={() => skipTime(-10)}
                        title="Rewind 10s"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M11 18V6L5 12L11 18Z" fill="currentColor" />
                            <path d="M13 6V18L19 12L13 6Z" fill="currentColor" />
                        </svg>
                        <span className="skip-label">10</span>
                    </button>

                    {/* Play/Pause Button */}
                    <button
                        className="control-btn play-btn"
                        onClick={togglePlay}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                            </svg>
                        ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                            </svg>
                        )}
                    </button>

                    {/* Skip Forward */}
                    <button
                        className="control-btn skip-btn"
                        onClick={() => skipTime(10)}
                        title="Forward 10s"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M13 6V18L19 12L13 6Z" fill="currentColor" />
                            <path d="M5 12L11 6V18L5 12Z" fill="currentColor" />
                        </svg>
                        <span className="skip-label">10</span>
                    </button>

                    {/* Volume Control */}
                    <div
                        className="volume-control"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                        <button
                            className="control-btn volume-btn"
                            title="Volume"
                            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                        >
                            {volume === 0 ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M16 9L22 15M22 9L16 15M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            ) : volume < 0.5 ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            )}
                        </button>
                        {showVolumeSlider && (
                            <div className="volume-slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume * 100}
                                    onChange={handleVolumeChange}
                                    className="volume-slider"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-section">
                    <span className="time-label">{formatTime(currentTime)}</span>
                    <div className="progress-bar-container">
                        <div className="progress-bar-bg">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="progress-slider"
                        />
                    </div>
                    <span className="time-label">{formatTime(duration)}</span>
                </div>

                {/* Three-Dot Menu - Top Right */}
                <div className="menu-control">
                    <button
                        className="control-btn menu-btn"
                        title="More options"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="5" r="2" fill="currentColor" />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                            <circle cx="12" cy="19" r="2" fill="currentColor" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className="menu-dropdown">
                            <button className="menu-item" onClick={handleDownload}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Download Audio</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
