import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tractor, BarChart3, MessageSquare, ShieldCheck, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tractor className="h-8 w-8 text-primary" />
            <span className="font-display font-bold text-2xl text-primary">Farmora</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth">Log In</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 lg:py-32 bg-gradient-to-b from-background to-green-50/50">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1.5 text-sm rounded-full">
            AI-Powered Agriculture for India
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground text-balance">
            Farming Intelligence for a <span className="text-primary">Bountiful Future</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Empower your farm with AI advisory, real-time market prices, and profit simulations. Make data-driven decisions for better yields.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-105 transition-all" asChild>
              <Link href="/auth">
                Start Farming Smarter <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-card border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BarChart3}
              title="Market Intelligence"
              description="Real-time mandi prices and trend analysis to help you decide when to sell."
            />
            <FeatureCard 
              icon={MessageSquare}
              title="AI Advisory"
              description="24/7 Chatbot for crop health, pest control, and personalized farming advice."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Profit Simulator"
              description="Calculate expected profits and assess risks before you even plant a seed."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12 px-6 border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Tractor className="h-5 w-5" />
            <span className="font-bold text-foreground">Farmora</span>
          </div>
          <p>© 2026 Farmora Intelligence. Built for the Modern Indian Farmer.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-background border shadow-sm hover:shadow-md transition-shadow group">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-3 font-display">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={className}>{children}</span>;
}
