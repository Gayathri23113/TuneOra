import React from 'react';
import './LandingPage.css';
import Visualizer from '../Visualizer/Visualizer';

// --- IMPORTANT CHANGE HERE ---
// Update the video path to use your new video file name
const CONCERT_VIDEO_PATH = '/videos/background.mp4'; 
// -----------------------------

interface LandingPageProps {
  onGetStartedClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStartedClick 
}) => {
  return (
    <div className="landing-container">
      {/* 1. Background Video Element */}
      <video className="video-background" autoPlay loop muted playsInline>
        {/* The source tag now points to your new video */}
        <source src={CONCERT_VIDEO_PATH} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="overlay"></div>

      {/* 3. Animated Visualizer */}
      <Visualizer />

      {/* 4. Main Content / Hero Area */}
      <div className="content-box">
        <h1 className="logo-title">TuneOra</h1>
        
        <p className="welcome-message">
          Welcome to the ultimate music experience.
          <br />
          Discover, stream, and share your favorite tracks.
        </p>

        {/* Primary Call to Action */}
        <button 
          className="btn primary-btn" 
          onClick={onGetStartedClick}
        >
          Get Started
        </button>

        {/* Secondary Actions / Navigation */}
        {/* <div className="secondary-actions">
          <button 
            className="btn secondary-btn" 
            onClick={onLoginClick}
          >
            Login
          </button>
          <span className="separator">|</span>
          <button 
            className="btn secondary-btn" 
            onClick={onSignUpClick}
          >
            New User Sign Up
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default LandingPage;