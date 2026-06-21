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

/**
 * ShopModal handles the creation and editing of retail store branch records.
 * It consumes pre-filtered admin profiles to populate the owner selection dropdown.
 */
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
      <form onSubmit={onSubmit} className="space-y-4 font-sans antialiased text-slate-700">
        
        {/* Shop Name Input */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t.shopName || 'Shop Name'}
          </label>
          <input
            type="text"
            value={newShopName}
            onChange={(e) => setNewShopName(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200/70 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white outline-none transition-all"
            required
          />
        </div>

        {/* Location Input */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t.location || 'Location'}
          </label>
          <input
            type="text"
            value={newShopLocation}
            onChange={(e) => setNewShopLocation(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200/70 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white outline-none transition-all"
            required
          />
        </div>

        {/* Owner Assignment Dropdown */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t.ownerLabel || 'Owner'}
          </label>
          <div className="relative">
            <select
              value={newShopOwner}
              onChange={(e) => setNewShopOwner(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200/70 outline-none text-sm font-semibold text-slate-800 bg-slate-50/80 focus:border-slate-400 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">{t.selectOwnerPlaceholder || '-- Select Active Owner --'}</option>
              {potentialOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.identifier} ({owner.businessName || 'N/A'})
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-3.5 pointer-events-none w-2 h-2 border-r-2 border-b-2 border-slate-400 transform rotate-45" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-white/50 border border-slate-200/40 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            {t.cancelBtn || 'Cancel'}
          </button>
          <button
            type="submit"
            className="flex-1 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm cursor-pointer"
            style={{ backgroundColor: '#1a5fb4' }}
          >
            {t.saveBtn || 'Save'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}
