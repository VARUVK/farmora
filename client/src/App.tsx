import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-farm-data";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Prices from "@/pages/Prices";
import Advisory from "@/pages/Advisory";
import Simulations from "@/pages/Simulations";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && !profileLoading) {
      const hasCompletedOnboarding = profile && profile.state && profile.district && profile.crops && profile.crops.length > 0;
      if (!hasCompletedOnboarding && location !== "/profile") {
        setTimeout(() => setLocation("/profile"), 0);
      }
    }
  }, [user, profile, profileLoading, isLoading, location, setLocation]);

  if (isLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/prices" component={Prices} />
      <Route path="/advisory" component={Advisory} />
      <Route path="/simulations" component={Simulations} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
