// src/core/services/dbService.ts
import { supabase } from "../../utils/supabaseClient";
import { UserProfile, Shop, Item, Sale, DubeRecord, PurchaseRecord } from "../../types";
import { InsertSalePayload, InsertPurchasePayload, PurchaseReceipt } from "../../types/payLoad";

// Explicit Types & Payloads
export interface GlobalBroadcastPayload {
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}


/**
 * Core Data Access Object (DAO) providing synchronized persistence services 
 * between the application client and the Supabase PostgreSQL instance.
 */
export const dbService = {
  
  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: SHOPS ---
  // =========================================================================

  async fetchShops(): Promise<Shop[]> {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("name", { ascending: true });
      
    if (error) throw error;
    
    return (data || []).map(s => ({
      id: s.id,
      name: s.name,
      location: s.location,
      ownerId: s.owner_id || null,
      owner_id: s.owner_id || null
    }));
  },

  async createShop(shop: { id?: string; name: string; location: string; ownerId: string | null }): Promise<Shop> {
    const { data, error } = await supabase
      .from("shops")
      .insert([{
        id: shop.id || crypto.randomUUID(), 
        name: shop.name,
        location: shop.location,
        owner_id: shop.ownerId 
      }])
      .select()
      .single();
      
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      location: data.location,
      ownerId: data.owner_id || null
    };
  },

  async deleteShop(shopId: string): Promise<void> {
    const { error } = await supabase.from('shops').delete().eq('id', shopId);
    if (error) throw new Error(error.message || "Failed to delete shop.");
  },

  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: ITEMS / INVENTORY ---
  // =========================================================================

  async fetchItems(shopId?: string): Promise<Item[]> {
    let query = supabase
      .from("items")
      .select("*")
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (shopId && shopId !== 'all' && shopId !== 'undefined') {
      query = query.eq("shop_id", shopId);
    }
    
    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(i => ({
      id: i.id,
      item_name: i.item_name,
      itemName: i.item_name,
      default_price: Number(i.default_price || 0),
      shop_id: i.shop_id,
      quantity: Number(i.quantity || 0) 
    }));
  },

  async createItem(
    item: Omit<Item, 'id' | 'quantity' | 'shop_id'> & { 
      id?: string; 
      quantity?: number; 
      itemName?: string;
      shop_id?: string | null;
    }
  ): Promise<Item> {
    const targetId = item.id || crypto.randomUUID();
    const resolvedName = item.item_name || item.itemName || "Unnamed SKU";
    const resolvedPrice = Number(item.default_price || 0);

    const { error } = await supabase
      .from("items")
      .insert([{
        id: targetId,
        item_name: resolvedName, 
        default_price: resolvedPrice,
        shop_id: item.shop_id || null,
        quantity: Number(item.quantity || 0)
      }]);

    if (error) throw error;
    
    return {
      id: targetId,
      item_name: resolvedName,
      default_price: resolvedPrice,
      shop_id: item.shop_id || "", 
      quantity: Number(item.quantity || 0)
    };
  },
  
  async updateItem(id: string, updates: { item_name: string; default_price: number; quantity: number }): Promise<void> {
    const { error } = await supabase
      .from("items")
      .update({
        item_name: updates.item_name,
        default_price: Number(updates.default_price),
        quantity: Number(updates.quantity),
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) throw error;
  },

  async updateItemQuantity(itemId: string, newQty: number): Promise<void> {
    const { error } = await supabase
      .from('items')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) throw error;
  },

  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: PURCHASES / INVENTORY RESTOCK ---
  // =========================================================================

/**
 * Fetches historical restock/purchase entries with their line items.
 * Accepts optional parameters for shop filtering, date range, and row limits.
 * Returns a flattened array of PurchaseReceipt records.
 */
async fetchPurchases(options?: {
  shopId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<PurchaseReceipt[]> {
  const { shopId, startDate, endDate, limit = 100 } = options || {};

  let query = supabase
    .from("purchases")
    .select(`
      *,
      purchase_items (
        id,
        item_id,
        quantity,
        unit_cost,
        total_cost,
        unit_of_measurement,
        items (
          item_name
        )
      )
    `)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (shopId && shopId !== 'all' && shopId !== 'undefined') {
    query = query.eq("shop_id", shopId);
  }

  if (startDate) {
    query = query.gte("purchase_date", startDate);
  }
  if (endDate) {
    const formattedEndDate = endDate.includes("T") ? endDate : `${endDate}T23:59:59`;
    query = query.lte("purchase_date", formattedEndDate);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cleanDate = (dateVal: any): string => {
    if (!dateVal) return '';
    const str = String(dateVal).trim();
    return str.split('T')[0].split(' ')[0];
  };

  const flattenedRecords: PurchaseReceipt[] = [];

  (data || []).forEach((purchase: any) => {
    const formattedDate = cleanDate(purchase.purchase_date);

    const taxHeaderData = {
      subtotal: Number(purchase.subtotal || 0),
      vat_amount: Number(purchase.vat_amount || 0),
      withholding_amount: Number(purchase.withholding_amount || 0),
      total_amount: Number(purchase.total_amount || 0),
      is_vat_applied: Boolean(purchase.is_vat_applied || Number(purchase.vat_amount) > 0),
      is_withholding_applied: Boolean(purchase.is_withholding_applied || Number(purchase.withholding_amount) > 0),
      invoice_ref: purchase.invoice_ref || null,
      payment_status: (purchase.payment_status || 'paid') as 'paid' | 'credit' | 'partial',
    };

    if (purchase.purchase_items && purchase.purchase_items.length > 0) {
      purchase.purchase_items.forEach((itemLine: any) => {
        flattenedRecords.push({
          id: purchase.id,
          item_id: itemLine.item_id,
          item_name: itemLine.items?.item_name || 'Unknown SKU',
          quantity: Number(itemLine.quantity || 0),
          cost_price: Number(itemLine.unit_cost || 0),
          total_cost: Number(itemLine.total_cost || 0),
          purchase_date: formattedDate,
          shop_id: purchase.shop_id,
          unit_of_measurement: itemLine.unit_of_measurement || 'Pcs',
          supplier_name: purchase.vendor_name || purchase.supplier_name || null,
          recorded_by: purchase.recorded_by || null,
          created_at: purchase.created_at,
          ...taxHeaderData
        });
      });
    } else {
      flattenedRecords.push({
        id: purchase.id,
        item_id: '',
        item_name: 'No items',
        quantity: 0,
        cost_price: 0,
        total_cost: Number(purchase.total_amount || 0),
        purchase_date: formattedDate,
        shop_id: purchase.shop_id,
        unit_of_measurement: 'Pcs',
        supplier_name: purchase.vendor_name || purchase.supplier_name || null,
        recorded_by: purchase.recorded_by || null,
        created_at: purchase.created_at,
        ...taxHeaderData
      });
    }
  });

  return flattenedRecords;
},

 /**
   * Records a complete multi-line restock transaction with tax metadata:
   * 1. Inserts parent header into `purchases`
   * 2. Inserts line items into `purchase_items` (SQL trigger `trg_purchase_item_restock` updates stock & cost)
   */
  async insertPurchase(payload: InsertPurchasePayload): Promise<void> {
    const purchaseId = payload.id || crypto.randomUUID();
    const purchaseDate = payload.purchase_date || new Date().toISOString().split('T')[0];

    // 1. Create Purchase Header
    const { error: headerErr } = await supabase
      .from("purchases")
      .insert([{
        id: purchaseId,
        shop_id: payload.shop_id,
        vendor_name: payload.vendor_name || "General Vendor",
        subtotal: payload.subtotal,
        vat_amount: payload.vat_amount || 0.00,
        withholding_amount: payload.withholding_amount || 0.00,
        total_amount: payload.total_amount,
        is_vat_applied: payload.is_vat_applied || false,
        is_withholding_applied: payload.is_withholding_applied || false,
        purchase_date: purchaseDate,
        recorded_by: payload.recorded_by || null
      }]);

    if (headerErr) throw headerErr;

    // 2. Prepare and Insert Line Items into `purchase_items`
    const lineItems = payload.items.map((line) => ({
      id: crypto.randomUUID(),
      purchase_id: purchaseId,
      item_id: line.item_id,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      total_cost: line.total_cost,
      unit_of_measurement: line.unit_of_measurement || 'Pcs'
    }));

    const { error: itemsErr } = await supabase
      .from("purchase_items")
      .insert(lineItems);

    if (itemsErr) {
      // Rollback header insertion if line items fail
      await supabase.from("purchases").delete().eq("id", purchaseId);
      throw itemsErr;
    }
  },

  /**
   * Deletes a purchase record by ID.
   * Due to `ON DELETE CASCADE` in SQL, deleting from `purchases` automatically deletes 
   * all related `purchase_items`. The database trigger `trg_purchase_item_revert_stock` 
   * will handle stock reduction automatically on delete.
   */
  async deletePurchase(purchaseId: string) {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', purchaseId);

    if (error) throw error;
    return true;
  },
  

  // =========================================================================
  // --- TRANSACTIONAL LOGGING SERVICES: SALES & CREDIT (DUBE) ---
  // =========================================================================

  async fetchSales(shopId?: string): Promise<Sale[]> {
    let query = supabase
      .from("sales")
      .select(`
        *,
        items (
          item_name
        ),
        recorded_by (
          id,
          full_name,
          identifier,
          email,
          role
        )
      `)
      .order("sale_date", { ascending: false });
      
    if (shopId && shopId !== 'all' && shopId !== 'undefined') {
      query = query.eq("shop_id", shopId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(s => ({
      id: s.id,
      item_id: s.item_id,
      item_name: s.items?.item_name || s.item_name || s.custom_item_name || 'Generic Item', 
      quantity: s.quantity,
      price_sold: Number(s.price_sold || 0),
      sale_date: s.sale_date,
      shop_id: s.shop_id,
      recordedBy: s.recorded_by?.full_name || s.recorded_by || '', 
      recorded_by: s.recorded_by || null,
      recorded_by_full_name: s.recorded_by?.full_name || null,
      paymentMethod: s.payment_method || 'cash', 
      payment_method: s.payment_method || 'cash', 
      dubeId: s.dube_id || null,
      dube_id: s.dube_id || null
    }));
  },

  async insertSaleWithDube(
    saleData: InsertSalePayload, 
    dubeData?: { buyer_name: string; buyer_phone: string }
  ): Promise<void> {
    const generatedSaleId = saleData.id || crypto.randomUUID();
    const cleanMethod = (saleData.payment_method || saleData.paymentMethod || 'cash');

    const insertPayload = {
      id: generatedSaleId,
      item_id: saleData.item_id || null,
      quantity: Number(saleData.quantity),
      price_sold: Number(saleData.price_sold),
      sale_date: saleData.sale_date,
      shop_id: saleData.shop_id,
      recorded_by: saleData.recordedBy || null,
      payment_method: cleanMethod
    };

    const { error: saleErr } = await supabase
      .from("sales")
      .insert([insertPayload]);

    if (saleErr) throw saleErr;

    if (cleanMethod.toLowerCase().trim() === "dube" && dubeData) {
      try {
        const totalAmount = Number(saleData.quantity ?? 0) * Number(saleData.price_sold ?? 0);
        const generatedDubeId = crypto.randomUUID();

        const { error: dubeErr } = await supabase.from("dube_records").insert([{
          id: generatedDubeId,
          buyer_name: dubeData.buyer_name,
          buyer_phone: dubeData.buyer_phone,
          amount: totalAmount,
          status: "unpaid",
          sale_id: generatedSaleId,
          shop_id: saleData.shop_id
        }]);

        if (dubeErr) throw dubeErr;

        const { error: linkErr } = await supabase
          .from("sales")
          .update({ dube_id: generatedDubeId })
          .eq("id", generatedSaleId);

        if (linkErr) throw linkErr;
      } catch (error) {
        await this.deleteSale(generatedSaleId);
        throw error;
      }
    }
  },
  
  async insertCustomSaleWithDube(
    salePayload: {
      item_name: string;
      quantity: number;
      price_sold: number;
      sale_date: string;
      shop_id: string;
      paymentMethod: 'cash' | 'transfer' | 'dube';
      recordedBy: string;
    },
    dubePayload?: { buyer_name: string; buyer_phone: string }
  ): Promise<void> {
    const normalizedName = salePayload.item_name.trim();
    let resolvedItemId: string;

    const { data: matchedItems, error: fetchError } = await supabase
      .from('items')
      .select('id')
      .eq('shop_id', salePayload.shop_id)
      .ilike('item_name', normalizedName);

    if (fetchError) throw fetchError;

    if (matchedItems && matchedItems.length > 0) {
      resolvedItemId = matchedItems[0].id;
    } else {
      resolvedItemId = crypto.randomUUID();
      const { error: itemError } = await supabase
        .from('items')
        .insert({
          id: resolvedItemId, 
          item_name: normalizedName,
          quantity: 0, 
          default_price: salePayload.price_sold,
          shop_id: salePayload.shop_id
        });

      if (itemError) throw itemError;
    }

    const completeSalePayload: InsertSalePayload = {
      item_id: resolvedItemId,
      item_name: normalizedName,
      custom_item_name: normalizedName, 
      quantity: salePayload.quantity,
      price_sold: salePayload.price_sold,
      sale_date: salePayload.sale_date,
      shop_id: salePayload.shop_id,
      paymentMethod: salePayload.paymentMethod,
      recordedBy: salePayload.recordedBy
    };

    await this.insertSaleWithDube(completeSalePayload, dubePayload);
  },

  async deleteSale(saleId: string): Promise<void> {
    const { error } = await supabase.from("sales").delete().eq("id", saleId);
    if (error) throw new Error(error.message || "Failed to remove sale entry.");
  },

  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: CREDIT (DUBE LEDGER) ---
  // =========================================================================

  async fetchDubeRecords(shopId?: string): Promise<DubeRecord[]> {
    let query = supabase
      .from("dube_records")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (shopId && shopId !== 'all' && shopId !== 'undefined') {
      query = query.eq("shop_id", shopId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      sale_id: d.sale_id,
      saleId: d.sale_id,
      buyer_name: d.buyer_name,
      buyerName: d.buyer_name,
      buyer_phone: d.buyer_phone,
      buyerPhone: d.buyer_phone,
      amount: Number(d.amount || 0),
      status: d.status,
      shop_id: d.shop_id,
      created_at: d.created_at
    }));
  },

  async settleDubeDebt(dubeId: string): Promise<void> {
    const { error } = await supabase
      .from("dube_records")
      .update({ status: "paid" })
      .eq("id", dubeId);

    if (error) throw error;
  },

  // =========================================================================
  // --- RETRIEVAL & AUTH SERVICES: USER PROFILES ---
  // =========================================================================
  
  async updateUserApproval(userId: string, isApproved: boolean): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ approved: isApproved })
      .eq("id", userId);

    if (error) throw error;
  },
  
  async updateUserPasswordPermission(userId: string, forceChange: boolean): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ must_change_password: forceChange })
      .eq("id", userId);

    if (error) throw error;
  },

  async fetchUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("identifier", { ascending: true });
      
    if (error) throw error;
    
    return (data || []).map(u => ({
      id: u.id,
      full_name: u.full_name,           
      identifier: u.identifier,
      email: u.email,
      role: u.role,
      shop_id: u.shop_id,
      businessName: u.business_name || '', 
      business_name: u.business_name || '',
      approved: u.approved,
      createdBy: u.created_by,
      created_by: u.created_by,
      must_change_password: !!u.must_change_password
    }));
  },

  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: USER FEEDBACK ---
  // =========================================================================

  async submitFeedback(feedbackText: string, userId?: string | null): Promise<void> {
    if (!feedbackText.trim()) throw new Error("Feedback cannot be empty.");

    const cleanUserId = userId && userId.trim() !== "" ? userId : null;

    const { error } = await supabase
      .from("feedback")
      .insert([{
        feedback: feedbackText.trim(),
        user_id: cleanUserId 
      }]);

    if (error) throw error;
  },
  
  async fetchUserFeedbackLogs() {
    const { data, error } = await supabase
      .from("view_user_feedback")
      .select("*")
      .order("received_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      feedbackId: row.feedback_id,
      userId: row.user_id,
      fullName: row.full_name || "Anonymous User",
      businessName: row.business_name || "N/A",
      role: row.role || "N/A",
      feedback: row.feedback,
      receivedAt: row.received_at,
      isArchived: !!row.is_archived 
    }));
  },

  async archiveUserFeedback(feedbackId: string) {
    const { error } = await supabase
      .from('feedback') 
      .update({ is_archived: true })
      .eq('id', feedbackId);

    if (error) throw error;
  },
  
  async createGlobalBroadcast(payload: GlobalBroadcastPayload): Promise<void> {
    const { error } = await supabase
      .from('global_broadcasts')
      .insert([{ 
        message: payload.message, 
        severity: payload.severity, 
        created_at: payload.createdAt 
      }]);

    if (error) throw error;
  },

  subscribeToGlobalBroadcasts(callback: (broadcast: { id: string; message: string; severity: string; createdAt: string }) => void) {
    const subscription = supabase
      .channel('realtime_global_broadcasts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_broadcasts' },
        (payload) => {
          const record = payload.new as Record<string, any>;
          callback({
            id: String(record.id),
            message: record.message,
            severity: record.severity,
            createdAt: record.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
  
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },
  
  // =========================================================================
  // --- USER SELF-SERVICE MUTATIONS ---
  // =========================================================================

  async updateUserProfile(
    userId: string, 
    data: { fullName: string; shopName: string; email: string; location: string }
  ): Promise<UserProfile> {
    if (!userId) throw new Error("Cannot update profile: Missing user identifier context.");

    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update({
        full_name: data.fullName.trim(),
        business_name: data.shopName.trim(),
        email: data.email.trim().toLowerCase()
      })
      .eq("id", userId)
      .select()
      .single();

    if (userError) throw userError;

    if (updatedUser.shop_id) {
      const { error: shopError } = await supabase
        .from("shops")
        .update({
          name: data.shopName.trim(), 
          location: data.location.trim() 
        })
        .eq("id", updatedUser.shop_id);

      if (shopError) throw shopError;
    }

    return {
      id: updatedUser.id,
      full_name: updatedUser.full_name,           
      identifier: updatedUser.identifier,
      email: updatedUser.email,
      role: updatedUser.role,
      shop_id: updatedUser.shop_id,
      businessName: updatedUser.business_name || '', 
      location: data.location.trim(),
      approved: updatedUser.approved,
      createdBy: updatedUser.created_by,
      must_change_password: !!updatedUser.must_change_password
    };
  },

  async updateAccountPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!userId || !currentPassword || !newPassword || newPassword.length < 4) {
      throw new Error("Invalid parameters provided for password change.");
    }

    const { error } = await supabase.rpc('change_user_password', {
      p_user_id: userId,
      p_current_password: currentPassword,
      p_new_password: newPassword
    });

    if (error) throw new Error(error.message || "Database update failed.");
  }
};