import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useLanguage } from "@/hooks/use-language";
import { useProfile, useSimulations, useCreateSimulation } from "@/hooks/use-farm-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Calculator, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function Simulations() {
  const { t } = useLanguage();
  const { data: profile } = useProfile();
  const { data: simulations, isLoading: listLoading } = useSimulations();
  const createSimulation = useCreateSimulation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState("");

  const handleCreate = async () => {
    if (!crop || !quantity || !date || !profile) return;

    const quantityNum = Number(quantity);
    const saleDate = new Date(date);
    const today = new Date();
    
    // Logic: Seasonal adjustment based on month
    const month = saleDate.getMonth();
    // Simple seasonality factor (example: monsoon peaks or harvest dips)
    const seasonality = [0.9, 0.95, 1.1, 1.2, 1.15, 1.0, 0.9, 0.85, 0.9, 1.05, 1.1, 1.0][month];
    
    const basePrice = 2400; // Mandi base
    const priceStability = 0.95 + (Math.random() * 0.1); // Market volatility
    const predictedPrice = basePrice * seasonality * priceStability;
    
    // Weather risk reduction (simulated based on forecast distance)
    const daysOut = Math.floor((saleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weatherRiskFactor = daysOut > 30 ? 0.85 : 0.95; // Higher risk further out
    
    const totalRevenue = quantityNum * predictedPrice * weatherRiskFactor;
    const estimatedCost = quantityNum * 1450; // Input cost avg
    const profit = totalRevenue - estimatedCost;
    
    const risk = profit > 25000 ? "Low" : profit > 0 ? "Medium" : "High";

    try {
      await createSimulation.mutateAsync({
        userId: profile.userId,
        crop,
        inputs: { quantity: quantityNum, date, costPerQuintal: 1450 } as any,
        results: { 
          predictedPrice: Math.round(predictedPrice), 
          expectedProfit: Math.round(profit),
          riskLevel: risk,
          confidence: Math.round((daysOut > 30 ? 0.7 : 0.9) * 100) / 100 
        } as any
      });
      setIsDialogOpen(false);
      // Reset form
      setCrop("");
      setQuantity("");
      setDate("");
    } catch (error) {
      console.error("Failed to create simulation", error);
    }
  };

  const crops = profile?.crops || ["Paddy", "Wheat", "Cotton", "Maize"];

  return (
    <SidebarLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">{t('simulations')}</h1>
            <p className="text-muted-foreground">Project your earnings and analyze market risks.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg hover:shadow-xl transition-all gap-2">
                <Plus className="h-4 w-4" />
                {t('createSimulation')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('createSimulation')}</DialogTitle>
                <DialogDescription>
                  Enter your expected harvest details to get a profit forecast based on seasonal trends and weather risk.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="crop">Crop</Label>
                  <Select value={crop} onValueChange={setCrop}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((c: string) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity (Quintals)</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Expected Sale Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createSimulation.isPending}>
                  {createSimulation.isPending ? "Simulating..." : "Run Simulation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {listLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1,2,3].map(i => <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-2xl" />)}
           </div>
        ) : !simulations || (Array.isArray(simulations) && simulations.length === 0) ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Simulations Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first profit projection to get started.</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">Start Simulator</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(simulations) && simulations.map((sim: any) => (
              <Card key={sim.id} className="hover:shadow-lg transition-all duration-300 border-primary/10 group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">
                      {sim.crop}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(sim.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="flex items-baseline gap-1 text-2xl">
                    ₹{sim.results.expectedProfit.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">profit</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Predicted Price:</span>
                    <span className="font-medium">₹{sim.results.predictedPrice}/q</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Risk Level</span>
                      <span className={
                        sim.results.riskLevel === 'Low' ? 'text-green-600 font-medium' : 
                        sim.results.riskLevel === 'Medium' ? 'text-yellow-600 font-medium' : 
                        'text-red-600 font-medium'
                      }>{sim.results.riskLevel}</span>
                    </div>
                    <Progress value={
                       sim.results.riskLevel === 'Low' ? 20 : 
                       sim.results.riskLevel === 'Medium' ? 50 : 85
                    } className={`h-2 ${
                       sim.results.riskLevel === 'Low' ? '[&>div]:bg-green-500' : 
                       sim.results.riskLevel === 'Medium' ? '[&>div]:bg-yellow-500' : 
                       '[&>div]:bg-red-500'
                    }`} />
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="w-full pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Quantity: {sim.inputs.quantity}q</span>
                    <span>Sale: {new Date(sim.inputs.date).toLocaleDateString()}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
