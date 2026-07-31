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
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  cost_price: number;
  total_cost: number;
  purchase_date: string;
  shop_id: string;
  supplier_name: string | null;
  recorded_by: string | null;
  created_at: string;

  // Tax compliance metadata fields
  subtotal?: number;
  vat_amount?: number;
  withholding_amount?: number;
  total_amount?: number;
  is_vat_applied?: boolean;
  is_withholding_applied?: boolean;
}