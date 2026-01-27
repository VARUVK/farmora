import { useState, useRef, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-farm-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Advisory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${user?.firstName || 'Farmer'}! I can help you with crop advice, pest control, or market trends for ${profile?.crops?.join(', ') || 'your crops'}. What's on your mind?` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      // In a real app, we would use an SSE hook to stream from /api/conversations/:id/messages
      // For this demo, we'll simulate the backend streaming logic with deterministic advisory
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Chat about ${userMessage.slice(0, 20)}` })
      });
      
      if (!response.ok) throw new Error("Failed to start conversation");
      const conversation = await response.json();

      // Simulate streaming interaction with deterministic logic injected
      const msgResponse = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: userMessage,
          crop: profile?.crops?.[0] || 'Wheat',
          state: profile?.state || 'Punjab',
          district: profile?.district || 'Ludhiana'
        })
      });

      if (!msgResponse.ok) throw new Error("Failed to fetch advisory");

      // Simple streaming simulation for the UI
      const reader = msgResponse.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              assistantMessage += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].content = assistantMessage;
                return updated;
              });
            }
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to send message", error);
      toast({
        title: "Error",
        description: "Failed to get AI advisory. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="h-[calc(100vh-2rem)] flex flex-col max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">{t('advisory')}</h1>
            <p className="text-muted-foreground">AI-powered agricultural assistance tailored to your farm.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-700 text-xs">
            <Info className="h-4 w-4" />
            Advice is not a guarantee.
          </div>
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
                      <AvatarImage src={user?.profileImageUrl || undefined} />
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
