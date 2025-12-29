# 🚀 Quick Start Guide - Mobile Garage Website

## ⚡ 5-Minute Deployment

### Step 1: Update Your Information (2 minutes)

Open `index.html` and find/replace:

```
Find: 971501234567
Replace with: YOUR-WHATSAPP-NUMBER (no + or spaces)
Examples: 971501234567, 971556789012

Find: +971501234567
Replace with: +971-50-123-4567 (your formatted number)

Find: info@mobilegarage.ae
Replace with: your-email@domain.com
```

### Step 2: Deploy to Vercel (3 minutes)

**Option A: Drag & Drop (No coding required)**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Create account (use GitHub/Google)
3. Drag your `mobilegarage-00` folder onto Vercel
4. Click "Deploy"
5. ✅ Done! Your site is live

**Option B: GitHub (Best for updates)**
1. Create GitHub account at [github.com](https://github.com)
2. Create new repository called "mobile-garage"
3. Upload all files from `mobilegarage-00` folder
4. Go to [vercel.com/new](https://vercel.com/new)
5. Click "Import" → Select your GitHub repository
6. Click "Deploy"
7. ✅ Done! Updates auto-deploy when you push to GitHub

### Step 3: Get Your Live URL
Your site will be live at:
```
https://YOUR-PROJECT-NAME.vercel.app
```

Share this link immediately! Connect custom domain later.

---

## 🌐 Connect Custom Domain (Optional - 15 minutes)

### For .ae domains (aeda.ae)

1. **In Vercel Dashboard:**
   - Click your project → Settings → Domains
   - Enter: `www.yourdomain.ae`
   - Click "Add"
   - Copy the CNAME value shown

2. **In AEDA Portal:**
   - Login at [aeda.ae](https://www.aeda.ae)
   - Go to: My Domains → Select domain → DNS Management
   - Add new record:
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```
   - Save

3. **Wait 10-60 minutes** for DNS to update
4. ✅ Visit `www.yourdomain.ae` - SSL auto-configured!

### For other domains (GoDaddy, Namecheap, etc.)

Same process but DNS panel location differs:
- **GoDaddy**: My Products → DNS
- **Namecheap**: Domain List → Manage → Advanced DNS
- **Others**: Look for "DNS Settings" or "DNS Management"

---

## 📱 Contact Information Locations

Update these files:

### index.html (Main file)
- Line 47: WhatsApp button in hero
- Line 48: Phone call button
- Line 53: Mobile quick action call
- Line 59: Mobile quick action WhatsApp
- Line 176: Phone number display
- Line 183: Email address
- Line 228: Floating WhatsApp button

### script.js (JavaScript)
- Line 119: WhatsApp number for contact form

---

## ✅ Pre-Launch Checklist

```
Before sharing your website:

[ ] Updated WhatsApp number (test it works)
[ ] Updated phone number (test call works)
[ ] Updated email address
[ ] Replaced logo (or kept placeholder for now)
[ ] Tested on your phone:
    [ ] Language switcher works
    [ ] Hamburger menu opens/closes
    [ ] Bottom action bar shows on mobile
    [ ] WhatsApp button opens WhatsApp
    [ ] Call button triggers phone dialer
    [ ] Contact form redirects to WhatsApp
[ ] Deployed to Vercel
[ ] Got live URL
```

---

## 🎯 What Each File Does

```
index.html  → Your website content (edit this)
styles.css  → Colors, fonts, layout (edit to change design)
script.js   → Language switcher, mobile menu, WhatsApp form
vercel.json → Tells Vercel how to deploy (don't change)
```

---

## 💡 Quick Customization

### Change Colors
Open `styles.css`, find line 8-9:
```css
--primary-color: #00509E;  /* Blue - change to your brand color */
--secondary-color: #DC143C; /* Red - change to accent color */
```

### Change Logo
1. Upload logo image to [imgur.com](https://imgur.com) (free)
2. Copy image URL
3. In `index.html` line 23, replace:
```html
<img src="YOUR-IMGUR-URL-HERE" alt="Mobile Garage Logo">
```

### Add More Services
In `index.html`, find the services section (around line 80) and copy/paste a service card:
```html
<div class="service-card">
    <div class="service-icon">🔧</div>
    <h3 data-en="Your Service" data-ar="خدمتك">Your Service</h3>
    <p data-en="Description in English"
       data-ar="الوصف بالعربية">
        Description in English
    </p>
</div>
```

---

## 🆘 Troubleshooting

**WhatsApp doesn't open:**
- Check number format: `971501234567` (no + or spaces)
- Must start with country code (971 for UAE)

**Mobile menu doesn't work:**
- Open browser console (F12) - check for errors
- Make sure `script.js` is in same folder as `index.html`

**Arabic text looks weird:**
- Font might be blocked - wait a few seconds
- Check internet connection (fonts load from Google)

**Domain not working:**
- Wait up to 48 hours for DNS
- Check [dnschecker.org](https://dnschecker.org)
- Verify DNS records exactly match Vercel instructions

**Site not updating:**
- Clear browser cache (Ctrl+F5)
- Wait 1-2 minutes for Vercel to deploy
- Check deployment status in Vercel dashboard

---

## 📞 Need Help?

1. Check full README.md for detailed guides
2. Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
3. Vercel Support: [vercel.com/support](https://vercel.com/support)

---

## 🎉 You're Ready!

Your website is professional, mobile-optimized, and ready for UAE customers!

**Test URL Format:**
- Development: Open `index.html` locally
- Live: `https://your-project.vercel.app`
- Custom Domain: `https://www.yourdomain.ae`

**Share your site:**
- Add to WhatsApp Business profile
- Share on social media
- Add to Google My Business
- Print on business cards/vehicles
