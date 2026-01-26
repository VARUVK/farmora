import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useLanguage } from "@/hooks/use-language";
import { useMarketPrices } from "@/hooks/use-farm-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PriceChart } from "@/components/PriceChart";

export default function Prices() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  
  // In a real app, these filters would pass to the query
  const { data: prices, isLoading } = useMarketPrices();

  // Mock filtering client-side for demo if API doesn't support search yet
  const filteredPrices = prices?.filter((p: any) => 
    p.crop.toLowerCase().includes(search.toLowerCase()) || 
    p.market.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">{t('prices')}</h1>
          <p className="text-muted-foreground">Real-time mandi prices across regions.</p>
        </div>

        {/* Featured Chart */}
        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/10">
          <CardContent className="p-6">
            <PriceChart cropName="Paddy (Common)" />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search crops or markets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-primary/20 focus-visible:ring-primary"
            />
          </div>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-full md:w-[200px] rounded-xl border-primary/20">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
              <SelectItem value="Punjab">Punjab</SelectItem>
              <SelectItem value="Maharashtra">Maharashtra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prices Table */}
        <Card className="overflow-hidden shadow-sm border-primary/10">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold text-primary">Crop</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Price (₹/q)</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPrices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No prices found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrices?.map((price: any) => (
                    <TableRow key={price.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{price.crop}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{price.market}</span>
                          <span className="text-xs text-muted-foreground">{price.district}, {price.state}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-lg font-semibold text-foreground">₹{price.price.toLocaleString()}</TableCell>
                      <TableCell>
                        {/* Mock trends for visuals */}
                        {price.id % 3 === 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <TrendingUp className="h-3 w-3" /> +1.2%
                          </Badge>
                        ) : price.id % 3 === 1 ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                            <TrendingDown className="h-3 w-3" /> -0.5%
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground gap-1">
                            <Minus className="h-3 w-3" /> Stable
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${price.confidenceScore > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="text-xs text-muted-foreground">{Math.round(price.confidenceScore * 100)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </SidebarLayout>
  );
}
