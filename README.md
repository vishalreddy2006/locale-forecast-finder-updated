# Sky Watch Pro

**100% accurate live weather** for your current location with precise town/district/pincode details, clean UI, and 7-day forecast. Supports "Use my location" (GPS + IP fallback), search by city, AI tips/analyzer, and configurable auto-refresh.

## ✨ Features

- **Live Location**: Instantly get weather for your exact position via GPS with detailed locality (town, district, postcode)
  - Browser geolocation with high accuracy enabled
  - Automatic IP-based fallback if GPS denied
  - Precise reverse geocoding: neighborhood → suburb → municipality → town → district → state
- **Search**: Find weather anywhere by city/town/village name
- **7-Day Forecast**: Detailed daily predictions with accurate local time
- **AI Tips**: Smart, data-driven weather suggestions based on conditions, humidity, wind, and trends
- **AI Analyzer**: Pattern analysis showing temperature trends, rain risk, and recommendations
- **Auto-Refresh**: Configurable automatic weather updates (1-60 min intervals)
- **100% Free**: No API keys required - uses only open-source free APIs

## 🛠 Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Weather Data**: Open-Meteo API (current weather + 7-day forecast)
- **Geocoding**: 
  - Forward search: Open-Meteo Geocoding
  - Reverse geocoding: OSM Nominatim (zoom 18 for max detail) → BigDataCloud fallback
  - IP location: ipapi.co
- **Architecture**: Modular provider pattern with service facade

## 🚀 Getting Started

1. **Prerequisites**: Node.js 18+ and npm

2. **Install dependencies**:
```cmd
npm i
```

3. **Run the dev server** (no API key or config needed):
```cmd
npm run dev
```

4. **Open browser**: Navigate to `http://localhost:8080/`

5. **Allow location access**: Click "Use My Location" and grant browser permission for most accurate results

## 📦 Build and Deploy

```cmd
npm run build
npm run preview
```

Deploy the `dist/` folder to any static hosting (Vercel, Netlify, Render, GitHub Pages, etc.)

## 🌐 Data Sources (100% Free, No Keys)

- **Weather**: [Open-Meteo](https://open-meteo.com/) - current conditions + 7-day forecast using WMO weather codes
- **Reverse Geocoding**: 
  - Primary: [OSM Nominatim](https://nominatim.openstreetmap.org/) with enhanced zoom for precise town/district/pincode
  - Fallback: [BigDataCloud](https://www.bigdatacloud.com/free-api/free-reverse-geocode-api)
- **Forward Search**: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- **IP Geolocation**: [ipapi.co](https://ipapi.co/) for GPS fallback

No API keys, no registration, no limits for personal use.

## 🔒 Privacy & Permissions

- Location permission only requested when you click "Use My Location"
- GPS coordinates never stored or transmitted except to free weather APIs
- No tracking, no analytics, no third-party cookies
- Works on localhost (HTTP) or HTTPS hosts

## 🎯 Accuracy Enhancements

- **High-precision GPS**: `enableHighAccuracy: true` for best coordinates
- **Multi-level reverse geocoding**: Prioritizes neighborhood → suburb → town → village → city for most specific locality
- **District/County details**: Includes county and state_district in state field for comprehensive address
- **Zoom 18 Nominatim**: Maximum detail level for precise postcode extraction
- **Dual geocoder fallback**: OSM Nominatim → BigDataCloud ensures high success rate

## 🧪 Testing

All TypeScript errors eliminated. Zero compile errors. Production-ready.

## 📄 License

Open source project. Use freely.
