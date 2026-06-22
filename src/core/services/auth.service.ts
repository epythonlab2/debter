// src/core/services/auth.service.ts
import { supabase } from '../../utils/supabaseClient'; 
import { UserProfile } from '../../types';

/**
 * Registers a new business by creating a shop row and then an owner user profile
 */
export async function registerUser(profile: any) { 
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
          location: profile.location || null, 
          owner_id: null 
        }
      ]);

    if (shopError) throw shopError;
    assignedShopId = generatedShopId;
  }

  // 🟢 CASE NORMALIZATION GATES
  const resolvedFullName = profile.fullName || profile.full_name || '';
  const resolvedBusinessName = profile.businessName || profile.business_name || null;
  const resolvedCreatedBy = profile.createdBy || profile.created_by || null;

  // 🛑 CRITICAL CLIENT GUARD
  if (!resolvedFullName.trim()) {
    throw new Error('Registration Rejected: Full Name property missing or blank.');
  }

  // 2. Register the user profile, linking it to the created shop
  const { error: userError } = await supabase
    .from('users')
    .insert([
      {
        id: profile.id || `usr-${Date.now()}`,
        identifier: profile.identifier,
        full_name: resolvedFullName.trim(),       
        email: profile.email || null,
        password: profile.password,
        role: profile.role || 'owner',
        shop_id: assignedShopId || profile.shop_id || null, 
        business_name: resolvedBusinessName,       
        approved: profile.approved !== undefined ? profile.approved : false,
        created_by: resolvedCreatedBy
      }
    ]);

  if (userError) throw userError;

  // 3. Back-fill owner tracking onto the shops table
  if (assignedShopId && profile.id) {
    await supabase
      .from('shops')
      .update({ owner_id: profile.id })
      .eq('id', assignedShopId);
  }

  return true;
}

/**
 * Authenticates credentials against the users table and resolves shop details relationally.
 * Accepts localization context parameters to respond with formal native messaging layers.
 */
export async function loginUser(
  identifier: string, 
  password: string, 
  lang: 'en' | 'am' = 'en'
): Promise<UserProfile> {
  // 1. Fetch core user info
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('identifier', identifier)
    .eq('password', password)
    .maybeSingle();

  // 🛑 INVALID CREDENTIALS GATES
  if (userError || !user) {
    const invalidMsg = lang === 'am'
      ? 'ያስገቡት መለያ ወይም የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ።'
      : 'Invalid identifier or password provided. Please check your credentials and try again.';
    throw new Error(invalidMsg);
  }

  // 🛑 ACCOUNT DEACTIVATION / APPROVAL GUARD
  if (user.approved === false) {
    const restrictedMsg = lang === 'am'
      ? 'የመለያዎ መብት ተገድቧል ወይም አልነቃም። እባክዎ መለያዎን ለማስነሳት በቴሌግራም ያግኙን፡ https://t.me/debter16'
      : 'Your account access has been restricted or deactivated. Please contact us on Telegram for immediate activation: https://t.me/debter16';
    throw new Error(restrictedMsg);
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

  // 🛡️ Normalization Layer
  return {
    id: user.id,
    identifier: user.identifier,
    full_name: user.full_name,                
    email: user.email,
    password: user.password,
    role: user.role,
    shop_id: user.shop_id,
    businessName: user.business_name || null, 
    location: resolvedLocation,              
    approved: user.approved,
    createdBy: user.created_by || null,
    must_change_password: !!user.must_change_password       
  };
}
