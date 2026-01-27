export { setupAuth, isAuthenticated, getSession, requireRole, requireFarmer, requireTrader, requireAdmin } from "./replitAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
