import { useQuery } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Tractor, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FarmerList() {
  const { data: farmers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/farmers"],
  });

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">Discover Farmers</h1>
            <p className="text-muted-foreground mt-1">Browse farmers based on crop availability and location.</p>
          </div>
        </div>

        {!farmers || farmers.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
            <Tractor className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">No farmers found</h3>
            <p className="text-muted-foreground">Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {farmers.map((farmer) => (
              <Card key={farmer.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {farmer.user?.firstName || farmer.user?.username} {farmer.user?.lastName || ""}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="h-3 w-3" />
                        {farmer.district || "Unknown District"}, {farmer.state || "Unknown State"}
                      </CardDescription>
                    </div>
                    {farmer.metadata?.landSize && (
                      <Badge variant="outline" className="bg-white">
                        {farmer.metadata.landSize} Acres
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Crops Grown</h4>
                      <div className="flex flex-wrap gap-2">
                        {farmer.crops && farmer.crops.length > 0 ? (
                          farmer.crops.map((crop: string) => (
                            <Badge key={crop} className="bg-green-100 text-green-800 hover:bg-green-200 border-none">
                              {crop}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No crops listed</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        {farmer.metadata?.consentToShareContact && farmer.metadata?.phone ? (
                          <>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Phone className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-700">{farmer.metadata.phone}</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Contact hidden</span>
                        )}
                      </div>
                      
                      <Link href={`/messages?userId=${farmer.userId}`}>
                        <Button size="sm" className="gap-2 shrink-0">
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
