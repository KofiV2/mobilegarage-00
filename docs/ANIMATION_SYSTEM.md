# Animation System Documentation

Complete guide to using animations in the 3ON Mobile Carwash application.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Animation Types](#animation-types)
- [Usage Examples](#usage-examples)
- [CSS Custom Properties](#css-custom-properties)
- [Components](#components)
- [Best Practices](#best-practices)
- [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)

---

## Overview

The animation system provides a comprehensive set of animations for:
- Page transitions
- Component enter/exit animations
- Hover and interaction effects
- Loading states
- Micro-interactions

All animations are:
- ✅ **Performance-optimized** using CSS transforms and opacity
- ✅ **Accessible** with reduced-motion support
- ✅ **Customizable** via CSS custom properties
- ✅ **Reusable** through utility classes
- ✅ **Consistent** across the application

---

## Installation

The animation system is already imported in `App.jsx`:

```jsx
import './styles/animations.css';
```

No additional setup required!

---

## Animation Types

### 1. Page Transitions

Animations for page entry:

| Animation | Class Name | Duration | Use Case |
|-----------|-----------|----------|----------|
| Fade In | `animate-fade-in` | 300ms | Subtle transitions |
| Slide Up | `animate-slide-in-up` | 300ms | Bottom to top |
| Slide Down | `animate-slide-in-down` | 300ms | Top to bottom |
| Slide Left | `animate-slide-in-left` | 300ms | Right to left |
| Slide Right | `animate-slide-in-right` | 300ms | Left to right |
| Scale In | `animate-scale-in` | 300ms | Zoom effect |
| Zoom In | `animate-zoom-in` | 200ms | Quick popup |
| Rotate In | `animate-rotate-in` | 500ms | Attention-grabbing |

### 2. Action Animations

Continuous or triggered animations:

| Animation | Class Name | Use Case |
|-----------|-----------|----------|
| Bounce | `animate-bounce` | Call-to-action buttons |
| Shake | `animate-shake` | Error feedback |
| Pulse | `animate-pulse` | Loading indicators |
| Spin | `animate-spin` | Loading spinners |
| Wiggle | `animate-wiggle` | Notification icons |

### 3. Hover Effects

Interactive feedback on hover:

| Effect | Class Name | Result |
|--------|-----------|--------|
| Lift | `hover-lift` | Elevates element with shadow |
| Scale | `hover-scale` | Grows element by 5% |
| Glow | `hover-glow` | Adds glowing shadow |
| Brightness | `hover-bright` | Increases brightness |
| Underline | `hover-underline` | Animated underline |
| Slide Underline | `hover-slide-underline` | Sliding underline |

### 4. Button Effects

Click and interaction feedback:

| Effect | Class Name | Result |
|--------|-----------|--------|
| Press | `btn-press` | Scale down on click |
| Ripple | `btn-ripple` | Material Design ripple |

### 5. Loading Animations

Indicate loading states:

| Animation | Class Name | Use Case |
|-----------|-----------|----------|
| Shimmer | `shimmer` | Skeleton loaders |
| Progress Bar | `progress-bar` | Progress indicators |

---

## Usage Examples

### PageTransition Component

Wrap pages with smooth transitions:

```jsx
import PageTransition from './components/PageTransition';

<PageTransition animation="fade">
  <YourPage />
</PageTransition>

// Available animations:
// 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
// 'scale', 'zoom', 'rotate'
```

**Props:**
- `animation` (string): Animation type (default: 'fade')
- `duration` (number): Duration in ms (default: 300)
- `delay` (number): Delay before animation starts (default: 0)
- `className` (string): Additional CSS classes

### Direct CSS Classes

Apply animations directly to elements:

```jsx
// Fade in on mount
<div className="animate-fade-in">
  Content appears smoothly
</div>

// Slide up with bounce
<div className="animate-slide-in-up">
  Content slides from bottom
</div>

// Continuous pulse
<div className="animate-pulse">
  Pulsing indicator
</div>
```

### Combining Animations

Stack multiple effects:

```jsx
// Hover lift + button press
<button className="hover-lift btn-press">
  Interactive Button
</button>

// Fade in + scale on hover
<div className="animate-fade-in hover-scale">
  Animated Card
</div>
```

### Staggered Animations

Create sequential animations for lists:

```jsx
<div className="stagger-children">
  <div className="animate-fade-in">Item 1</div>
  <div className="animate-fade-in">Item 2</div>
  <div className="animate-fade-in">Item 3</div>
</div>

// Each item animates with 100ms delay
// Delays: 0ms, 100ms, 200ms, 300ms, ...
// Supports up to 10 children
```

### Custom Duration and Delay

Using inline styles:

```jsx
<div
  className="animate-slide-in-up"
  style={{
    animationDuration: '500ms',
    animationDelay: '200ms'
  }}
>
  Slower animation with delay
</div>
```

### Loading States

```jsx
// Shimmer skeleton
<div className="shimmer" style={{
  width: '200px',
  height: '20px',
  borderRadius: '4px'
}}>
</div>

// Progress bar
<div className="progress-bar" style={{
  width: '100%',
  height: '4px',
  background: 'var(--primary-color)'
}}>
</div>
```

---

## CSS Custom Properties

Customize animations using CSS variables:

### Durations

```css
:root {
  --duration-instant: 100ms;  /* Very fast */
  --duration-fast: 200ms;     /* Fast */
  --duration-normal: 300ms;   /* Default */
  --duration-slow: 500ms;     /* Slow */
  --duration-slower: 700ms;   /* Very slow */
}
```

### Easing Functions

```css
:root {
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Usage in Custom Animations

```css
.my-custom-animation {
  transition: transform var(--duration-normal) var(--ease-out);
}

.my-custom-animation:hover {
  transform: scale(1.05);
}
```

---

## Components

### PageTransition

**File:** `src/components/PageTransition.jsx`

Wrapper component for page-level animations.

```jsx
import PageTransition from './components/PageTransition';

<PageTransition
  animation="slide-up"
  duration={300}
  delay={0}
  className="custom-class"
>
  <YourPageContent />
</PageTransition>
```

**Implementation:**
- Uses React hooks (useState, useEffect)
- Triggers animation on mount
- Supports all 8 animation types
- Fully customizable via props

### AnimationShowcase

**File:** `src/components/AnimationShowcase.jsx`

Interactive demo of all available animations.

```jsx
import AnimationShowcase from './components/AnimationShowcase';

// To view in development:
<Route path="/animations" element={<AnimationShowcase />} />
```

**Features:**
- Live demos of all animations
- Interactive examples
- Code snippets
- CSS property reference
- Usage guidelines

---

## Best Practices

### 1. Performance

✅ **DO:**
- Use `transform` and `opacity` for animations
- Keep animations under 500ms
- Use `will-change` for complex animations

❌ **DON'T:**
- Animate `width`, `height`, `top`, `left`
- Create animations longer than 1 second
- Animate multiple properties simultaneously

### 2. UX Guidelines

✅ **DO:**
- Use subtle animations (fade, slide-up)
- Match animation to user action
- Provide visual feedback immediately

❌ **DON'T:**
- Overuse bounce/rotate animations
- Delay interactions with animations
- Create distracting continuous animations

### 3. Consistency

**Page Transitions:**
- Landing → Auth: `slide-up`
- Dashboard: `slide-up`
- Profile: `slide-left`
- Static pages: `fade`
- Error pages: `scale`

**Interactive Elements:**
- Buttons: `hover-lift` + `btn-press`
- Cards: `hover-scale`
- Links: `hover-underline`

### 4. Animation Hierarchy

```
1. Critical interactions (buttons, links): 100-200ms
2. Page transitions: 300ms
3. Complex animations: 500ms
4. Continuous animations: 1-2s infinite
```

---

## Accessibility

### Reduced Motion Support

The animation system respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Users with motion sensitivity get instant transitions.

### Focus States

All interactive elements maintain focus indicators:

```css
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.3);
}
```

### Testing for Accessibility

1. **Enable reduced motion:**
   - Windows: Settings → Ease of Access → Display
   - Mac: System Preferences → Accessibility → Display
   - Linux: Settings → Universal Access → Reduce Animation

2. **Keyboard navigation:**
   - Ensure all animations don't interfere with Tab navigation
   - Verify focus indicators are visible

3. **Screen reader compatibility:**
   - Animations should not create disorientation
   - Use `aria-live` for loading states

---

## Troubleshooting

### Animation Not Working

**Check:**
1. Is `animations.css` imported?
   ```jsx
   import './styles/animations.css';
   ```

2. Is the class name correct?
   ```jsx
   // ✅ Correct
   <div className="animate-fade-in">

   // ❌ Wrong
   <div className="fade-in">
   ```

3. Is the element visible?
   - Check CSS `display` property
   - Verify element is in viewport

### Animation Plays Only Once

**Solution:** Remove and re-add the class:

```jsx
const [key, setKey] = useState(0);

const replay = () => setKey(prev => prev + 1);

<div key={key} className="animate-bounce">
  <button onClick={replay}>Replay</button>
</div>
```

### Animation Too Fast/Slow

**Solution:** Override duration:

```jsx
<div
  className="animate-slide-in-up"
  style={{ animationDuration: '500ms' }}
>
  Slower animation
</div>
```

### Stagger Not Working

**Check parent container:**

```jsx
// ✅ Correct - parent has stagger-children class
<div className="stagger-children">
  <div className="animate-fade-in">Item 1</div>
  <div className="animate-fade-in">Item 2</div>
</div>

// ❌ Wrong - missing parent class
<div>
  <div className="animate-fade-in">Item 1</div>
  <div className="animate-fade-in">Item 2</div>
</div>
```

### Performance Issues

**Optimize:**

1. Use `transform` instead of positional properties:
   ```css
   /* ✅ Good */
   .animate { transform: translateY(10px); }

   /* ❌ Bad */
   .animate { top: 10px; }
   ```

2. Add `will-change` for complex animations:
   ```css
   .complex-animation {
     will-change: transform, opacity;
   }
   ```

3. Limit simultaneous animations:
   - Maximum 3-5 elements animating at once
   - Use stagger for lists

---

## Examples in Codebase

### Current Implementation

**App.jsx:**
```jsx
// All pages wrapped with PageTransition
<Route path="/" element={
  <PageTransition animation="fade">
    <LandingPage />
  </PageTransition>
} />
```

**LandingPage.css:**
```css
/* Sequential fade-in for hero elements */
.landing-logo {
  animation: fadeIn 0.6s ease-out, scaleIn 0.6s ease-out;
}

.landing-title {
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.landing-subtitle {
  animation: slideInUp 0.6s ease-out 0.3s both;
}
```

**BottomNav.css:**
```css
/* Interactive feedback */
.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active .nav-icon {
  animation: pulse 0.3s ease-out;
}
```

---

## Future Enhancements

### Planned Features

1. **Scroll Animations**
   - Fade in on scroll
   - Parallax effects
   - Scroll-triggered animations

2. **Page Exit Animations**
   - Fade out before navigation
   - Coordinated enter/exit transitions

3. **Advanced Effects**
   - Morphing shapes
   - Path animations
   - SVG animations

4. **Animation Builder**
   - Visual animation editor
   - Export custom animations
   - Animation presets

---

## Resources

### Internal Files
- `src/styles/animations.css` - Animation definitions
- `src/components/PageTransition.jsx` - React wrapper component
- `src/components/AnimationShowcase.jsx` - Interactive demo

### External Resources
- [CSS Animations - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [Animation Performance - Web.dev](https://web.dev/animations/)
- [Reduced Motion - A11y Project](https://www.a11yproject.com/posts/understanding-vestibular-disorders/)
- [Cubic Bezier Generator](https://cubic-bezier.com/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial animation system with 30+ animations |

---

*Happy Animating! ✨*
