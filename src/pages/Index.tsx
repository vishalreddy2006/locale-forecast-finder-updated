import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import WeatherCard from "@/components/WeatherCard";
import ForecastCard from "@/components/ForecastCard";
import TemperatureToggle from "@/components/TemperatureToggle";
import SearchBar from "@/components/SearchBar";
import SettingsPanel from "@/components/SettingsPanel";
import AITipsCard from "@/components/AITipsCard";
import AIAnalyzerCard from "@/components/AIAnalyzerCard";
import { Loader2 } from "lucide-react";
import { getCurrentWeather, getSevenDayForecastWithMeta, forwardGeocode, ipGeolocation } from "@/lib/weather";
import type { CurrentWeather, DailyForecast } from "@/lib/weather";

// WeatherData is essentially CurrentWeather without lat/lon (used for state)
type WeatherData = Omit<CurrentWeather, 'lat' | 'lon'>;

interface ForecastData {
  day: string;
  temperature: number;
  condition: string;
}

const IS_DEV = import.meta.env.DEV;

const Index = () => {
  // Preloaded Hyderabad weather data
  const hyderabadWeather: WeatherData = {
    temperature: 32,
    condition: "Clear",
    humidity: 45,
    windSpeedKmh: 12,
    location: "Hyderabad, India"
  };

  const hyderabadForecast: ForecastData[] = [
    { day: "Mon", temperature: 33, condition: "Clear" },
    { day: "Tue", temperature: 34, condition: "Partly Cloudy" },
    { day: "Wed", temperature: 31, condition: "Cloudy" },
    { day: "Thu", temperature: 29, condition: "Rain" },
    { day: "Fri", temperature: 30, condition: "Partly Cloudy" },
    { day: "Sat", temperature: 32, condition: "Clear" },
    { day: "Sun", temperature: 33, condition: "Clear" }
  ];

  const [weatherData, setWeatherData] = useState<WeatherData | null>(hyderabadWeather);
  const [forecast, setForecast] = useState<ForecastData[]>(hyderabadForecast);
  const [loading, setLoading] = useState(false);
  const [isCelsius, setIsCelsius] = useState(true);
  const [aiTipsEnabled, setAiTipsEnabled] = useState(false);
  const [aiAnalyzerEnabled, setAiAnalyzerEnabled] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationSource, setLocationSource] = useState<'geolocation'|'ip'|'search'|'saved' | null>(null);
  const [autoRefreshIntervalMin, setAutoRefreshIntervalMin] = useState<number>(5);
  const [isForecastFallback, setIsForecastFallback] = useState<boolean>(false);

  // Derived AI content from live data
  const aiTips = useMemo(() => {
    if (!weatherData) return [] as string[];
    const tips: string[] = [];
    const currentTemp = weatherData.temperature;
    const currentHumidity = weatherData.humidity;
    const condLower = weatherData.condition.toLowerCase();

    // Immediate condition-based tips
    if (condLower.includes("rain") || condLower.includes("drizzle")) {
      tips.push("Light to heavy rain expected — carry an umbrella or raincoat.");
    }
    if (condLower.includes("thunder") || condLower.includes("storm")) {
      tips.push("Severe weather possible — avoid outdoor activities and seek shelter.");
    }
    if (currentHumidity >= 80) {
      tips.push("Very humid — stay hydrated and avoid strenuous outdoor work in midday.");
    } else if (currentHumidity >= 65) {
      tips.push("Moderate humidity — wear breathable fabrics.");
    }

    // Wind
    if (weatherData.windSpeedKmh >= 35) {
      tips.push("Strong winds — secure loose objects and be careful driving high-sided vehicles.");
    } else if (weatherData.windSpeedKmh >= 20) {
      tips.push("Gusty winds — outdoor light items may be blown around.");
    }

    // Temperature extremes
    if (currentTemp >= 35) tips.push("Hot conditions — avoid prolonged sun exposure and use sunscreen.");
    else if (currentTemp <= 10) tips.push("Cold conditions — wear warm layers and protect extremities.");

    // Forecast-aware tips (look at next 3 days)
    try {
      const rainSoon = forecast.slice(0, 3).some(f => /rain|drizzle|storm/i.test(f.condition));
      const tempTrend = (() => {
        if (!forecast.length) return 0;
        const avgNow = currentTemp;
        const avgNext = (forecast.slice(0, 3).reduce((s, f) => s + f.temperature, 0) / Math.max(1, Math.min(3, forecast.length)));
        return Math.round(avgNext - avgNow);
      })();
      if (rainSoon) tips.push("Rain likely in the next few days — plan outdoor events accordingly.");
      if (tempTrend >= 3) tips.push(`Warming trend (~+${tempTrend}°) over next few days — light clothing later in week.`);
      else if (tempTrend <= -3) tips.push(`Cooling trend (~${tempTrend}°) ahead — consider warmer layers.`);
    } catch (err) {
      // Ignore forecast parsing errors
      if (IS_DEV) console.warn('Forecast trend error:', err);
    }

    if (tips.length === 0) tips.push("Good outdoor conditions today.");
    return tips;
  }, [weatherData, forecast]);

  const aiAnalysis = useMemo(() => {
    if (!forecast?.length || !weatherData) return { trend: "", recommendation: "" };
    // Temperature trend over next 3 days
    const sample = forecast.slice(0, 3);
    const avgFuture = sample.reduce((s, f) => s + f.temperature, 0) / Math.max(1, sample.length);
    const delta = Math.round(avgFuture - weatherData.temperature);
    const trend = delta > 0 ? `Warming by ~${Math.abs(delta)}° over next days` : delta < 0 ? `Cooling by ~${Math.abs(delta)}° over next days` : "Stable temperatures ahead";

    // Rain risk summary
    const rainCount = sample.filter(f => /rain|drizzle|storm/i.test(f.condition)).length;
    const rainRisk = rainCount >= 2 ? 'High chance of rain in coming days' : rainCount === 1 ? 'Some rain likely' : 'Low chance of rain';

    // Humidity / heat stress
    const humidityWarning = weatherData.humidity >= 85 ? 'High humidity — heat stress possible in midday' : weatherData.humidity >= 70 ? 'Moderately humid' : undefined;

    const recommendation = [] as string[];
    if (delta > 3) recommendation.push('Shift strenuous outdoor work to mornings when cooler.');
    if (delta < -3) recommendation.push('Keep a light jacket handy for cooling evenings.');
    if (rainCount > 0) recommendation.push('Carry rain protection for the next few days.');
    if (recommendation.length === 0) recommendation.push('No special action required; conditions are normal.');

    return { trend, rainRisk, humidityWarning, recommendation: recommendation.join(' ') };
  }, [forecast, weatherData]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    try {
      const current = await getCurrentWeather(lat, lon);
      const nextWeather: WeatherData = {
        temperature: current.temperature,
        condition: current.condition,
        humidity: current.humidity,
        windSpeedKmh: current.windSpeedKmh,
        location: current.location,
        city: current.city,
        state: current.state,
        country: current.country,
        postcode: current.postcode,
        localTime: current.localTime,
      };

      const { days, isFallback, timezoneName, timezoneOffsetSec } = await getSevenDayForecastWithMeta(lat, lon);
      // Compute a reliable local time string using timezoneName if present
      let localTimeStr: string | undefined = current.localTime;
      try {
        if (timezoneName) {
          const now = Date.now();
          const fmt = new Intl.DateTimeFormat('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezoneName
          });
          localTimeStr = fmt.format(now);
        } else if (typeof timezoneOffsetSec === 'number') {
          const localOffsetMin = new Date().getTimezoneOffset(); // minutes
          const millis = Date.now() + (timezoneOffsetSec * 1000) + (localOffsetMin * 60 * -1000);
          const d = new Date(millis);
          localTimeStr = d.toUTCString().replace(' GMT','');
        }
      } catch (err) {
        // Ignore time formatting errors
        if (IS_DEV) console.warn('Time format error:', err);
      }
      setWeatherData({ ...nextWeather, localTime: localTimeStr });
      const dailyForecast: ForecastData[] = days.map((d) => ({
        day: d.day,
        temperature: d.temperature,
        condition: d.condition,
      }));
      setForecast(dailyForecast);
      setIsForecastFallback(isFallback);
      // persist last coordinates
      try {
        localStorage.setItem("lastWeatherLocation", JSON.stringify({ lat, lon }));
      } catch (err) {
        // Ignore localStorage errors
        if (IS_DEV) console.warn('localStorage error:', err);
      }
      setLoading(false);
      toast.success("Weather data loaded successfully!");
    } catch (error) {
      toast.error("Failed to fetch weather data. Please check your connection and try again.");
      setLoading(false);
      if (IS_DEV) {
        console.error("Weather fetch error:", error);
      }
    }
  }, []);

  const getLocationAndWeather = useCallback(async () => {
    setLoading(true);
    // Secure context check: geolocation requires HTTPS or localhost
    const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
    if (!window.isSecureContext && !isLocalhost) {
      toast.error("Geolocation needs HTTPS or localhost. Open http://localhost:8080 or use HTTPS.");
      setLoading(false);
      return;
    }
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    // Try to give user more actionable info via Permissions API
    try {
      if ("permissions" in navigator && navigator.permissions) {
        const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        if (status.state === "denied") {
          toast.error("Location permission is blocked. Allow location for this site in your browser settings.");
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      // Permissions API not supported; proceed
      if (IS_DEV) console.warn('Permissions API error:', err);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLastCoords({ lat: latitude, lon: longitude });
        setLocationSource('geolocation');
        await fetchWeatherData(latitude, longitude);
      },
      async (error) => {
        // Try IP fallback when geolocation fails or is denied
        let message = "Unable to get your location via browser GPS. Trying IP-based fallback...";
        try {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Permission denied for GPS. Trying IP-based fallback...";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location unavailable. Trying IP-based fallback...";
              break;
            case error.TIMEOUT:
              message = "Location request timed out. Trying IP-based fallback...";
              break;
          }
        } catch (err) {
          // ignore error code parsing
          if (IS_DEV) console.warn('Error code parse:', err);
        }
        toast(message);
        try {
          const ip = await ipGeolocation();
          if (ip && typeof ip.lat === 'number' && typeof ip.lon === 'number') {
            setLastCoords({ lat: ip.lat, lon: ip.lon });
            setLocationSource('ip');
            await fetchWeatherData(ip.lat, ip.lon);
            return;
          }
        } catch (e) {
          if (IS_DEV) console.error('IP geolocation error:', e);
        }
        toast.error("Unable to determine location. Please search manually.");
        setLoading(false);
        if (IS_DEV) {
          console.error("Geolocation error:", error);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchWeatherData]);

  // Auto refresh
  useEffect(() => {
    if (autoRefreshEnabled) {
      const interval = setInterval(() => {
        if (lastCoords) {
          fetchWeatherData(lastCoords.lat, lastCoords.lon);
        } else {
          getLocationAndWeather();
        }
        toast.success("Weather data refreshed");
      }, autoRefreshIntervalMin * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, autoRefreshIntervalMin, lastCoords, getLocationAndWeather, fetchWeatherData]);

  // Load last saved location on mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const raw = localStorage.getItem("lastWeatherLocation");
        if (raw) {
          const saved = JSON.parse(raw) as { lat: number; lon: number };
          setLastCoords({ lat: saved.lat, lon: saved.lon });
          setLocationSource('saved');
          setLoading(true);
          await fetchWeatherData(saved.lat, saved.lon);
        }
      } catch (err) {
        // Ignore localStorage errors
        if (IS_DEV) console.warn('localStorage load error:', err);
      }
    };
    loadSavedLocation();
  }, [fetchWeatherData]);

  const convertTemperature = (temp: number) => {
    return isCelsius ? temp : (temp * 9/5) + 32;
  };

  const handleToggle = () => {
    setIsCelsius(!isCelsius);
  };

  const handleSearch = async (location: string) => {
    setLoading(true);
    try {
      const geo = await forwardGeocode(location);
      if (!geo) {
        toast.error("Location not found. Try a different query.");
        setLoading(false);
        return;
      }
      setLastCoords({ lat: geo.lat, lon: geo.lon });
      setLocationSource('search');
      await fetchWeatherData(geo.lat, geo.lon);
      toast.success(`Loaded weather for ${geo.name}${geo.state ? ", " + geo.state : ""}${geo.country ? ", " + geo.country : ""}`);
    } catch (e) {
      setLoading(false);
      toast.error("Search failed. Please try again.");
      if (IS_DEV) console.error(e);
    }
  };

  const handleDownloadPDF = () => {
    if (!weatherData) {
      toast.error("No weather data to download");
      return;
    }

    try {
      // Create a printable HTML report
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) {
        toast.error("Please allow popups to download PDF");
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Weather Report - ${weatherData.city || weatherData.location}</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
              body { margin: 0; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              max-width: 800px;
              margin: 20px auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            h1 { color: #2563eb; margin-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
            .header { text-align: center; margin-bottom: 30px; }
            .current { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .location { font-size: 14px; color: #666; margin-top: 5px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .item { padding: 10px; background: #f8fafc; border-left: 3px solid #2563eb; }
            .label { font-weight: 600; color: #1e40af; }
            .forecast-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin: 20px 0; }
            .day-card { background: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; }
            .day-card strong { display: block; color: #1e40af; margin-bottom: 10px; }
            .tips { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .tips ul { margin: 10px 0; padding-left: 20px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 12px; }
            .print-btn { 
              display: block; 
              margin: 20px auto; 
              padding: 12px 30px; 
              background: #2563eb; 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer;
              font-size: 16px;
            }
            .print-btn:hover { background: #1d4ed8; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌤️ Weather Report</h1>
            <div class="location">
              ${weatherData.city ? `${weatherData.city}${weatherData.state ? ', ' + weatherData.state : ''}${weatherData.country ? ', ' + weatherData.country : ''}` : weatherData.location}
              ${weatherData.postcode ? ` · ${weatherData.postcode}` : ''}
            </div>
            <div class="location">${weatherData.localTime || new Date().toLocaleString()}</div>
          </div>

          <div class="current">
            <h2>Current Weather</h2>
            <div class="grid">
              <div class="item">
                <div class="label">Temperature</div>
                <div>${Math.round(isCelsius ? weatherData.temperature : (weatherData.temperature * 9/5) + 32)}°${isCelsius ? 'C' : 'F'}</div>
              </div>
              <div class="item">
                <div class="label">Condition</div>
                <div>${weatherData.condition}</div>
              </div>
              <div class="item">
                <div class="label">Humidity</div>
                <div>${weatherData.humidity}%</div>
              </div>
              <div class="item">
                <div class="label">Wind Speed</div>
                <div>${weatherData.windSpeedKmh} km/h</div>
              </div>
            </div>
          </div>

          <h2>7-Day Forecast</h2>
          <div class="forecast-grid">
            ${forecast.map(day => `
              <div class="day-card">
                <strong>${day.day}</strong>
                <div>${Math.round(isCelsius ? day.temperature : (day.temperature * 9/5) + 32)}°${isCelsius ? 'C' : 'F'}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 5px;">${day.condition}</div>
              </div>
            `).join('')}
          </div>

          ${aiTipsEnabled && aiTips.length > 0 ? `
            <div class="tips">
              <h2 style="margin-top: 0;">AI Weather Tips</h2>
              <ul>
                ${aiTips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${aiAnalyzerEnabled && aiAnalysis ? `
            <div class="tips" style="background: #e0f2fe;">
              <h2 style="margin-top: 0;">AI Analysis</h2>
              <p><strong>Trend:</strong> ${aiAnalysis.trend}</p>
              ${aiAnalysis.rainRisk ? `<p><strong>Rain Risk:</strong> ${aiAnalysis.rainRisk}</p>` : ''}
              ${aiAnalysis.humidityWarning ? `<p><strong>Humidity:</strong> ${aiAnalysis.humidityWarning}</p>` : ''}
              <p><strong>Recommendation:</strong> ${aiAnalysis.recommendation}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated by Sky Watch Pro</p>
            <p>Data sources: Open-Meteo, OSM Nominatim, BigDataCloud</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
          </div>

          <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

          <script>
            // Auto-focus print dialog after a short delay
            setTimeout(() => {
              // Don't auto-print, let user click the button
            }, 500);
          </script>
        </body>
        </html>
      `;

      reportWindow.document.write(html);
      reportWindow.document.close();
      toast.success("Weather report opened! Click 'Print/Save as PDF' button.");
    } catch (error) {
      toast.error("Failed to generate report. Please try again.");
      if (IS_DEV) console.error("PDF generation error:", error);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground">Weather Forecast</h1>
          <div className="flex items-center gap-3">
            <TemperatureToggle isCelsius={isCelsius} onToggle={handleToggle} />
            <SettingsPanel
              aiTipsEnabled={aiTipsEnabled}
              aiAnalyzerEnabled={aiAnalyzerEnabled}
              autoRefreshEnabled={autoRefreshEnabled}
              onAiTipsToggle={() => {
                setAiTipsEnabled(!aiTipsEnabled);
                toast.success(`AI Tips ${!aiTipsEnabled ? "enabled" : "disabled"}`);
              }}
              onAiAnalyzerToggle={() => {
                setAiAnalyzerEnabled(!aiAnalyzerEnabled);
                toast.success(`AI Analyzer ${!aiAnalyzerEnabled ? "enabled" : "disabled"}`);
              }}
              onAutoRefreshToggle={() => {
                setAutoRefreshEnabled(!autoRefreshEnabled);
                toast.success(`Auto Refresh ${!autoRefreshEnabled ? "enabled" : "disabled"}`);
              }}
              onDownloadPDF={handleDownloadPDF}
              theme={theme}
              onThemeChange={handleThemeChange}
              autoRefreshIntervalMin={autoRefreshIntervalMin}
              onAutoRefreshIntervalChange={(m) => {
                setAutoRefreshIntervalMin(m);
                toast.success(`Auto Refresh interval set to ${m} min`);
              }}
            />
          </div>
        </div>

  <SearchBar onSearch={handleSearch} onUseMyLocation={() => { setLoading(true); getLocationAndWeather(); }} />

        {weatherData && (
          <div className="space-y-6">
            <WeatherCard
              temperature={convertTemperature(weatherData.temperature)}
              condition={weatherData.condition}
              humidity={weatherData.humidity}
              windSpeed={weatherData.windSpeedKmh}
              location={weatherData.location}
              isCelsius={isCelsius}
              localTime={weatherData.localTime}
              city={weatherData.city}
              state={weatherData.state}
              country={weatherData.country}
              postcode={weatherData.postcode}
              locationSource={locationSource ?? undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiTipsEnabled && <AITipsCard tips={aiTips} />}
              {aiAnalyzerEnabled && <AIAnalyzerCard analysis={aiAnalysis} />}
            </div>
          </div>
        )}

        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">7-Day Forecast</h2>
            {/* Fallback badge */}
            {isForecastFallback ? (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground border border-border">
                Aggregated from 5-day data
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-accent/20 px-2 py-1 text-xs text-foreground border border-border">
                Open-Meteo 7-day
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {forecast.map((day, index) => (
              <div key={`fc-${index}`}>
                <ForecastCard
                  day={day.day}
                  temperature={convertTemperature(day.temperature)}
                  condition={day.condition}
                  isCelsius={isCelsius}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
