# Mobile Garage UAE Website

A professional, bilingual (English/Arabic) website for mobile garage services in the UAE. Fully responsive and optimized for mobile devices.

## 🌟 Features

- ✅ **Bilingual**: Full English and Arabic support with RTL layout
- ✅ **Mobile-First Design**: Optimized for smartphones and tablets
- ✅ **WhatsApp Integration**: Direct contact via WhatsApp
- ✅ **Quick Action Bar**: Fixed bottom bar on mobile for instant contact
- ✅ **Responsive Design**: Works perfectly on all screen sizes
- ✅ **PWA-Ready**: Can be installed as an app
- ✅ **No Backend Required**: Pure frontend solution

## 📁 Project Structure

```
mobilegarage-00/
├── index.html       # Main HTML file
├── styles.css       # All styling and responsive design
├── script.js        # JavaScript functionality
├── vercel.json      # Vercel deployment configuration
└── README.md        # This file
```

## 🚀 Quick Start (Local Testing)

1. Open `index.html` in your web browser
2. Test the language switcher (English/Arabic)
3. Test the mobile menu (resize browser to mobile width)
4. Try the WhatsApp and call buttons

## 📱 Customization

Before deploying, update your contact information:

### 1. WhatsApp Number
Update in **3 places**:

- `index.html` line 47: Hero section WhatsApp button
- `index.html` line 59: Mobile quick actions bar
- `index.html` line 228: Floating WhatsApp button
- `script.js` line 119: Contact form WhatsApp number

Replace `971501234567` with your actual number (format: country code + number, no + or spaces)

### 2. Phone Number
Update in **2 places**:

- `index.html` line 48: Hero section Call button
- `index.html` line 53: Mobile quick actions call button
- `index.html` line 176: Contact section phone display

Replace `+971501234567` with your actual number

### 3. Email Address
Update in `index.html` line 183:
```html
<p><a href="mailto:YOUR-EMAIL@example.com">YOUR-EMAIL@example.com</a></p>
```

### 4. Logo
Replace the placeholder logo URL in `index.html` line 23:
```html
<img src="YOUR-LOGO-URL-HERE" alt="Mobile Garage Logo">
```

## 🌐 Deploy to Vercel

### Method 1: Using Vercel Website (Easiest)

1. **Create a Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub, GitLab, or Bitbucket

2. **Upload Your Project**
   - Click "Add New..." → "Project"
   - Click "Import Git Repository" or drag & drop your folder
   - If using Git, select your repository
   - If uploading directly, compress the folder to ZIP first

3. **Configure Project**
   - Project Name: `mobile-garage-uae` (or your preferred name)
   - Framework Preset: Leave as "Other"
   - Root Directory: `./`
   - Build Command: Leave empty
   - Output Directory: Leave empty

4. **Deploy**
   - Click "Deploy"
   - Wait 30-60 seconds
   - Your site is live! 🎉

5. **Your Live URL**
   - You'll get a URL like: `mobile-garage-uae.vercel.app`
   - Share this URL or connect a custom domain (see below)

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your project folder
cd C:\Users\PC\Desktop\claude\mobilegarage-00

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (Choose your account)
# - Link to existing project? N
# - Project name? mobile-garage-uae
# - In which directory is your code located? ./
# - Deploy? Y

# Your site is live!
```

### Method 3: Using GitHub (Recommended for Updates)

1. **Push to GitHub**
   ```bash
   cd C:\Users\PC\Desktop\claude\mobilegarage-00
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/mobile-garage.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Click "Deploy"

3. **Automatic Updates**
   - Every time you push to GitHub, Vercel auto-deploys!

## 🌍 Connect Custom Domain

### Step 1: Add Domain in Vercel

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Enter your domain (e.g., `mobilegarage.ae` or `www.mobilegarage.ae`)
4. Click "Add"

### Step 2: Configure DNS Records

Vercel will show you DNS records to add. You have **two options**:

#### Option A: Using Subdomain (www)
Add a **CNAME** record in your domain registrar:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

#### Option B: Using Root Domain (no www)
Add an **A** record in your domain registrar:

```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
TTL: 3600 (or Auto)
```

### Step 3: Update DNS at Your Registrar

Common UAE domain registrars:

#### **For .ae domains (ae Domain Administration)**
1. Log in to [aeda.ae](https://www.aeda.ae)
2. Go to "My Domains"
3. Select your domain → "DNS Management"
4. Add the records from Step 2
5. Save changes

#### **For GoDaddy**
1. Log in to [godaddy.com](https://www.godaddy.com)
2. Go to "My Products" → "DNS"
3. Add the records from Step 2
4. Save

#### **For Namecheap**
1. Log in to [namecheap.com](https://www.namecheap.com)
2. Go to "Domain List" → "Manage"
3. Select "Advanced DNS"
4. Add the records from Step 2
5. Save

### Step 4: Wait for DNS Propagation

- DNS changes take **5 minutes to 48 hours** (usually under 1 hour)
- Check status at [dnschecker.org](https://dnschecker.org)
- Vercel will automatically issue SSL certificate when DNS is ready

### Step 5: Force HTTPS Redirect

In Vercel Dashboard:
1. Go to "Settings" → "Domains"
2. Enable "Redirect HTTP to HTTPS" (should be on by default)

## 🔧 Common Domain Issues

**Problem**: Domain not working after 24 hours
- **Solution**: Check DNS records are exactly as Vercel specified
- Use [dnschecker.org](https://dnschecker.org) to verify

**Problem**: "Invalid Configuration" error
- **Solution**: Remove any existing A or CNAME records for the same domain
- Only keep Vercel's records

**Problem**: SSL certificate not issued
- **Solution**: Wait for DNS to fully propagate
- Can take up to 48 hours in rare cases

## 📧 Email Setup (Optional)

Your domain can also be used for email (e.g., info@mobilegarage.ae):

1. Keep your website on Vercel
2. Add **MX records** for email (doesn't conflict with website)
3. Popular options:
   - Google Workspace (paid)
   - Zoho Mail (free tier available)
   - Microsoft 365 (paid)

Example MX records for Google Workspace:
```
Type: MX
Priority: 1
Value: aspmx.l.google.com

Type: MX
Priority: 5
Value: alt1.aspmx.l.google.com
```

## 🎨 WhatsApp Message Customization

To customize the WhatsApp pre-filled message:

1. Open `index.html`
2. Find WhatsApp links (search for `wa.me`)
3. Change the `text=` parameter:

```html
<!-- Example: Change greeting -->
https://wa.me/971501234567?text=Hi!%20I%20need%20car%20service

<!-- %20 = space, %0A = new line -->
```

## 🌍 Language Customization

To add more content or modify translations:

1. Open `index.html`
2. Find elements with `data-en` and `data-ar` attributes
3. Update both attributes:

```html
<h2 data-en="Your English Text" data-ar="النص العربي">Your English Text</h2>
```

## 📊 Analytics (Optional)

To track visitors, add Google Analytics:

1. Get your GA4 tracking ID from [analytics.google.com](https://analytics.google.com)
2. Add before `</head>` in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🆘 Support

Common issues and solutions:

1. **Mobile menu not working**: Check `script.js` is loaded
2. **WhatsApp opens but shows wrong number**: Update all 4 instances
3. **Arabic text not showing**: Font may be blocked, check browser console
4. **Contact form not redirecting**: Check WhatsApp number format (no + or spaces)

## 📝 Update Checklist

Before going live:
- [ ] Update WhatsApp number (4 places)
- [ ] Update phone number (3 places)
- [ ] Update email address (1 place)
- [ ] Replace placeholder logo
- [ ] Test all buttons on mobile
- [ ] Test language switcher
- [ ] Test on actual mobile device
- [ ] Deploy to Vercel
- [ ] Connect custom domain
- [ ] Test live site

## 🎉 You're All Set!

Your mobile garage website is ready to attract customers across the UAE!

**Need help?** Check the Vercel documentation at [vercel.com/docs](https://vercel.com/docs)
