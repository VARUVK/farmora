import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProfile, type InsertSimulation, type InsertNotification } from "@shared/schema";
import { getQueryFn, apiRequest, resolveUrl } from "@/lib/queryClient";

// === PROFILES ===
export function useProfile() {
  return useQuery({
    queryKey: [api.profiles.get.path],
    queryFn: async () => {
      const res = await fetch(resolveUrl(api.profiles.get.path), { credentials: "include" });
      if (res.status === 404) return null; // Handle not found gracefully
      if (!res.ok) throw new Error("Failed to fetch profile");
      return await res.json();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InsertProfile>) => {
      const res = await apiRequest("PUT", api.profiles.update.path, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.get.path] });
    },
  });
}

// === MARKET PRICES ===
export function useMarketPrices(filters?: { crop?: string; state?: string; district?: string }) {
  const queryKey = [api.marketPrices.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const path = filters 
        ? `${api.marketPrices.list.path}?${new URLSearchParams(filters as any).toString()}`
        : api.marketPrices.list.path;
      const res = await fetch(resolveUrl(path), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch prices");
      return await res.json();
    },
  });
}

// === SIMULATIONS ===
export function useSimulations() {
  return useQuery({
    queryKey: [api.simulations.list.path],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
}

export function useCreateSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSimulation) => {
      const res = await apiRequest("POST", api.simulations.create.path, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.simulations.list.path] });
    },
  });
}

// === NOTIFICATIONS ===
export function useNotifications() {
  return useQuery({
    queryKey: [api.notifications.list.path],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.notifications.markRead.path, { id });
      const res = await apiRequest("PATCH", url);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notifications.list.path] });
    },
  });
}
