# Translation Guide for CarWash Pro

This guide explains how to add translations to new or existing components in the CarWash Pro application.

## Overview

The application uses **i18next** and **react-i18next** for internationalization, supporting:
- **English (en)** - Default language
- **Arabic (ar)** - Right-to-Left (RTL) support

## File Structure

```
apps/web/
├── src/
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json    # English translations
│   │   └── ar/
│   │       └── translation.json    # Arabic translations
│   ├── i18n.js                     # i18n configuration
│   ├── rtl.css                     # RTL-specific styles
│   └── components/
│       └── LanguageSwitcher.jsx    # Language switcher component
```

## How to Translate a Component

### Step 1: Import the Translation Hook

Add the `useTranslation` hook to your component:

```jsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  // ...
};
```

### Step 2: Add Translation Keys

Add your translation keys to both language files:

**apps/web/src/locales/en/translation.json:**
```json
{
  "myComponent": {
    "title": "My Component Title",
    "description": "This is a description",
    "button": "Click Me"
  }
}
```

**apps/web/src/locales/ar/translation.json:**
```json
{
  "myComponent": {
    "title": "عنوان المكون الخاص بي",
    "description": "هذا وصف",
    "button": "اضغط هنا"
  }
}
```

### Step 3: Use Translations in JSX

Replace hardcoded text with translation function calls:

**Before:**
```jsx
<h1>My Component Title</h1>
<p>This is a description</p>
<button>Click Me</button>
```

**After:**
```jsx
<h1>{t('myComponent.title')}</h1>
<p>{t('myComponent.description')}</p>
<button>{t('myComponent.button')}</button>
```

## Advanced Usage

### Interpolation (Dynamic Values)

**Translation file:**
```json
{
  "welcome": "Welcome back, {{name}}!"
}
```

**Usage:**
```jsx
<h1>{t('welcome', { name: user.firstName })}</h1>
```

### Pluralization

**Translation file:**
```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

**Usage:**
```jsx
<p>{t('items', { count: 5 })}</p>
```

### Dynamic Keys (for status, roles, etc.)

**Translation file:**
```json
{
  "status": {
    "pending": "Pending",
    "confirmed": "Confirmed",
    "completed": "Completed"
  }
}
```

**Usage:**
```jsx
<span>{t(`status.${booking.status}`)}</span>
```

## Toast Notifications

Translate toast messages:

**Before:**
```jsx
toast.error('Please fill in all fields');
toast.success('Login successful!');
```

**After:**
```jsx
toast.error(t('auth.fillAllFields'));
toast.success(t('auth.loginSuccess'));
```

## Forms and Placeholders

**Before:**
```jsx
<label>Email</label>
<input type="email" placeholder="your@email.com" />
```

**After:**
```jsx
<label>{t('auth.email')}</label>
<input
  type="email"
  placeholder={t('auth.emailPlaceholder')}
/>
```

## RTL (Right-to-Left) Support

RTL is automatically applied when Arabic is selected. The `rtl.css` file handles layout adjustments.

### Adding RTL-specific styles

If you create a new component that needs RTL adjustments, add styles to `rtl.css`:

```css
[dir="rtl"] .my-component {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .my-flex-container {
  flex-direction: row-reverse;
}
```

## Common Translation Patterns

### 1. Page Titles
```json
{
  "pageName": {
    "title": "Page Title"
  }
}
```

### 2. Form Fields
```json
{
  "form": {
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email",
    "submit": "Submit"
  }
}
```

### 3. Action Buttons
```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

### 4. Status Messages
```json
{
  "messages": {
    "success": "Operation successful",
    "error": "An error occurred",
    "loading": "Loading..."
  }
}
```

## Language Switcher

The `LanguageSwitcher` component is already available and can be added to any page:

```jsx
import LanguageSwitcher from '../components/LanguageSwitcher';

<LanguageSwitcher />
```

## Existing Translation Categories

The translation files are organized into these categories:

1. **app** - Application name and branding
2. **common** - Common words (loading, error, save, delete, etc.)
3. **nav** - Navigation menu items
4. **auth** - Authentication pages (login, register)
5. **home** - Customer home dashboard
6. **services** - Services page
7. **bookings** - Bookings management
8. **vehicles** - Vehicle management
9. **profile** - User profile
10. **newBooking** - New booking creation
11. **admin** - Admin pages (dashboard, users, bookings, services, analytics)
12. **staff** - Staff dashboard
13. **settings** - Settings page

## Quick Reference: Translation Example

Here's a complete example of translating a new component:

**Component: NewFeature.jsx**
```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const NewFeature = () => {
  const { t } = useTranslation();

  return (
    <div className="new-feature">
      <h1>{t('newFeature.title')}</h1>
      <p>{t('newFeature.description')}</p>
      <button>{t('newFeature.getStarted')}</button>
    </div>
  );
};

export default NewFeature;
```

**en/translation.json**
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is an amazing new feature",
    "getStarted": "Get Started"
  }
}
```

**ar/translation.json**
```json
{
  "newFeature": {
    "title": "ميزة جديدة",
    "description": "هذه ميزة جديدة رائعة",
    "getStarted": "ابدأ الآن"
  }
}
```

## Testing Translations

1. Run the development server: `npm run dev`
2. Click the language switcher (EN/ع buttons) in the navbar
3. Verify that:
   - All text changes to the selected language
   - Arabic text displays correctly with proper fonts
   - RTL layout is applied correctly for Arabic
   - Forms, buttons, and navigation work properly

## Tips for Good Translations

1. **Keep keys organized** - Group related translations together
2. **Use descriptive key names** - Make keys self-documenting
3. **Maintain consistency** - Use the same terms across the app
4. **Consider context** - Arabic translations may need different wording based on context
5. **Test thoroughly** - Always test both languages after adding translations

## Additional Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Google Translate](https://translate.google.com/) - For quick translations (review with native speakers)

## Need Help?

If you encounter issues with translations:
1. Check the browser console for i18n errors
2. Verify translation keys exist in both language files
3. Ensure the component imports `useTranslation`
4. Check that `t()` function is called correctly
5. Verify JSON syntax in translation files (no trailing commas, proper quotes)
