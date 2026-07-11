// src/components/RecordSaleTab.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Plus, Info, ShoppingBag, CreditCard, User, Phone, Calendar, Loader2, Search, Check, ChevronDown } from 'lucide-react';
import { SalesTranslation } from '../../types/sales';
import { ItemRecord } from '../../types/inventory';

export type PaymentMethodType = "cash" | "transfer" | "dube";

export interface RecordSaleTabProps {
  activeShopItems: ItemRecord[];
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  items: ItemRecord[]; 
  salePrice: string;
  setSalePrice: (price: string) => void;
  customItemName: string;
  setCustomItemName: (name: string) => void;
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (method: PaymentMethodType) => void;
  buyerName: string;
  setBuyerName: (name: string) => void;
  buyerPhone: string;
  setBuyerPhone: (phone: string) => void;
  saleQty: number;
  setSaleQty: React.Dispatch<React.SetStateAction<number>>;
  saleDate: string;
  setSaleDate: (date: string) => void;
  handleRecordSale: (e: React.FormEvent) => Promise<void>;
  handleQuickSelect: (item: ItemRecord) => void;
  t: SalesTranslation;
  lang: string;
  isSyncing?: boolean; 
}

export default function RecordSaleTab({ 
  activeShopItems, 
  selectedItemId, 
  setSelectedItemId, 
  items, 
  setSalePrice, 
  salePrice, 
  customItemName,
  setCustomItemName,
  paymentMethod, 
  setPaymentMethod,
  buyerName, 
  setBuyerName, 
  buyerPhone, 
  setBuyerPhone, 
  saleQty, 
  setSaleQty, 
  saleDate, 
  setSaleDate, 
  handleRecordSale, 
  handleQuickSelect, 
  t, 
  lang,
  isSyncing = false 
}: RecordSaleTabProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Combobox Dropdown Visibility States
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State to retain newly typed offline custom product names across form sessions
  const [localCustomProducts, setLocalCustomProducts] = useState<string[]>([]);

  // Close the floating search menu when clicking outside the target frame
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const frequentItems = useMemo(() => {
    return [...activeShopItems]
      .sort((a, b) => {
        const itemA = a as ItemRecord & { frequency_count?: number };
        const itemB = b as ItemRecord & { frequency_count?: number };
        return (itemB.frequency_count || 0) - (itemA.frequency_count || 0);
      })
      .slice(0, 4);
  }, [activeShopItems]);

  // Dynamically append cached custom offline items into the master selection catalogue
  const combinedItems = useMemo(() => {
    if (localCustomProducts.length === 0) return items;

    const virtualCustomRecords: ItemRecord[] = localCustomProducts.map((name) => ({
      id: `custom_saved_${name}`, 
      item_name: `${name} `,
      quantity: 0,
      default_price: 0,
      shop_id: ''
    }));

    return [...items, ...virtualCustomRecords];
  }, [items, localCustomProducts]);

  // Compute text label matching the active ID choice
  const selectedItemLabel = useMemo(() => {
    if (selectedItemId === "custom") return `✨ ${t.unregisteredSale || "Custom Item"}`;
    if (!selectedItemId) return `-- ${t.chooseItemPlaceholder || "Choose Product"} --`;
    const found = combinedItems.find(i => String(i.id) === String(selectedItemId));
    return found ? found.item_name : `-- ${t.chooseItemPlaceholder || "Choose Product"} --`;
  }, [selectedItemId, combinedItems, t]);

  // Filter items matching input queries down dynamically
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return combinedItems;
    return combinedItems.filter(i => i.item_name.toLowerCase().includes(query));
  }, [combinedItems, searchQuery]);
  
  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let originalPriceStr = salePrice;
    if (selectedItemId !== "custom" && selectedItemId !== "") {
      const matchingCatalogItem = combinedItems.find(i => String(i.id) === String(selectedItemId));
      if (matchingCatalogItem && (!salePrice || String(salePrice).trim() === "" || Number(salePrice) === 0)) {
        setSalePrice(String(matchingCatalogItem.default_price || 0));
        originalPriceStr = String(matchingCatalogItem.default_price || 0);
      }
    }

    if (Number(saleQty) <= 0) return alert("Quantity must be 1 or more.");
    if (Number(originalPriceStr) < 0) return alert("Price cannot be negative.");

    try {
      setIsSubmitting(true);

      // 1. Run the save pipeline completely first
      await handleRecordSale(e);

      // 2. ONLY capture custom product text input *after* successful execution is delivered
      if (selectedItemId === 'custom' && customItemName.trim()) {
        const cleanCustomName = customItemName.trim();
        setLocalCustomProducts(prev => {
          if (prev.includes(cleanCustomName)) return prev; 
          return [...prev, cleanCustomName];
        });
      }
      
      // 3. Reset entry fields post-success to prepare UI for next ledger transaction
      setSelectedItemId("");
      setSalePrice("");
      setCustomItemName("");
      setBuyerName("");
      setBuyerPhone("");
      setSaleQty(1);
      
      // 4. Explicitly collapse the dropdown frame context if left open
      setIsOpen(false);
      
    } catch (error) {
      console.error("Submission failed: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectProductItem = (val: string) => {
    setIsOpen(false);
    setSearchQuery(''); 

    if (String(val).startsWith("custom_saved_")) {
      const extractedCustomName = String(val).replace("custom_saved_", "");
      setSelectedItemId("custom");
      setCustomItemName(extractedCustomName);
      setSalePrice("");
      return;
    }

    setSelectedItemId(val);

    if (val !== "custom" && val !== "") {
      const found = items.find(i => String(i.id) === String(val));
      if (found && found.default_price) {
        setSalePrice(String(found.default_price));
      } else {
        setSalePrice("");
      }
    } else {
      setSalePrice("");
      setCustomItemName("");
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    if (method !== 'dube') {
      setBuyerName('');
      setBuyerPhone('');
    }
  };

  const activeTabTheme = useMemo(() => {
    switch (paymentMethod) {
      case 'cash':
        return {
          bg: 'bg-emerald-600 dark:bg-emerald-500/10',
          border: 'border-emerald-700 dark:border-emerald-500/20',
          text: 'text-white dark:text-emerald-400 font-semibold',
          transform: 'translateX(0%)'
        };
      case 'transfer':
        return {
          bg: 'bg-white dark:bg-[#1a5fb4]/20',
          border: 'border-[#1a5fb4] dark:border-blue-500/30',
          text: 'text-[#1a5fb4] dark:text-blue-400 font-semibold',
          transform: 'translateX(calc(100% + 4px))'
        };
      case 'dube':
        return {
          bg: 'bg-slate-900 dark:bg-slate-800',
          border: 'border-slate-950 dark:border-slate-700',
          text: 'text-white dark:text-slate-200 font-semibold',
          transform: 'translateX(calc(200% + 8px))'
        };
      default:
        return {
          bg: 'bg-white dark:bg-slate-900',
          border: 'border-slate-200/80 dark:border-slate-800',
          text: 'text-slate-500 dark:text-slate-400',
          transform: 'translateX(0%)'
        };
    }
  }, [paymentMethod]);

  return (
    <div 
      className="space-y-4 max-w-md mx-auto antialiased selection:bg-[#1a5fb4]/10 dark:selection:bg-blue-500/20 px-0.5"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* SECTION 1: QUICK TAP HOTKEYS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t.quickTap || "Quick Tap Selection"}
          </h3>
          <span className="w-2 h-2 rounded-full bg-[#1a5fb4] dark:bg-blue-500/70 animate-pulse" />
        </div>
        
        {frequentItems.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800 font-normal">
            {t.regItem}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {frequentItems.map((item) => {
              const isSelected = String(selectedItemId) === String(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickSelect(item)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between min-h-[92px] h-auto pb-3 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none cursor-pointer ${
                    isSelected 
                      ? "bg-[#1a5fb4] dark:bg-[#1a5fb4]/20 text-white dark:text-blue-100 border-[#154b91] dark:border-[#1a5fb4]/40 shadow-md shadow-[#1a5fb4]/10 dark:shadow-none scale-[1.01]" 
                      : "bg-slate-50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 shadow-3xs"
                  }`}
                >
                  <span className={`text-sm font-medium line-clamp-2 leading-tight tracking-tight mb-2 ${isSelected ? "text-white dark:text-blue-200" : "text-slate-700 dark:text-slate-300"}`}>
                    {item.item_name}
                  </span>
                  <div className="flex items-center justify-between w-full mt-auto pt-1 gap-1">
                    <span className={`text-xs font-bold whitespace-nowrap ${isSelected ? "text-blue-50 dark:text-blue-400" : "text-[#1a5fb4] dark:text-blue-400"}`}>
                      {Number(item.default_price || 0).toLocaleString()} <span className="text-xs font-medium opacity-80">{t.currency || "ETB"}</span>
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap border ${
                      isSelected ? "bg-[#154b91]/50 dark:bg-blue-500/10 border-transparent dark:border-blue-500/20 text-white dark:text-blue-300" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}>
                      {Number(item.quantity || 0).toLocaleString()} {t.pcs || "Pcs"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: MAIN LEDGER ENTRY FORM */}
      <form onSubmit={onFormSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4.5 shadow-2xs space-y-4">
        
        {/* Searchable Combobox Product Dropdown Section */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />
            {t.selectItem || "Select Product"}
          </label>
          
          <div className="relative">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsOpen(!isOpen)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none text-sm bg-slate-50 dark:bg-slate-950/40 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] focus:dark:border-blue-500 text-left text-slate-700 dark:text-slate-200 transition-all disabled:opacity-60 truncate flex justify-between items-center cursor-pointer"
            >
              <span className="truncate">{selectedItemLabel}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transform transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute z-40 w-full mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64">
                <div className="p-2 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 ml-1.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    autoFocus
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`${t.itemNamePlaceholder || "Search variant"}...`}
                    className="w-full bg-transparent text-sm outline-none font-normal text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                <div className="overflow-y-auto divide-y divide-slate-50 dark:divide-slate-900/60 flex-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => selectProductItem("custom")}
                    className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                      selectedItemId === 'custom' 
                        ? 'bg-[#1a5fb4]/5 dark:bg-blue-500/10 text-[#1a5fb4] dark:text-blue-400 font-medium' 
                        : 'text-[#1a5fb4] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 font-medium'
                    }`}
                  >
                    <span>✨ + {t.unregisteredSale || "Custom Item"}</span>
                    {selectedItemId === 'custom' && <Check className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400" />}
                  </button>

                  {filteredItems.length === 0 ? (
                    <div className="p-4 text-xs text-center text-slate-400 dark:text-slate-500">
                      No matching products found
                    </div>
                  ) : (
                    filteredItems.map((i) => {
                      const isItemActive = String(i.id) === String(selectedItemId);
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => selectProductItem(i.id)}
                          className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                            isItemActive 
                              ? 'bg-[#1a5fb4]/5 dark:bg-blue-500/10 text-[#1a5fb4] dark:text-blue-400 font-medium' 
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="truncate">{i.item_name}</span>
                            <span className="text-xxs text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                              {t.stock || "Stock"}: {Number(i.quantity || 0).toLocaleString()} {t.pcs || "Pcs"}
                            </span>
                          </div>
                          {isItemActive && <Check className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Ad-hoc Custom Variant Input Block */}
        {selectedItemId === "custom" && (
          <div className="p-3.5 bg-blue-50/30 dark:bg-blue-950/10 rounded-xl border border-dashed border-[#1a5fb4]/20 dark:border-blue-500/20 space-y-1.5 animate-fade-in transition-all">
            <label className="block text-xs font-medium text-[#1a5fb4] dark:text-blue-400">
              {t.itemName || "Item Name"}
            </label>
            <input 
              type="text" 
              value={customItemName}
              disabled={isSubmitting}
              onChange={(e) => setCustomItemName(e.target.value)}
              placeholder={t.itemNamePlaceholder || "Enter custom item name"} 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 outline-none focus:border-[#1a5fb4] focus:dark:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 focus:dark:ring-blue-500/10 transition-all font-normal text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              required
            />
          </div>
        )}

        {/* SEGMENTED PAYMENT METHOD MULTI-TOGGLE TABS */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />
            {t.paymentMethod || "Payment Method"}
          </label>
          <div className="relative grid grid-cols-3 bg-slate-100/80 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 isolate gap-1">
            <div 
              className={`absolute top-1 bottom-1 left-1 rounded-lg transition-all duration-200 ease-out -z-10 shadow-3xs border ${activeTabTheme.bg} ${activeTabTheme.border}`}
              style={{
                width: 'calc(33.333% - 6px)',
                transform: activeTabTheme.transform
              }}
            />

            {[
              { id: "cash", label: t.cash || "Cash" },
              { id: "transfer", label: t.transfer || "Transfer" },
              { id: "dube", label: t.dube || "Dube" }
            ].map((method) => {
              const isActive = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePaymentMethodChange(method.id as PaymentMethodType)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium transition-all text-center cursor-pointer disabled:opacity-50 select-none border border-transparent active:scale-[0.96] ${
                    isActive 
                      ? activeTabTheme.text
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Credit/Dube Customer Profile Metadata Section */}
        {paymentMethod === "dube" && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 animate-fade-in transition-all">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
              <Info className="w-3.5 h-3.5 text-[#1a5fb4] dark:text-blue-400 shrink-0 stroke-[2]" />
              {t.dubeBuyerInfo || "Credit Customer Logistics"}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  {t.buyerName || "Buyer Name"}
                </label>
                <input 
                  type="text" 
                  value={buyerName}
                  disabled={isSubmitting}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Almaz" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 outline-none focus:border-[#1a5fb4] focus:dark:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 focus:dark:ring-blue-500/10 transition-all font-normal text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  {t.buyerPhone || "Phone"}
                </label>
                <input 
                  type="text" 
                  inputMode="tel"
                  value={buyerPhone}
                  disabled={isSubmitting}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="09..." 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 outline-none focus:border-[#1a5fb4] focus:dark:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 focus:dark:ring-blue-500/10 transition-all font-normal text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Item Final Sale Price Point + Step-Based Quantity Counter */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              {t.priceSold || "Price"}
            </label>
            <div className="relative flex items-center">
              <input 
                type="number" 
                inputMode="decimal"
                min="0"
                step="any"
                value={salePrice || ''}
                disabled={isSubmitting}
                onChange={(e) => setSalePrice(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                  }
                }}
                placeholder="0"
                className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none text-sm bg-slate-50 dark:bg-slate-950/40 font-normal text-slate-800 dark:text-slate-200 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] focus:dark:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 focus:dark:ring-blue-500/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                required
              />
              <span className="absolute right-3.5 text-xs font-medium text-slate-400 dark:text-slate-500 pointer-events-none">
                {t.currency || "ETB"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              {t.quantity || "Qty"}
            </label>
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40 h-[40px] p-1 transition-all focus-within:border-[#1a5fb4] focus-within:dark:border-blue-500 focus-within:ring-4 focus-within:ring-[#1a5fb4]/10 focus-within:dark:ring-blue-500/10">
              <button 
                type="button" 
                disabled={isSubmitting || Number(saleQty) <= 1}
                onClick={() => setSaleQty(prev => Math.max(1, (Number(prev) || 1) - 1))}
                className="w-8 h-full font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-lg shadow-3xs active:scale-[0.93] disabled:opacity-30 transition-all justify-center items-center flex cursor-pointer text-sm"
              >
                -
              </button>
              <span className="flex-1 text-center font-medium text-sm text-slate-800 dark:text-slate-200 select-none">{saleQty}</span>
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => setSaleQty(prev => (Number(prev) || 0) + 1)}
                className="w-8 h-full font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-lg shadow-3xs active:scale-[0.93] transition-all cursor-pointer text-sm justify-center items-center flex"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Date Overrides Form Line */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />
            {t.date || "Date Override"}
          </label>
          <input 
            type="date" 
            value={saleDate}
            disabled={isSubmitting}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none text-sm bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 font-normal focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] focus:dark:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 focus:dark:ring-blue-500/10 transition-all disabled:opacity-60 min-h-[40px] scheme-light dark:scheme-dark"
          />
        </div>

        {/* ACTION PIPELINE SUBMIT BLOCK */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-[#1a5fb4] dark:bg-[#1a5fb4] hover:bg-[#154b91] dark:hover:bg-[#154b91] text-white py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-all text-sm font-medium tracking-wide cursor-pointer mt-2 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{t.savingSale || "Saving Sale..."}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>{t.saveSale || "Save Sale"}</span>
            </>
          )}
        </button>
      </form>

      {/* FULL SCREEN INTERACTIVE MODAL FOR DATA SYNC OVERLAYS */}
      {isSyncing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-11/12 max-w-xs rounded-2xl bg-white dark:bg-slate-900 p-6 text-center shadow-xl border border-slate-100 dark:border-slate-800/60">
            
            {/* Spinning Indicator */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30 text-[#1a5fb4] dark:text-blue-400 mb-4">
              <Loader2 className="h-6 w-6 animate-spin stroke-[2.5]" />
            </div>

            {/* Translation Friendly Context Layout Labels */}
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              {t.syncingTitle || "Syncing Records..."}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto leading-normal">
              {t.syncingSales || "Uploading transactional shifts to the remote cloud. Keep connection stable."}
            </p>
            
          </div>
        </div>
      )}
    </div>
  );
}
