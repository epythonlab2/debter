import { supabase } from '../../utils/supabaseClient'; // Adjust path to your actual Supabase client instance

/**
 * Server-side paginated and searched lookup for over 100k+ records
 */
export async function fetchShopsPaginated(searchQuery: string, page = 0, limit = 20) {
  const fromOffset = page * limit;
  const toOffset = fromOffset + limit - 1;

  let query = supabase
    .from('shops')
    .select('*', { count: 'exact' }); 

  // 🔎 Remote Postgres pattern matching instead of slow JavaScript filter loops
  if (searchQuery.trim()) {
    query = query.ilike('name', `%${searchQuery.trim()}%`);
  }

  const { data, count, error } = await query
    .range(fromOffset, toOffset)
    .order('name', { ascending: true });

  if (error) throw error;
  return { data, totalCount: count };
}
