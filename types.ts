
export interface ProductData {
  sku: string;
  asin: string;
  name: string;
  condition: string;
  available: number;
  pendingRemoval: number;
  invAge0to90: number;
  invAge91to180: number;
  invAge181to270: number;
  invAge271to365: number;
  invAge365plus: number;
  totalInvAgeDays: number; // calculated field
  shippedT30: number;
  sellThroughRate: number; // calculated field
  recommendedAction: string;
  riskScore: number; // calculated field
  category: string;
  restockRecommendation?: number; // calculated field
  // For comparison
  inventoryChange?: number;
  shippedChange?: number;
  ageChange?: number;
  riskScoreChange?: number;
}

export interface Stats {
  totalProducts: number;
  totalAvailable: number;
  totalPending: number;
  totalShipped: number;
  avgDaysInventory: number;
  sellThroughRate: number;
  atRiskSKUs: number;
}

export interface Snapshot {
  name: string;
  data: ProductData[];
  timestamp: string;
  stats: Stats;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
  progress: number;
}

export interface Filters {
  search: string;
  condition: string;
  action: string;
  age: string;
  category: string;
  minStock: string;
  maxStock: string;
  stockStatus: string;
}

export interface ForecastSettings {
  leadTime: number;
  safetyStock: number;
  demandForecast: number;
}

export interface SortConfig {
  key: keyof ProductData | null;
  direction: 'asc' | 'desc';
}

// Global declarations for CDN libraries
declare global {
  interface Window {
    Papa: any;
    Recharts: any;
    React: any;
  }
}