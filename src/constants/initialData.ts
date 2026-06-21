// src/constants/initialData.ts
import { UserProfile, Shop, Sale, DubeRecord } from '../types';
import { ItemRecord } from '../types/inventory';

/**
 * Generates a clean ISO date string relative to the current timestamp.
 * Used to keep dynamic checkout histories relative during hydration bootstrapping.
 */
export const getPastDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

/**
 * Baseline Storefront Seed Data
 */
export const INITIAL_SHOPS: Shop[] = [
  { id: "shop-bole", name: "Bole Medhanialem Traditional", location: "Bole, Addis Ababa", ownerId: "user-admin-bole" },
  { id: "shop-piassa", name: "Piassa Golden Tilet Boutique", location: "Piassa, Addis Ababa", ownerId: "user-admin-piassa" },
  { id: "shop-megenagna", name: "Megenagna Outlet", location: "Megenagna, Addis Ababa", ownerId: "user-admin-piassa" }
];

/**
 * Baseline User Profiles Seed Data
 */
export const INITIAL_USERS: UserProfile[] = [
  { 
    id: "user-super", 
    full_name: "Super Administrator",
    identifier: "0900000000", 
    email: "super@store.com", 
    password: "super123", 
    role: "super_admin", 
    shop_id: null, 
    businessName: "Habesha Retail Group PLC", 
    approved: true 
  },
  { 
    id: "user-admin-piassa", 
    full_name: "Piassa Manager",
    identifier: "0922222222", 
    email: "piassa@store.com", 
    password: "piassa123", 
    role: "admin", 
    shop_id: "shop-piassa", 
    businessName: "Piassa Golden Tilet Boutique", 
    approved: true 
  },
  { 
    id: "user-admin-bole", 
    full_name: "Bole Manager",
    identifier: "0911111111", 
    email: "bole@store.com", 
    password: "bole123", 
    role: "admin", 
    shop_id: "shop-bole", 
    businessName: "Bole Medhanialem Traditional", 
    approved: false 
  },
  { 
    id: "user-sales-piassa", 
    full_name: "Piassa Cashier",
    identifier: "0933333333", 
    email: "sales@store.com", 
    password: "sales123", 
    role: "sales", 
    shop_id: "shop-piassa", 
    businessName: "Piassa Golden Tilet Boutique", 
    approved: true,
    createdBy: "user-admin-piassa"
  }
];

/**
 * Standardized Product Matrix Inventory Seeds
 */
export const INITIAL_ITEMS: ItemRecord[] = [
  { id: "item-1", item_name: "Traditional Dress (Tilet)", default_price: 3200, shop_id: "shop-bole", quantity: 12 },
  { id: "item-2", item_name: "Men's Traditional Shirt", default_price: 1800, shop_id: "shop-bole", quantity: 8 },
  { id: "item-3", item_name: "Netela (Double Layer)", default_price: 800, shop_id: "shop-piassa", quantity: 25 },
  { id: "item-4", item_name: "Premium Silk Habesha Dress", default_price: 6500, shop_id: "shop-piassa", quantity: 4 },
  { id: "item-5", item_name: "Kids Traditional Wear", default_price: 1100, shop_id: "shop-megenagna", quantity: 15 }
];

/**
 * Standardized Transactional History Seed Data
 */
export const INITIAL_SALES: Sale[] = [
  { id: "sale-1", item_id: "item-1", item_name: "Traditional Dress (Tilet)", quantity: 1, price_sold: 3200, sale_date: getPastDateString(0), shop_id: "shop-bole", payment_method: "cash" },
  { id: "sale-2", item_id: "item-3", item_name: "Netela (Double Layer)", quantity: 2, price_sold: 800, sale_date: getPastDateString(0), shop_id: "shop-piassa", payment_method: "transfer" },
  { id: "sale-3", item_id: "item-2", item_name: "Men's Traditional Shirt", quantity: 1, price_sold: 1800, sale_date: getPastDateString(1), shop_id: "shop-bole", payment_method: "cash" },
  { id: "sale-4", item_id: "item-4", item_name: "Premium Silk Habesha Dress", quantity: 1, price_sold: 6500, sale_date: getPastDateString(2), shop_id: "shop-piassa", payment_method: "dube" },
  { id: "sale-5", item_id: "item-1", item_name: "Traditional Dress (Tilet)", quantity: 1, price_sold: 3500, sale_date: getPastDateString(3), shop_id: "shop-bole", payment_method: "cash" },
  { id: "sale-6", item_id: "item-5", item_name: "Kids Traditional Wear", quantity: 2, price_sold: 1100, sale_date: getPastDateString(4), shop_id: "shop-megenagna", payment_method: "transfer" }
];

/**
 * Unified Uncollateralized Credit (Dube Ledger) Initial Seeds
 */
export const INITIAL_DUBE_RECORDS: DubeRecord[] = [
  {
    id: 'dube-mock-1',
    sale_id: 'sale-4', // Tied directly to sale-4 item index entry above
    buyer_name: 'Abebe Kebede',
    buyer_phone: '0911223344',
    amount: 6500,
    status: 'unpaid',
    created_at: new Date().toISOString(),
    shop_id: 'shop-piassa'
  }
];
