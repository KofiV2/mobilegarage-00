import React from 'react';
import './LoyaltyProgress.css';

const LoyaltyProgress = ({ count = 0 }) => {
  const normalizedCount = count % 7; // 0-6, resets after free wash

  return (
    <div className="loyalty-progress">
      {[1, 2, 3, 4, 5, 6].map((num) => (
        <div key={num} className="progress-item">
          <div className={`progress-circle ${num <= normalizedCount ? 'filled' : ''}`}>
            {num <= normalizedCount ? '✓' : num}
          </div>
          {num < 6 && <div className={`progress-line ${num < normalizedCount ? 'filled' : ''}`} />}
        </div>
      ))}
      <div className="progress-item">
        <div className={`progress-circle gift ${normalizedCount >= 6 ? 'filled' : ''}`}>
          🎁
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgress;
