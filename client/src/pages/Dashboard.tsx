import { useProfile, useMarketPrices } from "@/hooks/use-farm-data";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { SidebarLayout } from "@/components/SidebarLayout";
import { WeatherWidget } from "@/components/WeatherWidget";
import { PriceChart } from "@/components/PriceChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, CheckCircle2, Calculator } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  // Fetch prices relevant to user's first crop if available
  const { data: prices, isLoading: pricesLoading } = useMarketPrices(
    profile?.crops?.[0] ? { crop: profile.crops[0] } : undefined
  );

  const crops = profile?.crops || ["Paddy", "Wheat"]; // Fallback defaults

  if (profileLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 col-span-2 rounded-2xl" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-primary rounded-3xl p-8 text-primary-foreground relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {t('welcome')}, {user?.firstName || 'Farmer'}!
            </h1>
            <p className="text-primary-foreground/80 max-w-xl text-lg">
              Here's your farming summary for today. The market looks good for {crops[0]}.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/advisory">
                <Button variant="secondary" className="font-semibold shadow-lg hover:shadow-xl transition-all">
                  Get Advisory
                </Button>
              </Link>
              <Link href="/simulations">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                  Simulate Profit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Weather & Status */}
          <div className="space-y-8">
            <WeatherWidget />
            
            <Card className="border-l-4 border-l-yellow-500 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Pest Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  High humidity detected. Monitor {crops[0]} fields for fungal infections.
                </p>
                <Button variant="link" className="p-0 h-auto mt-2 text-yellow-600">
                  View prevention tips &rarr;
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Market & Crops */}
          <div className="lg:col-span-2 space-y-8">
            {/* Market Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {crops.map((crop, idx) => (
                <Card key={crop} className="hover:shadow-lg transition-shadow duration-300 border-primary/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      {crop} Price
                    </CardTitle>
                    {idx === 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">₹2,450<span className="text-sm font-normal text-muted-foreground">/q</span></div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      {idx === 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-500 font-medium">+2.5%</span> from yesterday
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                          <span className="text-red-500 font-medium">-0.8%</span> from yesterday
                        </>
                      )}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Badge variant={idx === 0 ? "default" : "secondary"} className={idx === 0 ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}>
                        {idx === 0 ? t('sell') : t('hold')}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center ml-auto">
                        85% Confidence
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Price Chart */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t('recentPrices')}</CardTitle>
                <CardDescription>Market trends for your selected crops over the last week.</CardDescription>
              </CardHeader>
              <CardContent>
                <PriceChart cropName={crops[0]} />
              </CardContent>
            </Card>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                     <Calculator className="h-5 w-5 text-orange-600" />
                   </div>
                   <h3 className="font-semibold text-orange-900">Recent Simulation</h3>
                 </div>
                 <p className="text-sm text-orange-800/80 mb-4">
                   Your simulation for Wheat predicts a profit of ₹45,000 next month.
                 </p>
                 <Link href="/simulations">
                   <Button variant="outline" size="sm" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                     View Details
                   </Button>
                 </Link>
               </div>
               
               <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                     <CheckCircle2 className="h-5 w-5 text-green-600" />
                   </div>
                   <h3 className="font-semibold text-green-900">Task Complete</h3>
                 </div>
                 <p className="text-sm text-green-800/80 mb-4">
                   Fertilizer application scheduled for today is marked as done.
                 </p>
                 <Button variant="outline" size="sm" className="bg-white border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800">
                   View Tasks
                 </Button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
