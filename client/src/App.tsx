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
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Prices from "@/pages/Prices";
import Advisory from "@/pages/Advisory";
import Simulations from "@/pages/Simulations";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import FarmerList from "@/pages/FarmerList";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [location, setLocation] = useLocation();

  const hasCompletedOnboarding = !!(
    profile && 
    profile.state && 
    profile.district && 
    (profile.role === 'trader' ? (profile.metadata as any)?.businessName : (profile.crops && profile.crops.length > 0))
  );

  useEffect(() => {
    // Only redirect if we are sure about the auth and profile state
    if (!isLoading && user && !profileLoading) {
      if (!hasCompletedOnboarding && location !== "/profile" && location !== "/auth") {
        console.log("Redirecting to profile: Onboarding incomplete", { role: profile?.role, state: profile?.state });
        setLocation("/profile");
      } else if (hasCompletedOnboarding && location === "/profile" && !window.location.search.includes("edit=true")) {
        // If they are on profile but finished, take them to dashboard UNLESS they explicitly want to edit
        // But for now, let's just let them stay on profile if they went there manually.
      }
    }
  }, [user, profile, profileLoading, isLoading, location, setLocation, hasCompletedOnboarding]);

  if (isLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your harvest...</p>
        </div>
      </div>
    );
  }

  // Define allowed routes based on auth state
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route component={() => {
          useEffect(() => { if (location !== "/" && location !== "/auth") setLocation("/auth"); }, [location]);
          return null;
        }} />
      </Switch>
    );
  }

  // If logged in but not onboarded, lock them to profile
  if (user && !hasCompletedOnboarding && location !== "/profile") {
    return (
      <Switch>
        <Route path="/profile" component={Profile} />
        <Route component={() => {
          useEffect(() => { setLocation("/profile"); }, []);
          return null;
        }} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/prices" component={Prices} />
      <Route path="/advisory" component={Advisory} />
      <Route path="/simulations" component={Simulations} />
      <Route path="/profile" component={Profile} />
      <Route path="/messages" component={Messages} />
      <Route path="/farmers" component={FarmerList} />
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
