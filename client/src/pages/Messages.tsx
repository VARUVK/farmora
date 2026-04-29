import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SidebarLayout } from "@/components/SidebarLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, UserCircle2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function Messages() {
  const { user } = useAuth();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialUserId = searchParams.get("userId");
  
  const [activeUser, setActiveUser] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery<{ messages: any[], users: any[] }>({
    queryKey: ["/api/user-messages"],
  });

  useEffect(() => {
    if (data?.users && initialUserId && !activeUser) {
      const selected = data.users.find(u => u.id === initialUserId);
      if (selected) setActiveUser(selected);
      // Wait, if starting chat with new user not in list yet, we might need a separate endpoint to fetch user details.
      // For now, if we don't have them in our history but we have initialUserId, we could mock a dummy user till the first message.
      if (!selected && initialUserId) {
        setActiveUser({ id: initialUserId, firstName: "New User", username: "New User", role: "Unknown" });
      }
    }
  }, [data, initialUserId, activeUser]);

  const sendMessage = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string, content: string }) => {
      const res = await apiRequest("POST", "/api/user-messages", { receiverId, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-messages"] });
      setMessage("");
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeUser) return;
    sendMessage.mutate({ receiverId: activeUser.id, content: message });
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <Skeleton className="h-[600px] w-full max-w-4xl rounded-2xl" />
        </div>
      </SidebarLayout>
    );
  }

  const users = data?.users || [];
  const messages = data?.messages || [];
  
  // Also include the mocked activeUser if they are not in the users array yet
  const displayUsers = [...users];
  if (activeUser && !displayUsers.find(u => u.id === activeUser.id)) {
    displayUsers.unshift(activeUser);
  }

  const activeMessages = messages
    .filter(m => 
      (m.senderId === activeUser?.id && m.receiverId === user?.id) || 
      (m.senderId === user?.id && m.receiverId === activeUser?.id)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] min-h-[600px] bg-card rounded-2xl shadow-sm border overflow-hidden flex">
        
        {/* Contact List */}
        <div className={`w-full md:w-80 border-r flex flex-col ${activeUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold px-2">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {displayUsers.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No active conversations yet
              </div>
            ) : (
              displayUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setActiveUser(u)}
                  className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors flex items-center gap-3 ${activeUser?.id === u.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="h-10 w-10 text-slate-400 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <UserCircle2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.firstName || u.username}</div>
                    <div className="text-xs text-muted-foreground capitalize">{u.role}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-slate-50/50 ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
          {!activeUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 h-full">
              <MessageCircle className="h-12 w-12 mb-4 text-slate-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 md:px-6 border-b flex items-center bg-card shadow-sm z-10 shrink-0 gap-3">
                <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setActiveUser(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 text-primary bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <UserCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{activeUser.firstName || activeUser.username}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{activeUser.role}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                    Start of conversation with {activeUser.firstName || activeUser.username}
                  </div>
                ) : (
                  activeMessages.map(msg => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMe 
                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                            : 'bg-white border rounded-bl-none shadow-sm'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-card border-t shrink-0">
                <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-muted/30"
                    disabled={sendMessage.isPending}
                  />
                  <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

// Ensure MessageCircle is correctly imported or fallback
import { MessageCircle } from "lucide-react";
