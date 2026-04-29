import { Sprout, BarChart3, MessageSquareText, Calculator, User, LogOut, Tractor, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-farm-data";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t, setLanguage, language } = useLanguage();

  const { data: profile } = useProfile();
  
  const navItems = [
    { href: "/", icon: BarChart3, label: t('dashboard') },
    ...(profile?.role === "trader" ? [
      { href: "/farmers", icon: User, label: "Find Farmers" }
    ] : [
      { href: "/prices", icon: Tractor, label: t('marketPrices') },
      { href: "/advisory", icon: MessageSquareText, label: t('advisory') },
      { href: "/simulations", icon: Calculator, label: t('simulations') },
    ]),
    { href: "/messages", icon: MessageSquareText, label: "Messages" },
    { href: "/profile", icon: User, label: t('profile') },
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Tractor className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-xl text-primary">Farmora</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6 flex items-center gap-2 border-b">
              <Tractor className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl text-primary">Farmora</span>
            </div>
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  location === item.href 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6 flex items-center gap-2 border-b">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tractor className="h-6 w-6 text-primary" />
          </div>
          <span className="font-display font-bold text-2xl text-primary">Farmora</span>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              location === item.href 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
            )}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-card border shadow-sm mb-4">
             <Avatar className="h-10 w-10 border-2 border-primary/20">
               <AvatarImage src={user?.profileImageUrl || undefined} />
               <AvatarFallback className="bg-primary/10 text-primary">
                 {user?.firstName?.[0] || <User className="h-4 w-4" />}
               </AvatarFallback>
             </Avatar>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium truncate">{user?.firstName || 'User'}</p>
               <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
             </div>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive no-default-hover-elevate no-default-active-elevate" onClick={() => logout()}>
               <LogOut className="h-4 w-4" />
             </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>{languages.find(l => l.code === language)?.label}</span>
                <span className="text-xs opacity-50 uppercase">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>{t('selectLanguage')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className="justify-between"
                >
                  {lang.label}
                  {language === lang.code && <span className="text-primary text-xs">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
