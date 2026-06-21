// src/components/RecordSaleTab.tsx
import React, { useMemo, useState } from 'react';
import { Plus, Info, ShoppingBag, CreditCard, User, Phone, Calendar, Loader2 } from 'lucide-react';
import { SalesTranslation } from '../../types/sales';
import { ItemRecord } from '../../types/inventory';

export interface RecordSaleTabProps {
  activeShopItems: ItemRecord[];
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  items: ItemRecord[]; 
  salePrice: string;
  setSalePrice: (price: string) => void;
  customItemName: string;
  setCustomItemName: (name: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: "cash" | "dube" | "telebirr" | "bank") => void;
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

  // Filters and pulls the top 4 fast-moving product entities for rapid counter interaction
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

    try {
      setIsSubmitting(true);
      await handleRecordSale(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computes active theme variables and background indicator layout offsets dynamically
  const activeTabTheme = useMemo(() => {
    switch (paymentMethod) {
      case 'cash':
        return {
          bg: 'bg-emerald-600',
          border: 'border-emerald-700',
          text: 'text-white font-black',
          indicatorTranslate: 'translateX(0%)'
        };
      case 'transfer':
        return {
          bg: 'bg-[#1a5fb4]',
          border: 'border-[#154b91]',
          text: 'text-white font-black',
          indicatorTranslate: 'translateX(100%)'
        };
      case 'dube':
        return {
          bg: 'bg-slate-900',
          border: 'border-slate-950',
          text: 'text-white font-black',
          indicatorTranslate: 'translateX(200%)'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-slate-200/80',
          text: 'text-slate-900 font-black',
          indicatorTranslate: 'translateX(0%)'
        };
    }
  }, [paymentMethod]);

  return (
    <div className="space-y-4 max-w-md mx-auto antialiased selection:bg-[#1a5fb4]/10 px-0.5">
      
      {/* ======================================================================
        SECTION 1: QUICK TAP HOTKEYS
        ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.quickTap}</h3>
          <span className="w-2 h-2 rounded-full bg-[#1a5fb4] animate-pulse" />
        </div>
        
        {frequentItems.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80 font-medium">
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
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between min-h-[88px] h-auto pb-3 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none cursor-pointer ${
                    isSelected 
                      ? "bg-[#1a5fb4] text-white border-[#154b91] shadow-md shadow-[#1a5fb4]/20 scale-[1.01]" 
                      : "bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-3xs"
                  }`}
                >
                  <span className={`text-xs font-extrabold line-clamp-2 leading-snug tracking-tight mb-2 uppercase ${isSelected ? "text-white" : "text-slate-800"}`}>
                    {item.item_name}
                  </span>
                  <div className="flex items-center justify-between w-full mt-auto pt-1 gap-1">
                    <span className={`text-xs font-black whitespace-nowrap font-mono ${isSelected ? "text-blue-50" : "text-[#1a5fb4]"}`}>
                      {Number(item.default_price || 0).toLocaleString()} <span className="text-[10px] font-bold font-sans opacity-85">{t.currency}</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap border uppercase tracking-wider ${
                      isSelected ? "bg-[#154b91]/50 border-transparent text-white" : "bg-white text-slate-500 border-slate-200"
                    }`}>
                      {Number(item.quantity || 0).toLocaleString()} {t.pcs}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================================
        SECTION 2: MAIN LEDGER ENTRY FORM
        ====================================================================== */}
      <form onSubmit={onFormSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-2xs space-y-4">
        
        {/* Dropdown Product Selector Field */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider leading-none">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
            {t.selectItem}
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
                    setSalePrice("");
                  } else {
                    setSalePrice("");
                  }
                } else {
                  setSalePrice("");
                }
              }}
              className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 font-bold text-slate-700 appearance-none transition-all disabled:opacity-60 truncate cursor-pointer"
            >
              <option value="">-- {t.chooseItemPlaceholder} --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {`${i.item_name.toUpperCase()} (${t.stock}: ${Number(i.quantity || 0).toLocaleString()} ${t.pcs})`}
                </option>
              ))}
              <option value="custom" className="text-[#1a5fb4] font-black">✨ + {t.unregisteredSale.toUpperCase()}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
              <svg className="fill-current h-4 w-4 opacity-60 stroke-[1.5]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Ad-hoc Custom Variant Input Block */}
        {selectedItemId === "custom" && (
          <div className="p-3.5 bg-blue-50/30 rounded-xl border border-dashed border-[#1a5fb4]/20 space-y-1.5 animate-fade-in">
            <label className="block text-[10px] font-black text-[#1a5fb4] tracking-widest uppercase">{t.itemName || "Item Name"}</label>
            <input 
              type="text" 
              value={customItemName}
              disabled={isSubmitting}
              onChange={(e) => setCustomItemName(e.target.value)}
              placeholder={t.itemNamePlaceholder} 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all font-bold text-slate-800 uppercase"
              required
            />
          </div>
        )}

        {/* SEGMENTED PAYMENT METHOD MULTI-TOGGLE TABS */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider leading-none">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
            {t.paymentMethod}
          </label>
          <div className="relative grid grid-cols-3 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 isolate gap-1">
            <div 
              className={`absolute top-1 bottom-1 left-1 rounded-lg transition-all duration-200 ease-out -z-10 shadow-3xs border ${activeTabTheme.bg} ${activeTabTheme.border}`}
              style={{
                width: 'calc(33.333% - 5px)',
                transform: activeTabTheme.indicatorTranslate
              }}
            />

            {[
              { id: "cash", label: t.cash },
              { id: "transfer", label: t.transfer },
              { id: "dube", label: t.dube }
            ].map((method) => {
              const isActive = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setPaymentMethod(method.id as "cash" | "dube" | "telebirr" | "bank")}
                  className={`py-2.5 px-1 rounded-lg text-xs font-black transition-all text-center cursor-pointer uppercase tracking-wider disabled:opacity-50 select-none border border-transparent active:scale-[0.96] ${
                    isActive 
                      ? "text-white font-black" 
                      : "text-slate-500 hover:text-slate-800"
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
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 animate-fade-in">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Info className="w-3.5 h-3.5 text-[#1a5fb4] shrink-0 stroke-[2.5]" />
              {t.dubeBuyerInfo}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <User className="w-3 h-3 text-slate-400" />
                  {t.buyerName}
                </label>
                <input 
                  type="text" 
                  value={buyerName}
                  disabled={isSubmitting}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Almaz" 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all font-bold text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {t.buyerPhone}
                </label>
                <input 
                  type="text" 
                  inputMode="tel"
                  value={buyerPhone}
                  disabled={isSubmitting}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="09..." 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all font-bold text-slate-800 font-mono"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Item Final Sale Price Point + Step-Based Quantity Counter */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider leading-none">{t.priceSold}</label>
            <div className="relative flex items-center">
              <input 
                type="number" 
                inputMode="decimal"
                value={salePrice || ''}
                disabled={isSubmitting}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
                className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50 font-bold text-slate-800 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60 font-mono"
                required
              />
              <span className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none">{t.currency}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider leading-none">{t.quantity}</label>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-[46px] p-1 transition-all focus-within:border-[#1a5fb4] focus-within:ring-4 focus-within:ring-[#1a5fb4]/10">
              <button 
                type="button" 
                disabled={isSubmitting || Number(saleQty) <= 1}
                onClick={() => {
                  const currentQty = Number(saleQty) || 1;
                  setSaleQty(Math.max(1, currentQty - 1));
                }}
                className="w-10 h-full font-black text-slate-500 bg-white hover:bg-slate-100 border border-slate-200/60 rounded-lg shadow-3xs active:scale-[0.93] disabled:opacity-30 transition-all cursor-pointer text-sm flex items-center justify-center"
              >
                -
              </button>
              <span className="flex-1 text-center font-black text-sm text-slate-800 select-none font-mono">{saleQty}</span>
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => {
                  const currentQty = Number(saleQty) || 1;
                  setSaleQty(currentQty + 1);
                }}
                className="w-10 h-full font-black text-slate-500 bg-white hover:bg-slate-100 border border-slate-200/60 rounded-lg shadow-3xs active:scale-[0.93] transition-all transition-colors cursor-pointer text-sm flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Date Overrides Form Line */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider leading-none">
            <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
            {t.date}
          </label>
          <input 
            type="date" 
            value={saleDate}
            disabled={isSubmitting}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50 text-slate-700 font-bold focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60 min-h-[46px]"
          />
        </div>

        {/* ACTION PIPELINE SUBMIT BLOCK */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-[#1a5fb4] hover:bg-[#154b91] text-white font-black py-3.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-all text-xs uppercase tracking-widest cursor-pointer mt-2 disabled:bg-slate-300 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{t.savingSale || "Saving Sale..."}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t.saveSale || "Save Sale"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
