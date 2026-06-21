// src/core/services/auth.service.ts
import { supabase } from '../../utils/supabaseClient'; 
import { UserProfile } from '../../types';

/**
 * Registers a new business by creating a shop row and then an owner user profile
 */
export async function registerUser(profile: any) { // Switched to any temporarily to allow dual-case parsing safety
  let assignedShopId: string | null = null;

  // 1. If a business name is provided, create the shop entity first
  if (profile.businessName || profile.business_name) {
    const generatedShopId = `shp-${Date.now()}`;
    const cleanBusinessName = profile.businessName || profile.business_name;
    
    const { error: shopError } = await supabase
      .from('shops')
      .insert([
        {
          id: generatedShopId,
          name: cleanBusinessName,
          location: profile.location || null, // Safely stored inside the shops table
          owner_id: null // Kept null initially; will back-fill below once user is created
        }
      ]);

    if (shopError) throw shopError;
    assignedShopId = generatedShopId;
  }

  // 🟢 CASE NORMALIZATION GATES: Resolves frontend property model divergence
  const resolvedFullName = profile.fullName || profile.full_name || '';
  const resolvedBusinessName = profile.businessName || profile.business_name || null;
  const resolvedCreatedBy = profile.createdBy || profile.created_by || null;

  // 🛑 CRITICAL CLIENT GUARD: Intercept blank records before database roundtrip execution
  if (!resolvedFullName.trim()) {
    throw new Error('Registration Rejected: Full Name property missing or blank in processing payload.');
  }

  // 2. Register the user profile, linking it to the created shop
  const { error: userError } = await supabase
    .from('users')
    .insert([
      {
        id: profile.id || `usr-${Date.now()}`,
        identifier: profile.identifier,
        full_name: resolvedFullName.trim(),       // 🎯 SAFE: Guaranteed non-null clean string
        email: profile.email || null,
        password: profile.password,
        role: profile.role || 'owner',
        shop_id: assignedShopId || profile.shop_id || null, // Link to the fresh shop entity
        business_name: resolvedBusinessName,       // Audit trail snapshot
        approved: profile.approved !== undefined ? profile.approved : false,
        created_by: resolvedCreatedBy
      }
    ]);

  if (userError) throw userError;

  // 3. Back-fill owner tracking onto the shops table to link the circular relationship
  if (assignedShopId && profile.id) {
    await supabase
      .from('shops')
      .update({ owner_id: profile.id })
      .eq('id', assignedShopId);
  }

  return true;
}

/**
 * Authenticates credentials against the users table and resolves shop details relatonally
 */
export async function loginUser(identifier: string, password: string): Promise<UserProfile> {
  // 1. Fetch core user info
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('identifier', identifier)
    .eq('password', password)
    .maybeSingle();

  if (userError || !user) {
    throw new Error('Invalid credentials provided.');
  }

  let resolvedLocation: string | null = null;

  // 2. Relational Lookup: If the user belongs to a shop, extract location from 'shops' table
  if (user.shop_id) {
    const { data: shop } = await supabase
      .from('shops')
      .select('location')
      .eq('id', user.shop_id)
      .maybeSingle();
      
    if (shop) {
      resolvedLocation = shop.location;
    }
  }

  // 🛡️ Normalization Layer: Convert database types into unified frontend camelCase properties
  return {
    id: user.id,
    identifier: user.identifier,
    full_name: user.full_name,                // 🎯 NEW: Maps camelCase field to front-end state
    email: user.email,
    password: user.password,
    role: user.role,
    shop_id: user.shop_id,
    businessName: user.business_name || null, 
    location: resolvedLocation,              // 🎯 Resolved relationally from the shops table lookup
    approved: user.approved,
    createdBy: user.created_by || null        
  };
}
