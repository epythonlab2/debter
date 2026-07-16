import { UserProfile, Shop, Sale, DubeRecord } from '../types';
import { ItemRecord } from '../types/inventory';

/**
 * Generates a clean ISO date string relative to the current timestamp.
 */
export const getPastDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

/**
 * Baseline Storefront Seed Data - Clean Slate
 */
export const INITIAL_SHOPS: Shop[] = [];

/**
 * Baseline User Profiles Seed Data - Clean Slate
 */
export const INITIAL_USERS: UserProfile[] = [];

/**
 * Standardized Product Matrix Inventory Seeds - Clean Slate
 */
export const INITIAL_ITEMS: ItemRecord[] = [];

/**
 * Standardized Transactional History Seed Data - Clean Slate
 */
export const INITIAL_SALES: Sale[] = [];

/**
 * Unified Uncollateralized Credit (Dube Ledger) Initial Seeds - Clean Slate
 */
export const INITIAL_DUBE_RECORDS: DubeRecord[] = [];
