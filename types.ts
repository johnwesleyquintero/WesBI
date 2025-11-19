

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

  // --- MFI Integration Fields ---
  inboundWorking?: number;
  inboundShipped?: number;
  inboundReceiving?: number;
  reservedQuantity?: number;
  
  // --- Logistics & Urgency Metrics ---
  netAvailableStock?: number; // (Fulfillable + Inbound) - Reserved
  daysOfCover?: number; // Net Stock / Daily Sales
  urgencyScore?: number; // (SellThrough * DailySales) - Net Stock
  urgencyStatus?: 'Critical' | 'Warning' | 'Healthy';

  // For comparison
  inventoryChange?: number;
  shippedChange?: number;
  ageChange?: number;
  riskScoreChange?: number;
  velocityTrend?: number; // NEW
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

export interface SortCriterion {
  key: keyof ProductData;
  direction: 'asc' | 'desc';
}

export type SortConfig = SortCriterion[];

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

// --- Mission Control Types ---
export interface MissionTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface MissionKPI {
  name: string;
  values: { snapshotName: string; value: number }[];
}

export interface Mission {
  id: string;
  goal: string;
  playbook: string; // The raw markdown
  status: 'active' | 'completed' | 'aborted';
  createdAt: string;
  kpi: MissionKPI;
  tasks: MissionTask[];
}


// Global declarations for CDN libraries
declare global {
  interface Window {
    Papa: any;
    Recharts: any;
    React: any;
    ReactDOM: any;
    marked: any;
  }
}