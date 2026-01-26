import { useState, useRef, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-farm-data";
import { useChatStream } from "@/hooks/use-chat-stream"; // We'll create a simple hook for this
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Sprout, Loader2 } from "lucide-react";
import { api } from "@shared/routes";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Advisory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${user?.firstName || 'Farmer'}! I can help you with crop advice, pest control, or market trends for ${profile?.crops?.join(', ') || 'your crops'}. What's on your mind?` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Create a conversation if not exists, then post message.
      // For simplicity in this demo, we'll assume a single conversation or just hit the message endpoint directly 
      // if the backend supported a stateless chat. But per the routes, we need a conversation ID.
      // We'll mock the interaction here since we need to wire up the full chat flow.
      
      // In a real app:
      // 1. Check if active conversation exists
      // 2. If not, POST /api/conversations
      // 3. POST /api/conversations/:id/messages with streaming
      
      // Simulating network delay for effect
      setTimeout(() => {
        let response = "";
        if (userMessage.toLowerCase().includes("price")) {
          response = `The current market price for Paddy in Tirunelveli is ₹2,450/quintal. Prices are trending upwards by 2.5% this week due to high demand. I recommend SELLING 50% of your stock now.`;
        } else if (userMessage.toLowerCase().includes("pest") || userMessage.toLowerCase().includes("bug")) {
          response = `Based on the humid weather (65% humidity), your crops might be susceptible to fungal infections. I recommend checking for leaf spots. If found, apply Neem oil solution (3%).`;
        } else {
          response = `I understand you're asking about "${userMessage}". Could you specify if this is related to crop health, market prices, or weather patterns?`;
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error("Failed to send message", error);
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="h-[calc(100vh-2rem)] flex flex-col max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-primary">{t('advisory')}</h1>
          <p className="text-muted-foreground">AI-powered agricultural assistance tailored to your farm.</p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-lg rounded-2xl">
          <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
            <div className="space-y-6 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className={`h-10 w-10 border-2 ${msg.role === 'assistant' ? 'bg-primary/10 border-primary/20' : 'bg-secondary border-secondary-foreground/10'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="flex items-center justify-center w-full h-full text-primary">
                        <Bot className="h-6 w-6" />
                      </div>
                    ) : (
                      <AvatarImage src={user?.profileImageUrl} />
                    )}
                    <AvatarFallback>{msg.role === 'assistant' ? 'AI' : 'ME'}</AvatarFallback>
                  </Avatar>
                  
                  <div className={`rounded-2xl p-4 max-w-[80%] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/50 text-foreground rounded-tl-none border'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                   <Avatar className="h-10 w-10 border-2 bg-primary/10 border-primary/20">
                    <div className="flex items-center justify-center w-full h-full text-primary">
                      <Bot className="h-6 w-6" />
                    </div>
                  </Avatar>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Analyzing farm data...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatPlaceholder')}
                className="flex-1 rounded-xl border-primary/20 focus-visible:ring-primary"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-xl h-10 w-10 shrink-0 shadow-md">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </SidebarLayout>
  );
}
