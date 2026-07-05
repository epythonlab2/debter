// src/hooks/useAnalytics.ts
import { useMemo } from 'react';
import { Sale, DubeRecord } from '../types';

export type TimeFilterType = 'today' | 'yesterday' | 'week' | 'month';

interface UseAnalyticsProps {
  sales: Sale[];
  dubeRecords: DubeRecord[];
  selectedShopFilter: string;
  shopQuery?: string; 
  dailyGoal: number;
  timeFilter?: TimeFilterType;
  t: any;
  lang: any;
}

export function useAnalytics({ 
  sales, 
  dubeRecords, 
  selectedShopFilter, 
  shopQuery = '', 
  dailyGoal, 
  timeFilter = 'today',
  t,
  lang 
}: UseAnalyticsProps) {

  return useMemo(() => {
    // =========================================================================
    // --- INITIALIZATION & TYPE SAFEGUARDS ---
    // =========================================================================
    const safeSales = Array.isArray(sales) ? sales : [];
    const safeDube = Array.isArray(dubeRecords) ? dubeRecords : [];
    const targetFilter = String(selectedShopFilter || 'all').trim();

    // Cache exact system time thresholds to prevent dynamic offsets mid-calculation
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; 
    const todayDateStr = now.toDateString();            

    const yesterdayObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
    const yesterdayDateStr = yesterdayObj.toDateString();

    const weekStartThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    weekStartThreshold.setHours(0, 0, 0, 0);

    const monthStartThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    monthStartThreshold.setHours(0, 0, 0, 0);

    // Dynamic chronological filtering node for scope-isolated ledger summaries
    const matchesTimeFilter = (rawDateString?: string): boolean => {
      if (!rawDateString) return false;
      const normalizedRaw = String(rawDateString).trim();
      if (timeFilter === 'today' && normalizedRaw.startsWith(todayStr)) return true;
      if (timeFilter === 'yesterday' && normalizedRaw.startsWith(yesterdayStr)) return true;
      
      const parsedDate = new Date(normalizedRaw);
      if (isNaN(parsedDate.getTime())) return timeFilter === 'today'; 
      switch (timeFilter) {
        case 'today': return parsedDate.toDateString() === todayDateStr;
        case 'yesterday': return parsedDate.toDateString() === yesterdayDateStr;
        case 'week': return parsedDate >= weekStartThreshold;
        case 'month': return parsedDate >= monthStartThreshold;
        default: return false;
      }
    };

    // =========================================================================
    // --- PRE-FILTERING & INDEX MAP CONSTRUCTION (O(N)) ---
    // =========================================================================
    const scopeSales = safeSales.filter(s => targetFilter === 'all' || String(s.shop_id) === targetFilter);
    const scopeDube = safeDube.filter(d => targetFilter === 'all' || String(d.shop_id) === targetFilter);

    // Build optimized lookup maps for sub-millisecond debt correlation matching
    const dubeBySaleIdMap = new Map<string, DubeRecord>();
    const dubeByIdMap = new Map<string, DubeRecord>();

    scopeDube.forEach(record => {
      if (record.sale_id) dubeBySaleIdMap.set(String(record.sale_id), record);
      if (record.id) dubeByIdMap.set(String(record.id), record);
    });

    // Core transaction accumulation metrics
    let grossCash = 0;
    let grossDube = 0;
    let grossBank = 0; 
    let totalRevenue = 0; 
    let todayUnits = 0;
    let totalSalesCount = 0;

    // =========================================================================
    // --- HISTORICAL GRAPH MATRICES ---
    // =========================================================================
    const itemMap: Record<string, number> = {};
    const chartDayMap: Record<string, number> = {};
    const chartDateKeys: string[] = [];
    const chartDateStringMap: Record<string, string> = {}; 

    // Generate static week references to verify and populate trend bars instantly
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = weekdayLabels[d.getDay()];
      const tKey = d.toDateString();
      chartDayMap[tKey] = 0;
      chartDateKeys.push(tKey);
      chartDateStringMap[tKey] = label;
    }

    const weekdayRevenueMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const monthRevenueMap: Record<string, number> = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    // Track historical analytics peak markers natively during loop iteration to save resource frames
    let maxDayName = 'Mon';
    let maxDayVal = 0;
    let maxMonthName = 'Jan';
    let maxMonthVal = 0;

    // =========================================================================
    // --- MAIN EXECUTION LOOP (HIGH PERFORMANCE RADIX RUN) ---
    // =========================================================================
    scopeSales.forEach(sale => {
      const saleDateRaw = sale.sale_date || sale.created_at || sale.date;
      if (!saleDateRaw) return;

      const parsedSaleDate = new Date(saleDateRaw);
      if (isNaN(parsedSaleDate.getTime())) return;
      
      const qty = Number(sale.quantity ?? 0);
      const unitPriceFallback = Number(sale.price_sold ?? sale.price ?? sale.unit_price ?? sale.item?.price ?? 0);
      const collectiveTotalFallback = Number(sale.total_price ?? sale.amount ?? sale.subtotal ?? 0);
      const rowTotal = collectiveTotalFallback > 0 ? collectiveTotalFallback : (qty * unitPriceFallback);
      
      const method = (sale.payment_method || sale.paymentMethod || '').toLowerCase().trim();
      let isEligibleRevenue = false;
      let isDube = false;

      // Classify transaction method variations instantly
      if (method === 'dube' || method === 'credit') {
        const matchingDubeItem = dubeBySaleIdMap.get(String(sale.id)) || 
                                 dubeByIdMap.get(String(sale.dube_id)) || 
                                 dubeByIdMap.get(String(sale.dubeId));
        
        if (sale.status === 'settled' || sale.is_paid === true || matchingDubeItem?.status === 'paid') {
          isEligibleRevenue = true;
          isDube = true;
        }
      } else if (method === 'cash' || method === 'telebirr' || method === 'transfer' || method === 'bank' || method === 'cbe' || method === 'electronic') {
        isEligibleRevenue = true;
      }

      // Calculate trend performance tracking limits first
      if (isEligibleRevenue && rowTotal > 0) {
        const dayName = weekdayLabels[parsedSaleDate.getDay()];
        if (weekdayRevenueMap[dayName] !== undefined) {
          weekdayRevenueMap[dayName] += rowTotal;
          if (weekdayRevenueMap[dayName] > maxDayVal) {
            maxDayVal = weekdayRevenueMap[dayName];
            maxDayName = dayName;
          }
        }

        const monthName = monthLabels[parsedSaleDate.getMonth()];
        if (monthRevenueMap[monthName] !== undefined) {
          monthRevenueMap[monthName] += rowTotal;
          if (monthRevenueMap[monthName] > maxMonthVal) {
            maxMonthVal = monthRevenueMap[monthName];
            maxMonthName = monthName;
          }
        }

        const saleDayKey = parsedSaleDate.toDateString();
        if (chartDayMap[saleDayKey] !== undefined) chartDayMap[saleDayKey] += rowTotal;
      }

      // Isolate current analytics context view boundary windows
      if (!matchesTimeFilter(saleDateRaw)) return; 

      totalSalesCount += 1;
      todayUnits += qty;

      if (rowTotal > 0) {
        const itemName = sale.item_name || sale.item?.name || (sale.item_id ? `SKU #${String(sale.item_id).slice(0, 8)}...` : 'Generic Item');
        itemMap[itemName] = (itemMap[itemName] || 0) + rowTotal;
      }

      if (isEligibleRevenue) {
        totalRevenue += rowTotal;
        if (method === 'cash') {
          grossCash += rowTotal;
        } else if (isDube) {
          grossDube += rowTotal;
        } else {
          grossBank += rowTotal;
        }
      }
    });

    // =========================================================================
    // --- SUMMARY POST-PROCESSING & PAYLOAD PACKAGE ---
    // =========================================================================
    const totalOutstandingDube = scopeDube
      .filter(record => (record.status || '').toLowerCase().trim() === 'unpaid')
      .reduce((sum, record) => sum + Number(record.amount ?? 0), 0);

    const topItems = Object.entries(itemMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const last7Days = chartDateKeys.map(key => ({
      date: chartDateStringMap[key],
      revenue: chartDayMap[key]
    })).reverse();

    const targetGoalCalculated = timeFilter === 'week' ? dailyGoal * 7 : timeFilter === 'month' ? dailyGoal * 30 : dailyGoal;
    const goalPercent = targetGoalCalculated > 0 ? Math.min(100, Math.round((totalRevenue / targetGoalCalculated) * 100)) : 0;

    return {
      totalRevenue,
      grossCash,
      grossBank,
      grossDube,
      totalOutstandingDube,
      salesCount: totalSalesCount,
      units: todayUnits, 
      topItems,   
      last7Days,  
      goalPercent,
      peaks: {
        highestDayOfWeek: { dayName: maxDayName, revenue: maxDayVal },
        highestMonthOfYear: { monthName: maxMonthName, revenue: maxMonthVal }
      }
    };
  }, [sales, dubeRecords, selectedShopFilter, dailyGoal, timeFilter]);
}
