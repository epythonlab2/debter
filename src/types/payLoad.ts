export interface InsertSalePayload {
  id?: string;
  item_id?: string | null;
  item_name?: string;
  custom_item_name?: string;
  quantity: number;
  price_sold: number;
  sale_date: string;
  shop_id: string;
  recordedBy?: string;
  paymentMethod?: string;
  payment_method?: string;
}



export interface InsertPurchaseItemPayload {
  item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  unit_of_measurement?: string;
}

export interface InsertPurchasePayload {
  id?: string;
  shop_id: string;
  vendor_name?: string;
  subtotal: number;
  vat_amount?: number;
  withholding_amount?: number;
  total_amount: number;
  is_vat_applied?: boolean;
  is_withholding_applied?: boolean;
  purchase_date?: string;
  recorded_by?: string | null;
  items: InsertPurchaseItemPayload[];
}
export interface PurchaseReceipt {
  // Core Identifiers & Foreign Keys
  id: string;
  shop_id: string;
  item_id: string;
  recorded_by: string | null;

  // Transaction Details
  supplier_name: string | null;
  purchase_date: string; // ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
  created_at: string;

  // Item Details
  item_name: string;
  quantity: number;
  cost_price: number; // Unit cost price
  total_cost: number; // Line item total (quantity * cost_price)
  unit_of_measurement?: string;

  // Tax Compliance & Financial Breakdown
  subtotal?: number;
  vat_amount?: number;
  withholding_amount?: number;
  total_amount?: number;
  is_vat_applied?: boolean;
  is_withholding_applied?: boolean;

  // Invoice / Payment Tracking (Recommended Additions)
  invoice_ref?: string | null;
  payment_status?: 'paid' | 'credit' | 'partial';
}