import { CloudSun, CloudRain, Sun, Wind, Droplets, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-farm-data";
import { Skeleton } from "@/components/ui/skeleton";

export function WeatherWidget() {
  const { t } = useLanguage();
  const { data: profile } = useProfile();
  const district = profile?.district || "Ludhiana";
  const state = profile?.state || "Punjab";

  const { data: weather, isLoading, isError } = useQuery({
    queryKey: ["/api/weather", district, state],
    queryFn: async () => {
      // In a real app, this would call a backend proxy for OpenWeatherMap
      await new Promise(r => setTimeout(r, 1000));
      return {
        temp: 28,
        condition: "Sunny",
        humidity: 65,
        wind: 12,
        rainProb: 15,
        source: "OpenWeatherMap",
        lastUpdated: new Date().toISOString(),
        forecast: [
          { day: "today", temp: 29, condition: "Partly Cloudy" },
          { day: "tomorrow", temp: 27, condition: "Rain" },
          { day: "nextWeek", temp: 30, condition: "Sunny" },
        ]
      };
    }
  });

  function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
    switch (condition.toLowerCase()) {
      case 'rain': return <CloudRain className={cn("text-blue-500", className)} />;
      case 'partly cloudy': return <CloudSun className={cn("text-yellow-500", className)} />;
      default: return <Sun className={cn("text-orange-500", className)} />;
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-blue-900">{t('weather')}</h3>
        <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded-full text-blue-700 border border-blue-200 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {district}, {state}
        </span>
      </div>

      <div className="flex items-end gap-4 mb-8">
        <div>
          <span className="text-5xl font-bold text-blue-900">{weather?.temp}°</span>
          <p className="text-blue-600 font-medium mt-1">{weather?.condition}</p>
        </div>
        <WeatherIcon condition={weather?.condition || 'sunny'} className="h-16 w-16 ml-auto" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-xl">
          <Droplets className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className="font-semibold text-blue-900">{weather?.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-xl">
          <Wind className="h-5 w-5 text-indigo-500" />
          <div>
            <p className="text-xs text-muted-foreground">Wind</p>
            <p className="font-semibold text-blue-900">{weather?.wind} km/h</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {weather?.forecast.map((day: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/40 rounded-xl hover:bg-white/60 transition-colors">
            <span className="text-sm font-medium text-blue-800 capitalize">{t(day.day)}</span>
            <div className="flex items-center gap-3">
              <WeatherIcon condition={day.condition} className="h-5 w-5" />
              <span className="font-bold text-blue-900 w-8 text-right">{day.temp}°</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-blue-100/50 flex justify-between items-center text-[10px] text-blue-400">
        <span>Source: {weather?.source}</span>
        <span>Updated: {new Date(weather?.lastUpdated || '').toLocaleTimeString()}</span>
      </div>

      {isError && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-orange-500 text-[10px] font-bold">
          <AlertCircle className="h-3 w-3" />
          <span>ESTIMATED</span>
        </div>
      )}
    </div>
  );
}
