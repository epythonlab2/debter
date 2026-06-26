// src/components/RecordSaleTab.tsx
import React, { useMemo, useState } from 'react';
import { Plus, Info, ShoppingBag, CreditCard, User, Phone, Calendar, Loader2 } from 'lucide-react';
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
  lang 
}: RecordSaleTabProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);

  const frequentItems = useMemo(() => {
    return [...activeShopItems]
      .sort((a, b) => {
        const itemA = a as ItemRecord & { frequency_count?: number };
        const itemB = b as ItemRecord & { frequency_count?: number };
        return (itemB.frequency_count || 0) - (itemA.frequency_count || 0);
      })
      .slice(0, 4);
  }, [activeShopItems]);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (Number(saleQty) <= 0) return alert("Quantity must be 1 or more.");
    if (Number(salePrice) < 0) return alert("Price cannot be negative.");

    try {
      setIsSubmitting(true);
      await handleRecordSale(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    if (method !== 'dube') {
      setBuyerName('');
      setBuyerPhone('');
    }
  };

  // Adjusted theme variables to eliminate radioactive glare backgrounds in Dark Mode
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
          bg: 'bg-[#1a5fb4]',
          border: 'border-[#154b91] dark:border-blue-500/20',
          text: 'text-white dark:text-blue-400 font-semibold',
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
        
        {/* Dropdown Product Selector Field */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />
            {t.selectItem || "Select Product"}
          </label>
          <div className="relative group">
            <select 
              value={selectedItemId}
              disabled={isSubmitting}
              required
              onChange={(e) => {
                const val = e.target.value;
                setSelectedItemId(val);
                if (val !== "custom" && val !== "") {
                  const found = items.find(i => String(i.id) === String(val));
                  if (found && found.default_price) {
                    setSalePrice(0);
                  } else {
                    setSalePrice("");
                  }
                } else {
                  setSalePrice("");
                  setCustomItemName("");
                }
              }}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none text-sm bg-slate-50 dark:bg-slate-950/40 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] focus:dark:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 focus:dark:ring-blue-500/10 font-normal text-slate-700 dark:text-slate-200 appearance-none transition-all disabled:opacity-60 truncate cursor-pointer"
            >
              <option value="" className="dark:bg-slate-950">-- {t.chooseItemPlaceholder || "Choose Product"} --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id} className="dark:bg-slate-950">
                  {`
                    ${i.item_name} (${t.stock || "Stock"}: ${Number(i.quantity || 0).toLocaleString()} ${t.pcs || "Pcs"})
                  `}
                </option>
              ))}
              <option value="custom" className="text-[#1a5fb4] dark:text-blue-400 font-medium dark:bg-slate-950">✨ + {t.unregisteredSale || "Custom Item"}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 dark:text-slate-500">
              <svg className="fill-current h-4 w-4 opacity-60 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Ad-hoc Custom Variant Input Block */}
        {selectedItemId === "custom" && (
          <div className="p-3.5 bg-blue-50/30 dark:bg-blue-950/10 rounded-xl border border-dashed border-[#1a5fb4]/20 dark:border-blue-500/20 space-y-1.5 animate-fade-in">
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
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 animate-fade-in">
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
    </div>
  );
}
