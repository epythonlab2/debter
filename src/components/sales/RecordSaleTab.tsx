// src/components/RecordSaleTab.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Plus, Info, ShoppingBag, User, Phone, Calendar, Loader2, Search, Check, ChevronDown, AlertCircle } from 'lucide-react';
import { SalesTranslation } from '../../types/sales';
import { ItemRecord } from '../../types/inventory';
import { QuickTapSelection } from './QuickTapSelection';
import { SegmentedPaymentTabs } from './SegmentedPaymentTabs';

/**
 * TYPE DEFINITIONS & INTERFACES
 */
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
  isSyncing = false 
}: RecordSaleTabProps) {

  // UI State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Validation States
  const [showItemError, setShowItemError] = useState(false);
  const [priceError, setPriceError] = useState<string>(""); 
  const [showCustomNameError, setShowCustomNameError] = useState(false);
  const [showBuyerNameError, setShowBuyerNameError] = useState(false);
  const [showBuyerPhoneError, setShowBuyerPhoneError] = useState(false);

  // DOM Elements References for Focus and Click Detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const customNameInputRef = useRef<HTMLInputElement>(null);
  const buyerNameInputRef = useRef<HTMLInputElement>(null);
  const buyerPhoneInputRef = useRef<HTMLInputElement>(null);

  // Click Outside Handler: Closes the custom product combobox dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Frequent Items Filter: Extracts the top 4 most frequently sold products
  const frequentItems = useMemo(() => {
    return [...activeShopItems]
      .sort((a, b) => {
        const itemA = a as ItemRecord & { frequency_count?: number };
        const itemB = b as ItemRecord & { frequency_count?: number };
        return (itemB.frequency_count || 0) - (itemA.frequency_count || 0);
      })
      .slice(0, 4);
  }, [activeShopItems]);

  const combinedItems = items;

  // Selected Item Label Resolver: Text display logic for the dropdown head button
  const selectedItemLabel = useMemo(() => {
    if (selectedItemId === "custom") return `✨ ${t.unregisteredSale || "Custom Item"}`;
    if (!selectedItemId) return `-- ${t.chooseItemPlaceholder || "Choose Product"} --`;
    const found = combinedItems.find(i => String(i.id) === String(selectedItemId));
    return found ? found.item_name : `-- ${t.chooseItemPlaceholder || "Choose Product"} --`;
  }, [selectedItemId, combinedItems, t]);

  // Product Filter: Performs search query match against local inventory list
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return combinedItems;
    return combinedItems.filter(i => i.item_name.toLowerCase().includes(query));
  }, [combinedItems, searchQuery]);
  
  // Form Submission & Validation Logic
  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Reset error states before evaluating rules
    setShowItemError(false);
    setPriceError("");
    setShowCustomNameError(false);
    setShowBuyerNameError(false);
    setShowBuyerPhoneError(false);

    let hasValidationError = false;
    const elementsToScroll: HTMLElement[] = [];

    // Rule 1: Validate product selection requirement
    if (!selectedItemId) {
      setShowItemError(true);
      hasValidationError = true;
      if (dropdownRef.current) elementsToScroll.push(dropdownRef.current);
    }

    // Rule 2: Validate custom item name if "custom" type is selected
    if (selectedItemId === "custom" && !customItemName.trim()) {
      setShowCustomNameError(true);
      hasValidationError = true;
      if (customNameInputRef.current) elementsToScroll.push(customNameInputRef.current);
    }

    // Rule 3: Validate buyer profile fields if payment method is set to credit ("dube")
    if (paymentMethod === "dube") {
      if (!buyerName.trim()) {
        setShowBuyerNameError(true);
        hasValidationError = true;
        if (buyerNameInputRef.current) elementsToScroll.push(buyerNameInputRef.current);
      }
      if (!buyerPhone.trim()) {
        setShowBuyerPhoneError(true);
        hasValidationError = true;
        if (buyerPhoneInputRef.current) elementsToScroll.push(buyerPhoneInputRef.current);
      }
    }

    // Rule 4: Price Validation (Forces explicit manual input; auto-fill logic removed)
    const trimmedPrice = String(salePrice).trim();
    if (!trimmedPrice) {
      setPriceError(t.itemPriceRequired || "Price is required");
      hasValidationError = true;
      if (priceInputRef.current) elementsToScroll.push(priceInputRef.current);
    } else if (Number(trimmedPrice) < 0) {
      setPriceError("Price cannot be negative");
      hasValidationError = true;
      if (priceInputRef.current) elementsToScroll.push(priceInputRef.current);
    }

    // UX Focus Transition: Smoothly scroll and shift focus to the first failing field block
    if (hasValidationError) {
      if (elementsToScroll.length > 0) {
        elementsToScroll[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        elementsToScroll[0].focus();
      }
      return;
    }

    if (Number(saleQty) <= 0) return alert("Quantity must be 1 or more.");

    // Execution Context: Fire execution lifecycle method and clear form on completion
    try {
      setIsSubmitting(true);
      await handleRecordSale(e);
      
      setSelectedItemId("");
      setSalePrice("");
      setCustomItemName("");
      setBuyerName("");
      setBuyerPhone("");
      setSaleQty(1);
      setIsOpen(false);
      setShowItemError(false);
      setPriceError("");
      setShowCustomNameError(false);
      setShowBuyerNameError(false);
      setShowBuyerPhoneError(false);
    } catch (error) {
      console.error("Submission failed: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Product Selection Setter: Updates state metrics, cleans values (leaves price empty for manual entry)
  const selectProductItem = (val: string) => {
    setIsOpen(false);
    setSearchQuery(''); 
    setShowItemError(false); 
    setShowCustomNameError(false);

    if (String(val).startsWith("custom_saved_")) {
      const extractedCustomName = String(val).replace("custom_saved_", "");
      setSelectedItemId("custom");
      setCustomItemName(extractedCustomName);
      setSalePrice("");
      return;
    }

    setSelectedItemId(val);
    setSalePrice(""); // Reset price state so user enters it manually every time
    setPriceError("");
    
    if (val === "custom" || val === "") {
      setCustomItemName("");
    }
  };

  // Payment Method State Observer: Flushes user details if moving away from credit "dube" type
  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    if (method !== 'dube') {
      setBuyerName('');
      setBuyerPhone('');
      setShowBuyerNameError(false);
      setShowBuyerPhoneError(false);
    }
  };

  return (
    <div 
      className="space-y-4 max-w-md mx-auto antialiased selection:bg-[#1a5fb4]/10 dark:selection:bg-blue-500/20 px-0.5"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* SECTION: Quick Tap Selection (Top-performed items row) */}
      <QuickTapSelection
        frequentItems={frequentItems}
        selectedItemId={selectedItemId}
        isSubmitting={isSubmitting}
        handleQuickSelect={(item) => {
          setShowItemError(false);
          handleQuickSelect(item);
        }}
        t={t}
      />

      <form 
        onSubmit={onFormSubmit} 
        noValidate 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4.5 shadow-2xs space-y-4"
      >
        
        {/* SECTION: Searchable Combobox / Dropdown Menu */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />
              {t.selectItem || "Select Product"}
              <span className="text-red-500 font-bold">*</span>
            </label>
          </div>
          
          <div className="relative">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border outline-none text-sm bg-slate-50 dark:bg-slate-950/40 text-left transition-all disabled:opacity-60 truncate flex justify-between items-center cursor-pointer
                ${showItemError 
                  ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/10 focus:ring-red-500/20' 
                  : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] focus:dark:border-blue-500'
                } text-slate-700 dark:text-slate-200`}
            >
              <span className="truncate">{selectedItemLabel}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 transform transition-transform duration-150 shrink-0" />
            </button>

            {/* Error Message: Selection Failure */}
            {showItemError && (
              <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium mt-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.chooseItemPlaceholder || "Please select a product"}</span>
              </div>
            )}

            {/* Dropdown Options Drawer Panel */}
            {isOpen && (
              <div className="absolute z-40 w-full mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64">
                {/* Search Field Input */}
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
                {/* Scrollable Results Listing */}
                <div className="overflow-y-auto divide-y divide-slate-50 dark:divide-slate-900/60 flex-1 scrollbar-thin">
                  {/* Option: Setup Unregistered / Custom Item Sale */}
                  <button
                    type="button"
                    onClick={() => selectProductItem("custom")}
                    className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${selectedItemId === 'custom' ? 'bg-[#1a5fb4]/5 dark:bg-blue-500/10 text-[#1a5fb4] dark:text-blue-400 font-medium' : 'text-[#1a5fb4] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 font-medium'}`}
                  >
                    <span>✨ + {t.unregisteredSale || "Custom Item"}</span>
                    {selectedItemId === 'custom' && <Check className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400" />}
                  </button>

                  {/* Options: Standard Inventory Items Match List */}
                  {filteredItems.map((i) => {
                    const isItemActive = String(i.id) === String(selectedItemId);
                    return (
                      <button
                        type="button"
                        key={i.id}
                        onClick={() => selectProductItem(i.id)}
                        className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${isItemActive ? 'bg-[#1a5fb4]/5 dark:bg-blue-500/10 text-[#1a5fb4] dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
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
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: Custom Field Block (Rendered if 'Custom Item' is selected) */}
        {selectedItemId === "custom" && (
          <div className="p-3.5 bg-blue-50/30 dark:bg-blue-950/10 rounded-xl border border-dashed border-[#1a5fb4]/20 dark:border-blue-500/20 space-y-1.5 animate-fade-in">
            <label className="block text-xs font-medium text-[#1a5fb4] dark:text-blue-400">
              {t.itemName || "Item Name"} <span className="text-red-500 font-bold">*</span>
            </label>
            <input 
              type="text" 
              ref={customNameInputRef}
              value={customItemName}
              disabled={isSubmitting}
              onChange={(e) => {
                setCustomItemName(e.target.value);
                if (e.target.value.trim()) setShowCustomNameError(false);
              }}
              placeholder={t.itemNamePlaceholder || "Enter custom item name"} 
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 outline-none transition-all text-slate-800 dark:text-slate-200
                ${showCustomNameError 
                  ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/10' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-[#1a5fb4] focus:dark:border-blue-500'
                }`}
            />
            {showCustomNameError && (
              <div className="flex items-center gap-1 text-xxs text-red-500 dark:text-red-400 font-medium mt-1 animate-pulse">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{t.itemNameRequired}</span>
              </div>
            )}
          </div>
        )}

        {/* SECTION: Segmented Payment Method Selector Tabs */}
        <SegmentedPaymentTabs
          paymentMethod={paymentMethod}
          isSubmitting={isSubmitting}
          handlePaymentMethodChange={handlePaymentMethodChange}
          t={t}
        />

        {/* SECTION: Buyer Info Panel (Rendered only if payment method is "dube" / credit) */}
        {paymentMethod === "dube" && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 animate-fade-in">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
              <Info className="w-3.5 h-3.5 text-[#1a5fb4] dark:text-blue-400" />
              {t.dubeBuyerInfo || "Credit Customer Logistics"}
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Buyer Name Input */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <User className="w-3 h-3" /> {t.buyerName || "Buyer Name"} <span className="text-red-500 font-bold">*</span>
                </label>
                <input 
                  type="text" 
                  ref={buyerNameInputRef}
                  value={buyerName}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (e.target.value.trim()) setShowBuyerNameError(false);
                  }}
                  placeholder="e.g. Almaz" 
                  className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none
                    ${showBuyerNameError 
                      ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/10' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-[#1a5fb4]'
                    }`}
                />
                {showBuyerNameError && (
                  <div className="flex items-center gap-1 text-xxs text-red-500 dark:text-red-400 font-medium mt-1 animate-pulse">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{t.buyerNameRequired}</span>
                  </div>
                )}
              </div>
              {/* Buyer Phone Contact Input */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <Phone className="w-3 h-3" /> {t.buyerPhone || "Phone"} <span className="text-red-500 font-bold">*</span>
                </label>
                <input 
                  type="text" 
                  inputMode="tel"
                  ref={buyerPhoneInputRef}
                  value={buyerPhone}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setBuyerPhone(e.target.value);
                    if (e.target.value.trim()) setShowBuyerPhoneError(false);
                  }}
                  placeholder="09..." 
                  className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none
                    ${showBuyerPhoneError 
                      ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/10' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-[#1a5fb4]'
                    }`}
                />
                {showBuyerPhoneError && (
                  <div className="flex items-center gap-1 text-xxs text-red-500 dark:text-red-400 font-medium mt-1 animate-pulse">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{t.phoneNumberRequired}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Grid Container for Transaction Price & Quantity Stepper */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Item Unit Price Input (Strictly manual entry) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              {t.priceSold || "Price"} <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative flex flex-col">
              <div className="relative flex items-center w-full">
                <input 
                  type="number" 
                  inputMode="decimal"
                  min="0"
                  step="any"
                  ref={priceInputRef}
                  value={salePrice || ''}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setSalePrice(e.target.value);
                    if (e.target.value.trim() && Number(e.target.value) >= 0) {
                      setPriceError(""); 
                    }
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                  className={`w-full pl-3.5 pr-12 py-2.5 rounded-xl border outline-none text-sm bg-slate-50 dark:bg-slate-950/40 font-normal text-slate-800 dark:text-slate-200 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60 placeholder:text-slate-400 dark:placeholder:text-slate-600
                    ${priceError 
                      ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/10 focus:ring-red-500/20' 
                      : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] focus:dark:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 focus:dark:ring-blue-500/10'
                    }`}
                />
                <span className="absolute right-3.5 text-xs font-medium text-slate-400 dark:text-slate-500 pointer-events-none">
                  {t.currency || "ETB"}
                </span>
              </div>

              {/* Price Inline Error */}
              {priceError && (
                <div className="flex items-center gap-1 text-xxs text-red-500 dark:text-red-400 font-medium mt-1 animate-pulse">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{priceError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Input: Sales Quantity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">{t.quantity || "Qty"}</label>
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40 h-[40px] p-1">
              <button 
                type="button" 
                disabled={isSubmitting || Number(saleQty) <= 1}
                onClick={() => setSaleQty(prev => Math.max(1, (Number(prev) || 1) - 1))}
                className="w-8 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm cursor-pointer"
              >
                -
              </button>
              <span className="flex-1 text-center font-medium text-sm text-slate-800 dark:text-slate-200">{saleQty}</span>
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => setSaleQty(prev => (Number(prev) || 0) + 1)}
                className="w-8 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: Optional Backdated / Custom Date Input */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {t.date || "Date Override"}
          </label>
          <input 
            type="date" 
            value={saleDate}
            disabled={isSubmitting}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* SECTION: Form Actions & Submit Trigger button */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-[#1a5fb4] hover:bg-[#154b91] text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all cursor-pointer mt-2 disabled:bg-slate-300 dark:disabled:bg-slate-800"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{t.savingSale || "Saving Sale..."}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>{t.saveSale || "Save Sale"}</span>
            </>
          )}
        </button>
      </form>

      {/* SECTION: Background Cloud Sync Modal Backdrop Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="w-11/12 max-w-xs rounded-2xl bg-white dark:bg-slate-900 p-6 text-center shadow-xl border border-slate-100 dark:border-slate-800/60">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30 text-[#1a5fb4] mb-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{t.syncingTitle || "Syncing Records..."}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto">{t.syncingSales || "Uploading transactional shifts to the remote cloud."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
