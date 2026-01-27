import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useLanguage } from "@/hooks/use-language";
import { useProfile, useUpdateProfile } from "@/hooks/use-farm-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ShieldCheck } from "lucide-react";

// Simplified schema matching the backend partial update
const profileSchema = z.object({
  role: z.enum(["farmer", "trader", "admin"]),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  crops: z.array(z.string()).min(1, "Select at least one crop"),
  consentToShareContact: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const availableCrops = ["Paddy", "Wheat", "Maize", "Cotton", "Sugarcane", "Pulses", "Groundnut", "Turmeric"];

export default function Profile() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: "farmer",
      state: "",
      district: "",
      crops: [],
      consentToShareContact: false,
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        role: profile.role as any,
        state: profile.state || "",
        district: profile.district || "",
        crops: profile.crops || [],
        consentToShareContact: (profile.metadata as any)?.consentToShareContact || false,
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const { consentToShareContact, ...rest } = values;
      await updateProfile.mutateAsync({
        ...rest,
        metadata: { 
          ...(profile?.metadata as any || {}),
          consentToShareContact 
        }
      });
      toast({
        title: "Profile Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">{t('profile')}</h1>
          <p className="text-muted-foreground">Manage your account and farm preferences.</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Avatar className="h-20 w-20 border-4 border-background shadow-md">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {user?.firstName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user?.firstName} {user?.lastName}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={form.watch("role")} 
                    onValueChange={(val: any) => form.setValue("role", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="trader">Trader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Select 
                    value={form.watch("state")} 
                    onValueChange={(val) => form.setValue("state", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="Punjab">Punjab</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.state && (
                    <p className="text-xs text-destructive">{form.formState.errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Input {...form.register("district")} placeholder="e.g. Tirunelveli" />
                   {form.formState.errors.district && (
                    <p className="text-xs text-destructive">{form.formState.errors.district.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Your Crops (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availableCrops.map((crop) => (
                    <div key={crop} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        id={crop} 
                        checked={form.watch("crops")?.includes(crop)}
                        onCheckedChange={(checked) => {
                          const current = form.getValues("crops") || [];
                          if (checked) {
                            form.setValue("crops", [...current, crop]);
                          } else {
                            form.setValue("crops", current.filter(c => c !== crop));
                          }
                        }}
                      />
                      <label
                        htmlFor={crop}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                      >
                        {crop}
                      </label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.crops && (
                  <p className="text-xs text-destructive">{form.formState.errors.crops.message}</p>
                )}
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-start space-x-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <Checkbox 
                    id="consentToShareContact" 
                    checked={form.watch("consentToShareContact")}
                    onCheckedChange={(checked) => form.setValue("consentToShareContact", !!checked)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="consentToShareContact" className="text-blue-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Consent to share contact details
                    </Label>
                    <p className="text-xs text-blue-700/70">
                      When enabled, verified traders can see your contact number to discuss deals. Your exact location remains private.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
