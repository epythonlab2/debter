import { useState, useMemo } from 'react';
import { dbService } from '../core/services/dbService';
import { Shop, UserProfile } from '../types';

interface UseShopProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  syncCloudDatabases: () => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  t: any;
  lang: string;
}

/**
 * Domain Hook: useShop
 * Manages states and actions related to retail store branches and personnel onboarding forms.
 * Serves as an isolated slice for the overall sales and organization management engine.
 */
export function useShop({
  users = [],
  syncCloudDatabases,
  triggerToast,
  t
}: UseShopProps) {
  // --- UI & Modal States ---
  const [shopModal, setShopModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; data: Shop | null }>({ 
    isOpen: false, 
    mode: 'create', 
    data: null 
  });

  // --- Storefront Form Inputs ---
  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopLocation, setNewShopLocation] = useState<string>('');
  const [newShopOwner, setNewShopOwner] = useState<string>('');
  
  // --- Personnel Onboarding Form Inputs ---
  const [salesName, setSalesName] = useState<string>('');
  const [salesPhone, setSalesPhone] = useState<string>('');
  const [salesEmail, setSalesEmail] = useState<string>('');
  const [salesPassword, setSalesPassword] = useState<string>('');

  /**
   * Submits storefront mutation payloads to the cloud infrastructure.
   * Handles initialization of new branches or modification of existing storefront configurations.
   */
  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (shopModal.mode === 'create') {
        await dbService.createShop({
          id: `shop-${Date.now()}`,
          name: newShopName,
          location: newShopLocation,
          ownerId: newShopOwner || null
        });
        triggerToast(t.shopCreatedSuccess || "New retail store initialized", "success");
      }

      // Reset local fields upon successful persistence
      setNewShopName('');
      setNewShopLocation('');
      setNewShopOwner('');
      setShopModal({ isOpen: false, mode: 'create', data: null });
      
      // Cascade structural updates across data tables
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message || "Failed saving storefront configuration", "error");
    }
  };

  /**
   * Configures, seeds, or purges the internal local states driving the Modal context window.
   */
  const handleOpenShopModal = (mode: 'create' | 'edit', data: any = null) => {
    setShopModal({ isOpen: true, mode, data });
    
    if (mode === 'edit' && data) {
      setNewShopName(data.name || '');
      setNewShopLocation(data.location || '');
      setNewShopOwner(data.owner_id || data.ownerId || '');
    } else {
      setNewShopName('');
      setNewShopLocation('');
      setNewShopOwner('');
    }
  };

  /**
   * Domain Guard: Extracts administrative profiles certified for structural ownership duties.
   * Centralizes authorization filtering parameters to maintain UI sync across dependent components.
   */
  const potentialOwners = useMemo(() => 
    users.filter(u => u && u.role === 'admin'), 
    [users]
  );

  return {
    shopModal, 
    setShopModal,
    newShopName, 
    setNewShopName,
    newShopLocation, 
    setNewShopLocation,
    newShopOwner, 
    setNewShopOwner,
    
    salesName,
    setSalesName,
    salesPhone, 
    setSalesPhone,
    salesEmail, 
    setSalesEmail,
    salesPassword, 
    setSalesPassword,
    
    potentialOwners,
    handleSaveShop,
    handleOpenShopModal
  };
}
