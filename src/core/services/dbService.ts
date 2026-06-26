// src/core/services/dbService.ts
import { supabase } from "../../utils/supabaseClient";
import { UserProfile, Shop, Item, Sale, DubeRecord } from "../../types";

// Define the interface shape matching the frontend form payload
export interface GlobalBroadcastPayload {
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

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

/**
 * Core Data Access Object (DAO) providing synchronized persistence services 
 * between the application client and the Supabase PostgreSQL instance.
 */
export const dbService = {
  
  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: SHOPS ---
  // =========================================================================

  /**
   * Fetches all registered retail shop profiles from the infrastructure database.
   * Sorted alphabetically by shop name for easy administrative discovery.
   */
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

  /**
   * Provisions a new retail storefront instance in the system backend.
   */
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

  /**
   * Permanently removes a target retail shop profile by its unique identity key.
   */
  async deleteShop(shopId: string): Promise<void> {
    const { error } = await supabase.from('shops').delete().eq('id', shopId);
    if (error) throw new Error(error.message || "Failed to delete shop.");
  },

  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: ITEMS / INVENTORY ---
  // =========================================================================

  /**
   * Retrieves structural catalog items filtered by operational store allocations.
   * Prioritizes newly modified SKUs first so inventory restocks surface immediately.
   */
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

 /**
   * Commits a new SKU item entry safely into the active inventory table ledger.
   */
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
  
  /**
   * Commits updates to an existing SKU item entry matching the target identifier key.
   */
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

  /**
   * Deletes a structural inventory item configuration matching the unique target key.
   */
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) throw error;
  },

  // =========================================================================
  // --- TRANSACTIONAL LOGGING SERVICES: SALES & CREDIT (DUBE) ---
  // =========================================================================

  /**
   * Queries chronological ledger history entries of sales events, ordered newest first.
   */
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

  /**
   * Executes a multi-stage data write that links sales transactions with credit records.
   */
  async insertSaleWithDube(
    saleData: InsertSalePayload, 
    dubeData?: { buyer_name: string; buyer_phone: string }
  ): Promise<void> {
    const generatedSaleId = saleData.id || crypto.randomUUID();
    const cleanMethod = (saleData.payment_method || saleData.paymentMethod || 'cash');

    const insertPayload: Record<string, any> = {
      id: generatedSaleId,
      item_id: saleData.item_id || null,
      quantity: saleData.quantity,
      price_sold: saleData.price_sold,
      sale_date: saleData.sale_date,
      shop_id: saleData.shop_id,
      recorded_by: saleData.recordedBy || null,
      payment_method: cleanMethod
    };

    if (saleData.custom_item_name) {
      insertPayload.custom_item_name = saleData.custom_item_name;
    } else if (!saleData.item_id && saleData.item_name) {
      insertPayload.custom_item_name = saleData.item_name;
    }

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
        // Rollback strategy: Clean up rogue sales entry if child insertion fails
        await this.deleteSale(generatedSaleId);
        throw error;
      }
    }
  },
  
  /**
   * Automatically registers an unlisted variant item into inventory if missing,
   * then seamlessly binds the record to the active transaction table.
   */
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
    const fallbackItemId = crypto.randomUUID();

    const { error: itemError } = await supabase
      .from('items')
      .insert({
        id: fallbackItemId, 
        item_name: salePayload.item_name,
        quantity: 0, 
        default_price: salePayload.price_sold,
        shop_id: salePayload.shop_id
      });

    if (itemError) throw itemError;

    const completeSalePayload: InsertSalePayload = {
      item_id: fallbackItemId,
      item_name: salePayload.item_name,
      custom_item_name: salePayload.item_name, 
      quantity: salePayload.quantity,
      price_sold: salePayload.price_sold,
      sale_date: salePayload.sale_date,
      shop_id: salePayload.shop_id,
      paymentMethod: salePayload.paymentMethod,
      recordedBy: salePayload.recordedBy
    };

    await this.insertSaleWithDube(completeSalePayload, dubePayload);
  },

  /**
   * Permanently deletes a target sale transaction from the ledger records database.
   */
  async deleteSale(saleId: string): Promise<void> {
    const { error } = await supabase.from("sales").delete().eq("id", saleId);
    if (error) throw new Error(error.message || "Failed to remove sale entry.");
  },
  
  /**
   * Adjusts stock volumes following active sales transactions.
   */
  async updateItemQuantity(itemId: string, newQty: number): Promise<void> {
    const { error } = await supabase
      .from('items')
      .update({ quantity: newQty })
      .eq('id', itemId);

    if (error) throw error;
  },

  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: CREDIT (DUBE LEDGER) ---
  // =========================================================================

  /**
   * Queries customer credit balance accounts tracking outstanding debt profiles.
   */
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

  /**
   * Updates an outstanding credit balance account to "paid" status.
   */
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
  
  /**
   * Updates the approval status of a user profile.
   */
  async updateUserApproval(userId: string, isApproved: boolean): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ approved: isApproved })
      .eq("id", userId);

    if (error) throw error;
  },
  
  /**
   * Updates the forced password change permission status of an owner/operator user profile.
   */
  async updateUserPasswordPermission(userId: string, forceChange: boolean): Promise<void> {
    console.log(`Sending to DB -> ID: ${userId}, must_change_password: ${forceChange}`);
    
    const { data, error } = await supabase
      .from("users")
      .update({ must_change_password: forceChange })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Supabase returned an error:", error);
      throw error;
    }
    
    console.log("Database updated successfully. Returned row:", data);
  },

  /**
   * Fetches active registered user account profiles ordered alphabetically by identifier.
   */
  async fetchUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("identifier", { ascending: true });
      
    if (error) throw error;
    
    return (data || []).map(u => ({
      id: u.id,
      full_name: u.full_name,
      fullName: u.full_name,            
      identifier: u.identifier,
      email: u.email,
      role: u.role,
      shop_id: u.shop_id,
      businessName: u.business_name || '', 
      business_name: u.business_name || '',
      approved: u.approved,
      createdBy: u.created_by,
      created_by: u.created_by,
      password: u.password,
      must_change_password: !!u.must_change_password
    }));
  },
  

  // =========================================================================
  // --- RETRIEVAL & MUTATION SERVICES: USER FEEDBACK ---
  // =========================================================================

  /**
   * Commits an anonymous or authenticated user feedback logging string.
   */
  async submitFeedback(feedbackText: string, userId?: string | null): Promise<void> {
    if (!feedbackText.trim()) throw new Error("Feedback cannot be empty.");

    const cleanUserId = userId && userId.trim() !== "" ? userId : null;

    const { error } = await supabase
      .from("feedback")
      .insert([{
        feedback: feedbackText.trim(),
        user_id: cleanUserId 
      }]);

    if (error) {
      console.error("Supabase error caught directly inside dbService:", error);
      throw error;
    }
  },
  
  /**
   * Fetches full feedback log profiles joined with submitting user metadata via database view.
   */
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

  /**
   * Target the underlying base table directly for data state mutations.
   */
  async archiveUserFeedback(feedbackId: string) {
    const { error } = await supabase
      .from('feedback') 
      .update({ is_archived: true })
      .eq('id', feedbackId);

    if (error) throw error;
  },
  
  /**
   * Commits an administrative push alert directly to the global_broadcasts database table.
   */
  async createGlobalBroadcast(payload: GlobalBroadcastPayload): Promise<void> {
    try {
      const { error } = await supabase
        .from('global_broadcasts')
        .insert([{ 
          message: payload.message, 
          severity: payload.severity, 
          created_at: payload.createdAt 
        }]);

      if (error) throw error;

      console.log("Data row committed successfully into global_broadcasts table via Supabase Client.");

      if (typeof window !== 'undefined' && (window as any).__triggerBroadcastMock) {
        (window as any).__triggerBroadcastMock(payload);
      }
    } catch (error) {
      console.error("Database connection insertion transaction aborted:", error);
      throw error;
    }
  },

  /**
   * Sets up a real-time web socket listener directly on the global_broadcasts table.
   */
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
  
  /**
   * Updates the user's password directly via Supabase Auth.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },
  
  // =========================================================================
  // --- USER SELF-SERVICE MUTATIONS ---
  // =========================================================================

  /**
   * Updates the authenticated user's profile metadata across the users table,
   * and synchronizes the associated storefront operational parameters inside the shops table.
   */
  async updateUserProfile(
    userId: string, 
    data: { fullName: string; shopName: string; email: string; location: string }
  ): Promise<UserProfile> {
    if (!userId) throw new Error("Cannot update profile: Missing user identifier context.");

    // 1. Update ONLY fields that exist on the users table (location REMOVED here)
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

    if (userError) {
      console.error("Failed to commit user base records to database:", userError);
      throw userError;
    }

    // 2. Safely route the location to the shops table where it belongs
    if (updatedUser.shop_id) {
      const { error: shopError } = await supabase
        .from("shops")
        .update({
          name: data.shopName.trim(), 
          location: data.location.trim() 
        })
        .eq("id", updatedUser.shop_id);

      if (shopError) {
        console.warn(`User updated, but associated shop alignment failed to synchronize:`, shopError);
      }
    }

    // 3. Construct and map data state directly back to the app UI structures
    return {
      id: updatedUser.id,
      full_name: updatedUser.full_name,
      fullName: updatedUser.full_name,            
      identifier: updatedUser.identifier,
      email: updatedUser.email,
      role: updatedUser.role,
      shop_id: updatedUser.shop_id,
      businessName: updatedUser.business_name || '', 
      business_name: updatedUser.business_name || '',
      location: data.location.trim(), // 🟢 Directly returns the updated text to avoid showing blank
      approved: updatedUser.approved,
      createdBy: updatedUser.created_by,
      created_by: updatedUser.created_by,
      password: updatedUser.password,
      must_change_password: !!updatedUser.must_change_password
    };
  },
 /**
 * Updates a user's password directly inside the public users table.
 * Validates that the current password matches before applying changes.
 */
async updateAccountPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  if (!userId) {
    throw new Error("Cannot update credentials: Missing security identity context.");
  }
  if (!currentPassword) {
    throw new Error("You must provide your current password to make changes.");
  }
  if (!newPassword || newPassword.length < 4) {
    throw new Error("Password must meet structural rules (minimum 4 characters long).");
  }

  // 1. Fetch the user's current password from the database to verify it exists and matches
  const { data: userRow, error: fetchError } = await supabase
    .from("users")
    .select("password")
    .eq("id", userId)
    .single();

  if (fetchError || !userRow) {
    console.error("Failed to fetch user context for validation:", fetchError);
    throw new Error("User account not found.");
  }

  // 2. Validate that the typed current password matches the database record
  // (Note: Since you are bypassing GoTrue and storing plain strings/custom hashes, 
  // do a direct comparison or your custom decryption check here)
  if (userRow.password !== currentPassword) {
    throw new Error("The current password you entered is incorrect.");
  }

  // 3. 🟢 Current password is valid! Directly mutate the public table row
  const { error: dbError } = await supabase
    .from("users")
    .update({ 
      password: newPassword,
      must_change_password: false
    })
    .eq("id", userId);

  if (dbError) {
    console.error("Profile password mutation failed to persist:", dbError);
    throw new Error("Database update failed. Please check your connection and try again.");
  }
},

};
