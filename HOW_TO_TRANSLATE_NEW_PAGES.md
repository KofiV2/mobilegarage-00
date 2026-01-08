# Quick Guide: How to Translate Any New Page

Follow these simple steps to add translation to any page or component in your app.

## Step-by-Step Process

### Step 1: Import the Translation Hook

At the top of your component file, import `useTranslation`:

```jsx
import { useTranslation } from 'react-i18next';
```

### Step 2: Use the Hook in Your Component

Inside your component function, add:

```jsx
const YourComponent = () => {
  const { t } = useTranslation();

  // ... rest of your component
};
```

### Step 3: Find All Hardcoded Text

Look for any text in your JSX that is hardcoded in English, such as:
- `<h1>Title</h1>`
- `<button>Click Me</button>`
- `<p>Description text</p>`
- `toast.error('Error message')`
- `placeholder="Enter value"`

### Step 4: Replace with Translation Keys

Replace the hardcoded text with `t('key')`:

**Before:**
```jsx
<h1>My Services</h1>
<button>Book Now</button>
<p>Please select a service</p>
```

**After:**
```jsx
<h1>{t('services.title')}</h1>
<button>{t('services.bookNow')}</button>
<p>{t('services.selectService')}</p>
```

### Step 5: Add Translations to Both JSON Files

Open both translation files and add your keys:

**File: `apps/web/src/locales/en/translation.json`**
```json
{
  "services": {
    "title": "My Services",
    "bookNow": "Book Now",
    "selectService": "Please select a service"
  }
}
```

**File: `apps/web/src/locales/ar/translation.json`**
```json
{
  "services": {
    "title": "خدماتي",
    "bookNow": "احجز الآن",
    "selectService": "الرجاء اختيار خدمة"
  }
}
```

### Step 6: Test

1. Start your development server
2. Switch between languages using the language switcher
3. Verify all text changes correctly

## Common Patterns

### Pattern 1: Simple Text
```jsx
// Before
<h1>Welcome</h1>

// After
<h1>{t('page.welcome')}</h1>
```

### Pattern 2: Text with Dynamic Values
```jsx
// Before
<h1>Welcome back, {userName}!</h1>

// After
<h1>{t('page.welcomeBack', { name: userName })}</h1>

// In translation.json:
// "welcomeBack": "Welcome back, {{name}}!"
// "welcomeBack": "مرحباً بعودتك، {{name}}!"
```

### Pattern 3: Button Text (Loading States)
```jsx
// Before
<button>{loading ? 'Saving...' : 'Save'}</button>

// After
<button>{loading ? t('common.saving') : t('common.save')}</button>
```

### Pattern 4: Form Labels and Placeholders
```jsx
// Before
<label>Email Address</label>
<input placeholder="Enter your email" />

// After
<label>{t('form.email')}</label>
<input placeholder={t('form.emailPlaceholder')} />
```

### Pattern 5: Toast Messages
```jsx
// Before
toast.success('Profile updated successfully');
toast.error('Failed to update profile');

// After
toast.success(t('profile.updateSuccess'));
toast.error(t('profile.updateFailed'));
```

### Pattern 6: Dynamic Status/Role Text
```jsx
// Before
<span>{booking.status}</span>

// After
<span>{t(`bookings.status.${booking.status}`)}</span>

// In translation.json:
{
  "bookings": {
    "status": {
      "pending": "Pending",
      "confirmed": "Confirmed",
      "completed": "Completed"
    }
  }
}
```

## Translation Key Naming Convention

Use this structure for organizing your keys:

```
{pageName}.{element}.{detail}
```

**Examples:**
- `services.title` - Main page title
- `services.bookNow` - Button text
- `bookings.status.pending` - Status labels
- `admin.users.deleteConfirm` - Confirmation messages
- `form.email` - Form field label
- `form.emailPlaceholder` - Form field placeholder

## Quick Checklist

When translating a page, make sure you translate:

- [ ] Page title/heading
- [ ] All button text
- [ ] Form labels
- [ ] Input placeholders
- [ ] Error messages
- [ ] Success messages
- [ ] Toast notifications
- [ ] Table headers
- [ ] Empty state messages
- [ ] Confirmation dialogs
- [ ] Status labels
- [ ] Help text / descriptions

## Example: Complete Page Translation

Here's a complete example of translating a simple page:

**Before (Untranslated):**
```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const [name, setName] = useState('');

  const handleSave = () => {
    toast.success('Profile updated successfully!');
  };

  return (
    <div>
      <h1>My Profile</h1>
      <p>Update your personal information</p>

      <form>
        <label>Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <button onClick={handleSave}>Save Changes</button>
      </form>
    </div>
  );
};
```

**After (Translated):**
```jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSave = () => {
    toast.success(t('profile.updateSuccess'));
  };

  return (
    <div>
      <h1>{t('profile.title')}</h1>
      <p>{t('profile.description')}</p>

      <form>
        <label>{t('profile.fullName')}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('profile.namePlaceholder')}
        />
        <button onClick={handleSave}>{t('profile.saveChanges')}</button>
      </form>
    </div>
  );
};
```

**Translation files:**

`en/translation.json`:
```json
{
  "profile": {
    "title": "My Profile",
    "description": "Update your personal information",
    "fullName": "Full Name",
    "namePlaceholder": "Enter your name",
    "saveChanges": "Save Changes",
    "updateSuccess": "Profile updated successfully!"
  }
}
```

`ar/translation.json`:
```json
{
  "profile": {
    "title": "ملفي الشخصي",
    "description": "تحديث معلوماتك الشخصية",
    "fullName": "الاسم الكامل",
    "namePlaceholder": "أدخل اسمك",
    "saveChanges": "حفظ التغييرات",
    "updateSuccess": "تم تحديث الملف الشخصي بنجاح!"
  }
}
```

## Getting Arabic Translations

### Option 1: Google Translate (Quick)
1. Go to https://translate.google.com/
2. English → Arabic
3. Review the translation for accuracy

### Option 2: Professional Translation (Recommended)
- Hire a native Arabic speaker for accurate, natural translations
- Especially important for customer-facing text

### Option 3: Use Existing Patterns
- Look at the existing translations in `ar/translation.json`
- Copy similar patterns for consistency

## Common Mistakes to Avoid

❌ **Don't do this:**
```jsx
// Mixing translated and untranslated text
<p>{t('services.title')} - Best Service</p>

// Hardcoded text in translation call
<p>{t('Click here')}</p>

// Missing translation key
<p>{t('nonexistent.key')}</p>
```

✅ **Do this:**
```jsx
// Keep all text in translations
<p>{t('services.titleWithSubtext')}</p>

// Use proper key naming
<p>{t('services.clickHere')}</p>

// Ensure keys exist in both files
<p>{t('services.validKey')}</p>
```

## Need Help?

1. Check `TRANSLATION_GUIDE.md` for detailed documentation
2. Look at existing translated components as examples:
   - `apps/web/src/pages/Login.jsx`
   - `apps/web/src/pages/Home.jsx`
   - `apps/web/src/components/Navbar.jsx`
3. Check browser console for translation errors

---

That's it! With these steps, you can translate any page or component in your application. The system is designed to be simple and intuitive to use.
