import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tractor, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage() {
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <Tractor className="h-8 w-8 text-primary" />
            <span className="font-display font-bold text-2xl text-primary">Farmora</span>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <AuthForm mode="login" onSubmit={login} isLoading={isLoggingIn} />
            </TabsContent>
            
            <TabsContent value="register">
              <AuthForm mode="register" onSubmit={register} isLoading={isRegistering} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1 bg-primary">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center text-white px-20">
          <h2 className="text-4xl font-bold mb-6 text-center">Empowering Indian Farmers with Intelligence</h2>
          <p className="text-xl text-green-100 text-center leading-relaxed">
            Join thousands of farmers using AI to predict market trends, simulate profits, and get expert crop advice in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthForm({ mode, onSubmit, isLoading }: { mode: 'login' | 'register', onSubmit: any, isLoading: boolean }) {
  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { username: "", password: "" }
  });

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...form.register("username")} disabled={isLoading} placeholder="Enter your username" />
        {form.formState.errors.username && (
          <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register("password")} disabled={isLoading} placeholder="••••••••" />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full h-11" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </Button>
    </form>
  );
}
