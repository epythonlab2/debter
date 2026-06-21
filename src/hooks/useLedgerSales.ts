import { useState, useMemo } from 'react';
import { Sale } from '../types';

export type LedgerPeriod = 'today' | 'yesterday' | 'weekly' | 'all';

interface UseLedgerSalesProps {
  sales: any[];
  dubeRecords: any[];
  items: any[];
  selectedShopFilter: string;
  t: any;
}

export function useLedgerSales({
  sales,
  dubeRecords,
  items,
  selectedShopFilter,
  t
}: UseLedgerSalesProps) {
  const [ledgerToggle, setLedgerToggle] = useState<'sales' | 'dube'>('sales');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<LedgerPeriod>('today');
  
  const [settleDubeModal, setSettleDubeModal] = useState<{ isOpen: boolean; dubeId: string | number | null }>({
    isOpen: false,
    dubeId: null
  });

  // Safe localized date parsing to prevent UTC shifts
  const dateBounds = useMemo(() => {
    const now = new Date();
    
    // Format local calendar boundaries safely as YYYY-MM-DD
    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatLocalDate(now);
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);
    
    // Set to the absolute beginning of the local day 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return { todayStr, yesterdayStr, sevenDaysAgo };
  }, []);

  // --- 1. Scoped Open & Closed Balances Filter (The Credit Tab) ---
  const filteredDubeRecords = useMemo(() => {
    const cleanSearch = ledgerSearch.toLowerCase().trim();
    
    return dubeRecords.filter(d => {
      const matchesShop = selectedShopFilter === 'all' || d.shop_id === selectedShopFilter;
      if (!matchesShop) return false;

      const buyerName = (d.buyer_name || '').toLowerCase();
      const buyerPhone = String(d.buyer_phone || '');
      const salespersonName = (d.recorded_by?.full_name || d.recorded_by_full_name || '').toLowerCase();

      return buyerName.includes(cleanSearch) ||
             buyerPhone.includes(cleanSearch) ||
             salespersonName.includes(cleanSearch);
    });
  }, [dubeRecords, ledgerSearch, selectedShopFilter]);

  // --- 2. Dynamic History Pipeline (The Sales Tab) ---
  const groupedSales = useMemo(() => {
    const cleanSearch = ledgerSearch.toLowerCase().trim();
    const { todayStr, yesterdayStr, sevenDaysAgo } = dateBounds;

    // Create a quick-lookup map for item names to replace double loops with an O(1) read
    const itemMap = new Map<string, string>();
    items.forEach(i => {
      if (i.id) itemMap.set(String(i.id), i.item_name || '');
    });

    // Create a cross-reference map for quick status checks on Dube records
    // Tracks status both by sale_id and by the dube record's own primary key id
    const dubeStatusMap = new Map<string, { status: string; id: string }>();
    dubeRecords.forEach(d => {
      if (d.sale_id) dubeStatusMap.set(String(d.sale_id), { status: d.status, id: String(d.id) });
      if (d.id) dubeStatusMap.set(String(d.id), { status: d.status, id: String(d.id) });
    });

    const matched = sales.filter(s => {
      const method = s.payment_method || s.paymentMethod;
      if (ledgerToggle === 'dube' && method !== 'dube') return false;

      const matchesShop = selectedShopFilter === 'all' || s.shop_id === selectedShopFilter;
      if (!matchesShop) return false;

      // Extract raw date components safely whether it's ISO or local short-date format
      const saleDateRaw = s.sale_date ? s.sale_date.split('T')[0] : '';
      
      if (activePeriod === 'today' && saleDateRaw !== todayStr) return false;
      if (activePeriod === 'yesterday' && saleDateRaw !== yesterdayStr) return false;
      if (activePeriod === 'weekly') {
        const fullSaleDate = new Date(s.sale_date);
        if (fullSaleDate < sevenDaysAgo) return false;
      }

      const resolvedItemName = (itemMap.get(String(s.item_id)) || s.item_name || '').toLowerCase();
      const customItemName = (s.customItemName || s.custom_item_name || '').toLowerCase();
      const buyerName = (s.buyerName || s.buyer_name || '').toLowerCase();
      const buyerPhone = String(s.buyerPhone || s.buyer_phone || '');
      const salespersonName = (s.recorded_by?.full_name || s.recorded_by_full_name || '').toLowerCase();

      return resolvedItemName.includes(cleanSearch) || 
             customItemName.includes(cleanSearch) ||
             buyerName.includes(cleanSearch) ||
             buyerPhone.includes(cleanSearch) ||
             salespersonName.includes(cleanSearch);
    });

    // --- Dynamic Section Aggregation ---
    const groups: { [key: string]: { date: string; total: number; items: Sale[] } } = {};

    matched.forEach(sale => {
      const dateStr = sale.sale_date ? sale.sale_date.split('T')[0] : 'Historical';
      const resolvedName = itemMap.get(String(sale.item_id)) || 
                           sale.item_name || 
                           sale.customItemName || 
                           sale.custom_item_name || 
                           t.unregItem;

      if (!groups[dateStr]) {
        groups[dateStr] = { date: dateStr, total: 0, items: [] };
      }

      // Robust fallback check across our Dube index mappings
      const dubeRef = dubeStatusMap.get(String(sale.id)) || dubeStatusMap.get(String(sale.dube_id));
      const isDubeSettled = dubeRef ? dubeRef.status === 'paid' : false;

      groups[dateStr].items.push({ 
        ...sale, 
        item_name: resolvedName,
        is_settled_credit: isDubeSettled 
      });

      // 🟢 REVENUE TOTAL ADJUSTMENT CHECK
      const method = sale.payment_method || sale.paymentMethod;
      if (method === 'dube' && !isDubeSettled) {
        return; // Skip accounting calculation for unpaid credit records
      }

      groups[dateStr].total += Number(sale.price_sold || 0) * Number(sale.quantity || 0);
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, dubeRecords, ledgerToggle, ledgerSearch, selectedShopFilter, activePeriod, dateBounds, items, t]);

  return {
    ledgerToggle, setLedgerToggle,
    ledgerSearch, setLedgerSearch,
    activePeriod, setActivePeriod,
    settleDubeModal, setSettleDubeModal,
    filteredDubeRecords,
    groupedSales
  };
}
