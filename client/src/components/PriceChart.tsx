import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import { useLanguage } from "@/hooks/use-language";
import { Info, Clock } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Mock data generator
const generateData = () => {
  const data = [];
  const basePrice = 2400;
  for (let i = 0; i < 7; i++) {
    data.push({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      price: basePrice + Math.floor(Math.random() * 200 - 100),
    });
  }
  return data;
};

const data = generateData();

export function PriceChart({ cropName }: { cropName: string }) {
  const { t } = useLanguage();

  return (
    <div className="h-[300px] w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-muted-foreground">{cropName} - {t('priceTrend')}</h4>
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
            LIVE
          </span>
          <UITooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Based on Agmarknet daily mandi reports.</p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
          <Clock className="h-3 w-3" />
          Last updated: Today, 10:00 AM
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))', 
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}
            itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
            formatter={(value) => [`₹${value}`, 'Price']}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
