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
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, CheckCircle2, Calculator, ShieldCheck, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  const { data: tasks, isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const { data: prices, isLoading: pricesLoading } = useMarketPrices(
    profile?.crops?.[0] ? { crop: profile.crops[0] } : undefined
  );

  const crops = profile?.crops || ["Paddy", "Wheat"];

  if (profileLoading || tasksLoading) {
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
        <div className="bg-primary rounded-3xl p-8 text-primary-foreground relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {t('welcome')}, {user?.firstName || 'Farmer'}!
            </h1>
            <p className="text-primary-foreground/80 max-w-xl text-lg">
              Here's your farming summary. Market confidence for {crops[0]} is high today.
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
                  High humidity detected in {profile?.district}. Monitor {crops[0]} fields for Blast/Blight infections.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto mt-2 text-yellow-600 hover:bg-transparent hover:text-yellow-700 shadow-none">
                      View prevention tips &rarr;
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                        Disease Prevention Guide: {crops[0]}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm leading-relaxed">
                      <section>
                        <h4 className="font-bold text-primary mb-1">Cultural Practices</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Maintain proper spacing between plants for ventilation.</li>
                          <li>Remove and destroy infected stubble from previous season.</li>
                          <li>Avoid excessive nitrogenous fertilizer application.</li>
                        </ul>
                      </section>
                      <section>
                        <h4 className="font-bold text-primary mb-1">Biological Control</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Apply Pseudomonas fluorescens (10g/kg) as seed treatment.</li>
                          <li>Use neem-based fungicides if humidity persists above 85%.</li>
                        </ul>
                      </section>
                      <Button className="w-full gap-2 mt-4" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                        Full Agronomic Manual
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Daily Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!tasks || tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No pending tasks for today.</p>
                  ) : (
                    tasks.slice(0, 3).map((task: any) => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          checked={task.completed} 
                          onCheckedChange={(checked) => toggleTask.mutate({ id: task.id, completed: !!checked })}
                        />
                        <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {crops.slice(0, 2).map((crop: string, idx: number) => (
                <Card key={crop} className="hover:shadow-lg transition-shadow duration-300 border-primary/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      {crop} Price
                    </CardTitle>
                    <TrendingUp className={`h-4 w-4 ${idx === 0 ? 'text-green-500' : 'text-blue-500'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">₹2,450<span className="text-sm font-normal text-muted-foreground">/q</span></div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-green-500 font-medium">+2.5%</span> trend for {profile?.district}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {idx === 0 ? t('sell') : t('hold')}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center ml-auto">
                        High Confidence
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t('recentPrices')}</CardTitle>
                <CardDescription>Market intelligence for {crops[0]} in {profile?.district}.</CardDescription>
              </CardHeader>
              <CardContent>
                <PriceChart cropName={crops[0]} />
              </CardContent>
            </Card>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Calculator className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Profit Simulator</h3>
                  <p className="text-sm text-orange-800/70">Analyze seasonal risks for your harvest.</p>
                </div>
              </div>
              <Link href="/simulations">
                <Button variant="outline" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100">
                  Try Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
