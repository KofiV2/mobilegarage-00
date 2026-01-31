import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './AnimationShowcase.css';

/**
 * AnimationShowcase Component
 *
 * Demonstrates all available animations in the application.
 * Useful for development and testing animations.
 *
 * Usage:
 * <AnimationShowcase />
 */

const AnimationShowcase = () => {
  const [activeDemo, setActiveDemo] = useState('page-transitions');

  const pageTransitions = [
    { name: 'Fade In', class: 'animate-fade-in' },
    { name: 'Slide Up', class: 'animate-slide-in-up' },
    { name: 'Slide Down', class: 'animate-slide-in-down' },
    { name: 'Slide Left', class: 'animate-slide-in-left' },
    { name: 'Slide Right', class: 'animate-slide-in-right' },
    { name: 'Scale In', class: 'animate-scale-in' },
    { name: 'Zoom In', class: 'animate-zoom-in' },
    { name: 'Rotate In', class: 'animate-rotate-in' },
  ];

  const actionAnimations = [
    { name: 'Bounce', class: 'animate-bounce' },
    { name: 'Shake', class: 'animate-shake' },
    { name: 'Pulse', class: 'animate-pulse' },
    { name: 'Spin', class: 'animate-spin' },
    { name: 'Wiggle', class: 'animate-wiggle' },
  ];

  const hoverEffects = [
    { name: 'Lift', class: 'hover-lift' },
    { name: 'Scale', class: 'hover-scale' },
    { name: 'Glow', class: 'hover-glow' },
    { name: 'Brightness', class: 'hover-bright' },
    { name: 'Underline', class: 'hover-underline' },
    { name: 'Slide Underline', class: 'hover-slide-underline' },
  ];

  const buttonEffects = [
    { name: 'Press', class: 'btn-press' },
    { name: 'Ripple', class: 'btn-ripple' },
  ];

  const loadingAnimations = [
    { name: 'Shimmer', class: 'shimmer' },
    { name: 'Progress Bar', class: 'progress-bar' },
  ];

  const renderDemoSection = () => {
    switch (activeDemo) {
      case 'page-transitions':
        return (
          <div className="demo-grid">
            {pageTransitions.map((anim, index) => (
              <div key={index} className="demo-card">
                <div className={`demo-box ${anim.class}`}>
                  <span>✨</span>
                </div>
                <p className="demo-label">{anim.name}</p>
                <code className="demo-code">{anim.class}</code>
              </div>
            ))}
          </div>
        );

      case 'action-animations':
        return (
          <div className="demo-grid">
            {actionAnimations.map((anim, index) => (
              <div key={index} className="demo-card">
                <div className={`demo-box ${anim.class}`}>
                  <span>🎯</span>
                </div>
                <p className="demo-label">{anim.name}</p>
                <code className="demo-code">{anim.class}</code>
              </div>
            ))}
          </div>
        );

      case 'hover-effects':
        return (
          <div className="demo-grid">
            {hoverEffects.map((effect, index) => (
              <div key={index} className="demo-card">
                <div className={`demo-box interactive ${effect.class}`}>
                  <span>👆 Hover</span>
                </div>
                <p className="demo-label">{effect.name}</p>
                <code className="demo-code">{effect.class}</code>
              </div>
            ))}
          </div>
        );

      case 'button-effects':
        return (
          <div className="demo-grid">
            {buttonEffects.map((effect, index) => (
              <div key={index} className="demo-card">
                <button className={`demo-button ${effect.class}`}>
                  Click Me
                </button>
                <p className="demo-label">{effect.name}</p>
                <code className="demo-code">{effect.class}</code>
              </div>
            ))}
          </div>
        );

      case 'loading-animations':
        return (
          <div className="demo-grid">
            {loadingAnimations.map((anim, index) => (
              <div key={index} className="demo-card">
                <div className={`demo-box ${anim.class}`}>
                  <div className="loading-content"></div>
                </div>
                <p className="demo-label">{anim.name}</p>
                <code className="demo-code">{anim.class}</code>
              </div>
            ))}
          </div>
        );

      case 'stagger':
        return (
          <div className="demo-section">
            <div className="stagger-children">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="demo-box animate-fade-in">
                  Item {num}
                </div>
              ))}
            </div>
            <p className="demo-description">
              Items animate in sequence with staggered delays
            </p>
            <code className="demo-code">stagger-children</code>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animation-showcase">
      <div className="showcase-header">
        <h1>Animation Showcase</h1>
        <p>Interactive demo of all available animations</p>
      </div>

      <div className="showcase-nav">
        <button
          className={activeDemo === 'page-transitions' ? 'active' : ''}
          onClick={() => setActiveDemo('page-transitions')}
        >
          Page Transitions
        </button>
        <button
          className={activeDemo === 'action-animations' ? 'active' : ''}
          onClick={() => setActiveDemo('action-animations')}
        >
          Action Animations
        </button>
        <button
          className={activeDemo === 'hover-effects' ? 'active' : ''}
          onClick={() => setActiveDemo('hover-effects')}
        >
          Hover Effects
        </button>
        <button
          className={activeDemo === 'button-effects' ? 'active' : ''}
          onClick={() => setActiveDemo('button-effects')}
        >
          Button Effects
        </button>
        <button
          className={activeDemo === 'loading-animations' ? 'active' : ''}
          onClick={() => setActiveDemo('loading-animations')}
        >
          Loading
        </button>
        <button
          className={activeDemo === 'stagger' ? 'active' : ''}
          onClick={() => setActiveDemo('stagger')}
        >
          Stagger
        </button>
      </div>

      <div className="showcase-content">
        {renderDemoSection()}
      </div>

      <div className="showcase-footer">
        <h3>CSS Custom Properties</h3>
        <div className="properties-grid">
          <div className="property-card">
            <h4>Durations</h4>
            <ul>
              <li><code>--duration-instant</code>: 100ms</li>
              <li><code>--duration-fast</code>: 200ms</li>
              <li><code>--duration-normal</code>: 300ms</li>
              <li><code>--duration-slow</code>: 500ms</li>
              <li><code>--duration-slower</code>: 700ms</li>
            </ul>
          </div>
          <div className="property-card">
            <h4>Easing Functions</h4>
            <ul>
              <li><code>--ease-in</code></li>
              <li><code>--ease-out</code></li>
              <li><code>--ease-in-out</code></li>
              <li><code>--ease-bounce</code></li>
              <li><code>--ease-smooth</code></li>
            </ul>
          </div>
        </div>

        <h3>Usage Examples</h3>
        <div className="usage-examples">
          <div className="example">
            <h4>Page Transition Component</h4>
            <pre>
{`<PageTransition animation="fade">
  <YourPage />
</PageTransition>`}
            </pre>
          </div>

          <div className="example">
            <h4>Direct CSS Classes</h4>
            <pre>
{`<div className="animate-slide-in-up">
  Content with animation
</div>`}
            </pre>
          </div>

          <div className="example">
            <h4>Hover Effects</h4>
            <pre>
{`<button className="hover-lift btn-press">
  Interactive Button
</button>`}
            </pre>
          </div>

          <div className="example">
            <h4>Staggered List</h4>
            <pre>
{`<div className="stagger-children">
  <div className="animate-fade-in">Item 1</div>
  <div className="animate-fade-in">Item 2</div>
  <div className="animate-fade-in">Item 3</div>
</div>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

AnimationShowcase.propTypes = {};

export default AnimationShowcase;
