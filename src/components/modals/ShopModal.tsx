// src/components/ShopModal.tsx
import React from 'react';
import CustomModal from '../common/CustomModal';
import { UserProfile } from '../../types';

interface ShopModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newShopName: string;
  setNewShopName: (v: string) => void;
  newShopLocation: string;
  setNewShopLocation: (v: string) => void;
  newShopOwner: string;
  setNewShopOwner: (v: string) => void;
  potentialOwners: UserProfile[];
  t: any;
}

export function ShopModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  newShopName,
  setNewShopName,
  newShopLocation,
  setNewShopLocation,
  newShopOwner,
  setNewShopOwner,
  potentialOwners = [],
  t
}: ShopModalProps) {
  
  const isEditing = mode === 'edit';

  return (
    <CustomModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? (t.editShop || 'Edit Shop') : (t.addShopBtn || 'Add Shop')}
    >
      <form 
        onSubmit={onSubmit} 
        className="space-y-4 antialiased text-slate-700 dark:text-slate-300"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      >
        
        {/* Shop Name Input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            {t.shopName || 'Shop Name'}
          </label>
          <input
            type="text"
            value={newShopName}
            onChange={(e) => setNewShopName(e.target.value)}
            placeholder={t.shopNamePlaceholder}
            className="w-full px-3 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 focus:bg-white focus:dark:bg-slate-950 outline-none transition-all"
            required
          />
        </div>

        {/* Location Input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            {t.location || 'Location'}
          </label>
          <input
            type="text"
            value={newShopLocation}
            onChange={(e) => setNewShopLocation(e.target.value)}
            placeholder={t.locationPlaceholder}
            className="w-full px-3 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 focus:bg-white focus:dark:bg-slate-950 outline-none transition-all"
            required
          />
        </div>

        {/* Owner Assignment Dropdown */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            {t.ownerLabel || 'Owner'}
          </label>
          <div className="relative">
            <select
              value={newShopOwner}
              onChange={(e) => setNewShopOwner(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-900/60 focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 focus:bg-white focus:dark:bg-slate-950 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="dark:bg-slate-950">{t.selectOwnerPlaceholder || '-- Select Active Owner --'}</option>
              {potentialOwners.map((owner) => (
                <option key={owner.id} value={owner.id} className="dark:bg-slate-950">
                  {owner.identifier} ({owner.businessName || 'N/A'})
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-3.5 pointer-events-none w-2 h-2 border-r-2 border-b-2 border-slate-400 dark:border-slate-500 transform rotate-45" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-white/50 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            {t.cancelBtn || 'Cancel'}
          </button>
          <button
            type="submit"
            className="flex-1 py-3 text-white bg-[#1a5fb4] hover:bg-[#154b91] dark:bg-[#1a5fb4] dark:hover:bg-[#154b91] rounded-xl text-xs font-bold tracking-wider transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {t.saveBtn || 'Save'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}
