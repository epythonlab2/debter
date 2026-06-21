// src/types/sales.ts
import { Sale, DubeRecord, Item, UserProfile } from './index';
import { ItemRecord } from './inventory';

export interface SalesTranslation {
  shopIdMissing: string;
  selectProductError?: string;
  quantityValidation?: string;
  stockShortageError?: string;
  saleSuccess?: string;
  [key: string]: any; // Backward compatible translation catch-all
}

export interface UseSalesProps {
  currentUser: UserProfile | null;
  items: ItemRecord[];
  sales: Sale[];
  dubeRecords: DubeRecord[];
  selectedShopFilter: string;
  syncCloudDatabases: () => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  lang: string;
  t: SalesTranslation; // Strong structural binding for translations
}

export interface UseSalesReturn {
  // Core State Bindings
  salePrice: string;
  setSalePrice: (val: string) => void;
  
  // Note: Standardized to string to match input fields & your hook's form state wrapper
  saleQty: string | number; 
  setSaleQty: (val: any) => void;
  
  customItemName: string;
  setCustomItemName: (val: string) => void;
  
  // Adjusted to allow general string matching or your specific union strings
  paymentMethod: string;
  setPaymentMethod: (val: any) => void;
  
  buyerName: string;
  setBuyerName: (val: string) => void;
  buyerPhone: string;
  setBuyerPhone: (val: string) => void;
  saleDate: string;
  setSaleDate: (val: string) => void;
  selectedItemId: string;
  setSelectedItemId: (val: string) => void;
  
  // Optional parameters if they are only used dynamically or in other configurations
  salesSearch?: string;
  setSalesSearch?: (val: string) => void;
  pageSize?: number;
  setPageSize?: (size: number) => void;

  // View Transformations and Calculations
  scopedSales?: Sale[];
  
  // 1. Match the exact function name used inside your hook:
  handleRecordSale: (e: React.FormEvent) => Promise<void>;
  
  // 2. ADD THIS MISSING PROPERTY RIGHT HERE:
  handleSettleDube: (dubeId: string | number) => Promise<void>;
}
