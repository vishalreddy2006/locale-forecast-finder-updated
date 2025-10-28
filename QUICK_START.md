# Quick Start Guide - Sky Watch Pro

## 🚀 Installation & Running

```cmd
# Navigate to project
cd "c:\Users\k.vishal reddy\Pictures\FED FOLDER\locale-forecast-finder-main\locale-forecast-finder-main"

# Install dependencies (one time)
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:8080/
```

## 🎯 How to Use

### 1. Get Weather for Your Location
1. Click **"Use My Location"** button
2. Allow browser location permission when prompted
3. Wait 2-3 seconds for GPS → accurate weather with town/district/pincode

**If GPS is denied**: App automatically falls back to IP-based location

### 2. Search for Any City
1. Type city name in search bar (e.g., "Mumbai", "New York", "London")
2. Press Enter or click search
3. Weather loads for that city

### 3. Enable AI Features
1. Click **⚙️ Settings** icon (top right)
2. Toggle **"Enable AI Tips"** → Get smart weather suggestions
3. Toggle **"Enable AI Analyzer"** → See temperature trends and recommendations

### 4. Auto-Refresh Weather
1. Open **⚙️ Settings**
2. Toggle **"Auto Refresh"**
3. Set interval (1-60 minutes)
4. Weather updates automatically in background

### 5. Change Temperature Unit
- Click **°C** or **°F** toggle button to switch units

### 6. Change Theme
1. Open **⚙️ Settings**
2. Select **Light**, **Dark**, or **System** theme

## 🔍 Location Details Explained

The app shows **4 separate location fields**:
- **City/Town**: Most specific locality (neighborhood, suburb, town, village)
- **State/District**: Province, county, or administrative region
- **Country**: Full country name or code
- **Postcode**: ZIP code / postal code (when available)

**Location Source Badge**:
- 🎯 **GPS**: High-accuracy browser geolocation
- 🌐 **IP**: IP-based approximate location (fallback)
- 🔍 **Search**: Manually searched city
- 💾 **Saved**: Restored from last session

## 📋 Features Overview

| Feature | Status | Description |
|---------|--------|-------------|
| Live Location | ✅ | GPS with IP fallback |
| Search | ✅ | Find weather by city name |
| 7-Day Forecast | ✅ | Daily predictions |
| AI Tips | ✅ | Data-driven weather suggestions |
| AI Analyzer | ✅ | Trend analysis & recommendations |
| Auto-Refresh | ✅ | Automatic updates (1-60 min) |
| Theme Toggle | ✅ | Light/Dark/System modes |
| Temp Unit Toggle | ✅ | Celsius ↔ Fahrenheit |
| Precise Location | ✅ | Town/District/Pincode details |

## 🛠️ Troubleshooting

### Location Not Working?
1. **Check browser permissions**: Allow location access in browser settings
2. **Check connection**: Geolocation requires HTTPS or localhost
3. **Try search**: Manually search for your city if GPS fails
4. **IP fallback**: If GPS denied, app uses IP location (less accurate)

### Weather Not Loading?
1. **Check internet connection**: APIs require network access
2. **Wait a moment**: First load may take 3-5 seconds
3. **Try another city**: Search for a well-known city to test
4. **Check console**: Open browser DevTools → Console for error details

### Location Not Accurate?
1. **Enable high accuracy**: Make sure location permission is set to "Allow" not "Block"
2. **Wait for GPS lock**: First GPS fix may take 10-15 seconds
3. **Move outdoors**: GPS works better with clear sky view
4. **Use search**: For exact location, search by city/town name

## 📦 Building for Production

```cmd
# Create optimized production build
npm run build

# Preview production build locally
npm run preview

# Deploy the 'dist' folder to:
# - Vercel, Netlify, Render
# - GitHub Pages, Cloudflare Pages
# - Any static hosting provider
```

## 🔧 Configuration (Optional)

### HTTPS on Localhost (Optional)
For testing geolocation on local HTTPS:
1. Install mkcert
2. Create certs in project root: `mkdir certs && cd certs`
3. Generate: `mkcert localhost`
4. Restart dev server
5. Access: `https://localhost:8080`

### No API Keys Needed!
- ✅ All APIs are free and open-source
- ✅ No registration required
- ✅ No .env file needed
- ✅ Works out of the box

## 📊 API Sources (Free)

| Service | Provider | Purpose | Limit |
|---------|----------|---------|-------|
| Weather | Open-Meteo | Current + 7-day | 10k/day |
| Reverse Geocode | OSM Nominatim | Coordinates → Address | 1/sec |
| Reverse Geocode (Fallback) | BigDataCloud | Backup geocoder | Unlimited |
| Forward Search | Open-Meteo Geocoding | City name → Coordinates | 10k/day |
| IP Location | ipapi.co | IP → Approximate location | 1k/day |

All limits are **per IP address** and are sufficient for personal use.

## 💡 Tips for Best Results

1. **Allow location permission**: For most accurate town/district/postcode
2. **Enable AI features**: Get smart tips and trend analysis
3. **Set auto-refresh**: Weather updates automatically while tab is open
4. **Save to home screen**: On mobile, add as PWA for quick access
5. **Use search for planning**: Check weather for future travel destinations

## 📞 Support

- **Zero errors**: All TypeScript/lint issues resolved
- **No configuration**: Works immediately after `npm install`
- **No costs**: 100% free, no hidden charges
- **Privacy-first**: No tracking, no analytics, location never stored externally

---
**Ready to use!** Just run `npm run dev` and start exploring weather worldwide. 🌍
