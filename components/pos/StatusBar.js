'use client';

/**
 * StatusBar Component
 * 
 * Mobile-style status bar at the top.
 * Shows time, signal, WiFi, battery.
 * Demo mode - just for UI presentation.
 */
export default function StatusBar() {
  return (
    <div className="status-bar">
      <div className="status-time">
        <p>9:30</p>
      </div>
      <div className="status-icons">
        {/* WiFi Icon */}
        <svg className="status-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
        </svg>
        
        {/* Signal Icon */}
        <svg className="status-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm0 8l2 2c4.97-4.97 13.03-4.97 18 0l2-2c-4.97-4.97-13.03-4.97-18 0zm8-4l2 2 2-2c-1.1-1.1-2.9-1.1-4 0z" />
        </svg>
        
        {/* Battery Icon */}
        <svg className="status-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 4h-1V3h-4v1H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H7V6h10v14z" />
        </svg>
      </div>
    </div>
  );
}
