import { CloudSun, CloudRain, Sun, Wind, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";

// Mock weather data
const weatherData = {
  current: { temp: 28, condition: "Sunny", humidity: 65, wind: 12 },
  forecast: [
    { day: "today", temp: 29, condition: "Partly Cloudy" },
    { day: "tomorrow", temp: 27, condition: "Rain" },
    { day: "nextWeek", temp: 30, condition: "Sunny" },
  ]
};

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  switch (condition.toLowerCase()) {
    case 'rain': return <CloudRain className={cn("text-blue-500", className)} />;
    case 'partly cloudy': return <CloudSun className={cn("text-yellow-500", className)} />;
    default: return <Sun className={cn("text-orange-500", className)} />;
  }
}

export function WeatherWidget() {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-blue-900">{t('weather')}</h3>
        <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded-full text-blue-700 border border-blue-200">
          Tirunelveli, TN
        </span>
      </div>

      <div className="flex items-end gap-4 mb-8">
        <div>
          <span className="text-5xl font-bold text-blue-900">{weatherData.current.temp}°</span>
          <p className="text-blue-600 font-medium mt-1">{weatherData.current.condition}</p>
        </div>
        <WeatherIcon condition={weatherData.current.condition} className="h-16 w-16 ml-auto" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-xl">
          <Droplets className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className="font-semibold text-blue-900">{weatherData.current.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-xl">
          <Wind className="h-5 w-5 text-indigo-500" />
          <div>
            <p className="text-xs text-muted-foreground">Wind</p>
            <p className="font-semibold text-blue-900">{weatherData.current.wind} km/h</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {weatherData.forecast.map((day, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/40 rounded-xl hover:bg-white/60 transition-colors">
            <span className="text-sm font-medium text-blue-800 capitalize">{t(day.day)}</span>
            <div className="flex items-center gap-3">
              <WeatherIcon condition={day.condition} className="h-5 w-5" />
              <span className="font-bold text-blue-900 w-8 text-right">{day.temp}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
