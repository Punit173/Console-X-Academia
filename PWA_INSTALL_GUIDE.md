# PWA Installation & Customization Guide

## Overview
Your app now supports PWA (Progressive Web App) installation on both Android and iOS devices, with a beautiful install button and customizable branding.

## Current Setup

### 1. **Install Button Component**
- **Location**: `components/InstallButton.tsx`
- Shows on Android, iOS, and Desktop browsers (unless already installed)
- Beautiful modal with installation instructions
- Automatically detects installed status

### 2. **Manifest Configuration**
- **Location**: `public/manifest.json`
- Contains app metadata for PWA installation
- Includes app name, icons, colors, and shortcuts

---

## How to Customize

### Change App Name
Edit `public/manifest.json`:

```json
{
    "name": "YOUR_APP_NAME_HERE",           // Full name
    "short_name": "SHORT_NAME",              // Home screen (12 chars max)
    ...
}
```

**Also update in**: `app/layout.tsx` (metadata section)

---

### Change App Logo/Icon
1. **Prepare your logo** (should be square, ideally 512x512 px or larger)
2. **Export in multiple formats** (JPEG and PNG recommended)
3. **Place in**: `public/assets/` folder
4. **Update references** in `public/manifest.json`:

```json
{
    "icons": [
        {
            "src": "/assets/YOUR_LOGO.png",    // Change this path
            "sizes": "192x192",
            "type": "image/png",               // Change type if needed
            "purpose": "any"
        },
        {
            "src": "/assets/YOUR_LOGO.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"               // For adaptive icons
        }
    ]
}
```

Also update in `app/layout.tsx`:
```typescript
icons: {
    apple: "/assets/YOUR_LOGO.png",
    icon: "/assets/YOUR_LOGO.png"
}
```

---

### Change Theme Color
Update in `public/manifest.json`:

```json
{
    "theme_color": "#2563eb",        // Home screen color bar
    "background_color": "#000000",   // Splash screen background
}
```

---

### Add App Description
Edit `public/manifest.json`:

```json
{
    "description": "Your app description here"
}
```

---

## How It Works

### **Android & Desktop**
- Browser detects PWA capability via `beforeinstallprompt` event
- User sees "Install Now" button in the modal
- App installs as a progressive web app with offline support

### **iOS**
- Shows installation instructions (Safari limitations)
- User manually adds to home screen via Share → Add to Home Screen
- Works like native app in fullscreen standalone mode

---

## Installation User Flow

### **Android/Desktop**
1. Visit the app
2. "Install App" button appears (bottom right)
3. Click → Modal shows "Install Now" option
4. Click "Install Now" → App installs
5. Access from home screen or app drawer

### **iOS**
1. Open in Safari
2. "Install App" button appears (bottom right)
3. Click → Modal shows step-by-step instructions
4. Follow: Share → Add to Home Screen → Add
5. App appears on home screen

---

## Files to Modify

| File | Purpose |
|------|---------|
| `public/manifest.json` | App metadata, icons, name |
| `app/layout.tsx` | SEO metadata, theme colors |
| `components/InstallButton.tsx` | Install UI/UX (optional customization) |
| `public/assets/` | Store your logo files |

---

## Testing Installation

### **Chrome/Edge (Desktop)**
1. Press F12 → Application tab
2. Check "Manifest" panel
3. Look for "Install" button in toolbar
4. Or click address bar icon → "Install"

### **Android Chrome**
1. Visit site in Chrome
2. Menu (⋮) → "Install app"
3. Confirm installation

### **iOS Safari**
1. Tap Share button (bottom)
2. Scroll → "Add to Home Screen"
3. Name the app and tap "Add"

---

## Tips

✅ **Use adaptive icons** - Add both "any" and "maskable" purposes for better appearance across devices
✅ **Keep short_name under 12 characters** - iOS and Android home screen limit
✅ **Provide multiple icon sizes** - 192x192 and 512x512 are standard
✅ **Use proper colors** - theme_color should contrast well with white text
✅ **Test on real devices** - Install prompts vary by browser and OS

---

## Quick Checklist

- [ ] Logo placed in `public/assets/`
- [ ] Icon paths updated in `manifest.json`
- [ ] App name updated in `manifest.json` and `layout.tsx`
- [ ] Theme colors customized
- [ ] Tested on Android
- [ ] Tested on iOS (Safari)
- [ ] Tested on Desktop

