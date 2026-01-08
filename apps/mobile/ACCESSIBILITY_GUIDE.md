# Mobile App Accessibility Guide

## Overview
This guide provides best practices for making the CarWash mobile app accessible to all users, including those using assistive technologies.

## Quick Reference

### 1. Accessibility Labels & Hints

**Always add these to interactive elements:**

```javascript
import { getButtonAccessibility, getInputAccessibility } from '../utils/accessibility';

// Buttons
<TouchableOpacity
  {...getButtonAccessibility('Login', 'Double tap to log in to your account')}
  onPress={handleLogin}
>
  <Text>Login</Text>
</TouchableOpacity>

// Text Inputs
<TextInput
  {...getInputAccessibility('Email address', 'Enter your email', true)}
  value={email}
  onChangeText={setEmail}
/>

// Headers
<Text
  accessibilityRole="header"
  accessibilityLabel="Welcome to CarWash"
>
  Welcome
</Text>
```

### 2. Minimum Font Sizes

**Use accessible font sizes from theme:**

```javascript
import { SIZES } from '../constants/theme';

// Good ✅
fontSize: SIZES.body,  // 16px
fontSize: SIZES.caption,  // 14px

// Avoid ❌
fontSize: 10,  // Too small
fontSize: 12,  // Use sparingly
```

### 3. Color Contrast

**Use accessible colors from theme:**

```javascript
import { COLORS } from '../constants/theme';

// Good ✅
placeholderTextColor={COLORS.placeholderText}  // #666 (4.59:1 contrast)
color={COLORS.textSecondary}  // #4B5563 (8.59:1 contrast)

// Avoid ❌
placeholderTextColor="#999"  // Poor contrast
color="#9CA3AF"  // Fails WCAG AA
```

### 4. Touch Target Sizes

**Ensure minimum 48x48 touch targets:**

```javascript
import { ensureMinTouchTarget } from '../utils/accessibility';

// Good ✅
<TouchableOpacity style={ensureMinTouchTarget(styles.button)}>

// Manual approach
<TouchableOpacity
  style={{
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
```

### 5. Accessibility Roles

**Common roles to use:**

- `button` - Pressable elements
- `header` - Section headers
- `link` - Navigation links
- `image` - Images
- `search` - Search inputs
- `text` - Static text
- `none` - Decorative elements

### 6. Status & Live Regions

**For dynamic content updates:**

```javascript
// Loading states
<View accessibilityLiveRegion="polite">
  <Text>Loading...</Text>
</View>

// Error messages
<View accessibilityLiveRegion="assertive">
  <Text>Error: {errorMessage}</Text>
</View>
```

### 7. Grouping Elements

**Group related content:**

```javascript
// Form grouping
<View accessible={false}>  // Parent not focusable
  <TextInput accessible={true} {...inputProps} />
  <TextInput accessible={true} {...inputProps} />
  <TouchableOpacity accessible={true} {...buttonProps} />
</View>
```

### 8. List Accessibility

**For scrollable lists:**

```javascript
import { getListAccessibility, getListItemAccessibility } from '../utils/accessibility';

<FlatList
  {...getListAccessibility()}
  data={items}
  renderItem={({ item, index }) => (
    <View {...getListItemAccessibility(index, items.length)}>
      <Text>{item.title}</Text>
    </View>
  )}
/>
```

## Common Patterns

### Login Form
```javascript
<TextInput
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email to log in"
  accessible={true}
  placeholder="Email"
  placeholderTextColor={COLORS.placeholderText}
/>

<TextInput
  accessibilityLabel="Password"
  accessibilityHint="Enter your password"
  accessible={true}
  secureTextEntry
  placeholder="Password"
  placeholderTextColor={COLORS.placeholderText}
/>

<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Login"
  accessibilityHint="Double tap to log in to your account"
  accessibilityState={{ disabled: loading }}
>
  <Text>Login</Text>
</TouchableOpacity>
```

### Card with Action Button
```javascript
<View accessible={false}>
  <Text accessibilityRole="header">
    Service Title
  </Text>
  <Text>Description text</Text>
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel="Book Service"
    accessibilityHint="Double tap to book this service"
  >
    <Text>Book Now</Text>
  </TouchableOpacity>
</View>
```

### Status Badges
```javascript
// Avoid color-only indicators
// Bad ❌
<View style={{ backgroundColor: getStatusColor(status) }}>
  <Text>{status}</Text>
</View>

// Good ✅
<View
  style={{ backgroundColor: getStatusColor(status) }}
  accessibilityLabel={`Status: ${status}`}
>
  <Text>{status}</Text>
  <Icon name={getStatusIcon(status)} />  // Visual + icon
</View>
```

## Testing Checklist

### Manual Testing
- [ ] Enable VoiceOver (iOS) or TalkBack (Android)
- [ ] Navigate through entire app using gestures
- [ ] Verify all elements are announced correctly
- [ ] Check touch targets are easily tappable
- [ ] Test with large text enabled in system settings
- [ ] Test in dark mode (if supported)
- [ ] Test with reduced motion enabled

### Code Review
- [ ] All interactive elements have `accessibilityRole`
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Complex actions have `accessibilityHint`
- [ ] Font sizes are at least 14px (preferably 16px)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Touch targets are at least 48x48
- [ ] Forms have proper labels and error handling
- [ ] Status updates use `accessibilityLiveRegion`
- [ ] Images have descriptive labels or are marked decorative

## WCAG 2.1 Compliance

### Level A (Must Have)
- [x] Text alternatives for non-text content
- [x] Keyboard accessible
- [x] Sufficient time for interactions
- [x] Seizure prevention (no flashing content)
- [x] Navigable with clear focus

### Level AA (Should Have)
- [x] Color contrast minimum (4.5:1 for text)
- [x] Resize text up to 200%
- [x] Touch target size minimum (24x24)
- [x] Orientation support
- [x] Input purpose identification

### Level AAA (Nice to Have)
- [ ] Enhanced color contrast (7:1 for text)
- [ ] Touch target size 48x48
- [ ] No time limits
- [ ] Help available
- [ ] Error prevention

## Resources

- [React Native Accessibility API](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)

## Support

For questions or issues related to accessibility, please:
1. Check this guide
2. Review `/utils/accessibility.js` for helper functions
3. Test with actual screen readers
4. Consult WCAG guidelines

---

**Last Updated:** 2024
**Maintained By:** Development Team
