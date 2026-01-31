import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/animations.css';

/**
 * PageTransition Component
 *
 * Wraps page content with enter/exit animations
 *
 * Usage:
 * <PageTransition animation="fade">
 *   <YourPage />
 * </PageTransition>
 */

const PageTransition = ({
  children,
  animation = 'fade',
  duration = 300,
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animationClass = getAnimationClass(animation);

  return (
    <div
      className={`page-transition ${animationClass} ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf([
    'fade',
    'slide-up',
    'slide-down',
    'slide-left',
    'slide-right',
    'scale',
    'zoom',
    'rotate'
  ]),
  duration: PropTypes.number,
  delay: PropTypes.number,
  className: PropTypes.string
};

function getAnimationClass(animation) {
  const animations = {
    'fade': 'animate-fade-in',
    'slide-up': 'animate-slide-in-up',
    'slide-down': 'animate-slide-in-down',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    'scale': 'animate-scale-in',
    'zoom': 'animate-zoom-in',
    'rotate': 'animate-rotate-in'
  };

  return animations[animation] || animations.fade;
}

export default PageTransition;
