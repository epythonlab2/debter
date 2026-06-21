export interface UserProfile {
  id: string;
  full_name: string; // Cleaned up comma typo to semicolon
  identifier: string;
  email: string | null;
  password?: string;
  role: 'super_admin' | 'admin' | 'sales';
  shop_id: string | null;
  businessName?: string | null;
  approved: boolean;
  createdBy?: string;
  location?: string | null;
  must_change_password?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  ownerId: string | null;
}

export interface Item {
  id: string;
  item_name: string;
  quantity: number; // Cleaned up comma typo to semicolon
  default_price: number;
  shop_id: string;
}

export interface Sale {
  id: string | number;
  item_id: string;
  item_name?: string;
  price_sold: number;
  quantity: number;
  sale_date: string;
  shop_id: string;
  paymentMethod?: string;
  payment_method?: string;
  dubeId?: string | null;
  
  // =========================================================================
  // --- ANALYTICS ENRICHMENT FIELDS (Added for Hook Compatibility) ----------
  // =========================================================================
  dube_id?: string | number;
  price?: number;
  unit_price?: number;
  total_price?: number; 
  amount?: number;       
  subtotal?: number;     
  status?: string;
  is_paid?: boolean;
  created_at?: string;
  date?: string;
  item?: { price?: number; cost?: number; name?: string }; 

  // =========================================================================
  // --- AUDIT & RELATION FIELD SIGNATURES FOR SALESPERSON ---
  // =========================================================================
  recordedBy?: string;              
  recorded_by?: string | {         
    id: string;
    full_name: string;
    identifier: string;
    email: string | null;
    role: string;
  } | null;
  recorded_by_full_name?: string | null; 
  
  users?: {
    full_name: string;
  };
  user_full_name?: string; 
  
  [key: string]: any; 
}

export interface DubeRecord {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  amount: number;
  status: 'paid' | 'unpaid';
  sale_id: string;
  shop_id: string;
  created_at: string;
}

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}
