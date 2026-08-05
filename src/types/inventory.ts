// src/types/inventory.ts

/**
 * Supported units of measurement for retail and wholesale products
 */
export type UnitOfMeasure = 'Pcs' | 'Kg' | 'Litre' |'Meter' | 'Box' | 'Pack' | 'Carton' | string;

/**
 * ============================================================================
 * INTERFACE: ItemRecord
 * ============================================================================
 * Core data schema for an inventory item/SKU record.
 */
export interface ItemRecord {
  /** Unique primary key (UUIDv4) */
  id: string;
  
  /** Foreign key mapping to shop/store */
  shop_id?: string;
  
  /** Stock keeping unit or barcode */
  code?: string;
  
  /** Item description name */
  item_name: string;
  
  /** Standard retail selling price in local currency (ETB) */
  default_price: number;

  /** Cost price / wholesale buying price for margin calculation */
  cost_price?: number;
  
  /** Current available physical stock count */
  quantity?: number;
  
  /** Minimum inventory threshold before triggering a Low Stock alert */
  min_stock_level?: number;
  
  /** Base unit of measurement (e.g., 'pcs', 'kg') */
  unit?: UnitOfMeasure;

  /** Timestamps for audit trails */
  created_at?: string;
  updated_at?: string;
}

/**
 * ============================================================================
 * INTERFACE: InventoryTranslation
 * ============================================================================
 * Internationalization (i18n) key map for the inventory system.
 */
export interface InventoryTranslation {
  addInventoryItem: string;
  modifyItem?: string; 
  itemName: string;
  itemNamePlaceholder?: string;
  priceEtb: string;
  unitCostEtb?: string;
  quantity: string;
  currentStock?: string;
  initialQuantity?: string;
  registerItem: string;
  saveChange?: string;       
  searchInventory: string;
  noSalesGeneric: string;
  noInventoryFound?: string;
  stock: string;
  unit?: string;
  status?: string;
  pcs: string;
  kg?: string;
  ltr?: string;
  box?: string;
  ctn?: string;
  pack?: string;
  currency: string;
  outOfStock?: string;
  lowStock?: string;
  inStock?: string;
  minStockAlert?: string;
  actions?: string;            
  rows?: string;
  alreadyExist?: string;
  addExistingStock?: string;
  mergeUpdate?: string;
  edit?: string;
  deleteBtn?: string;
  cancelBtn?: string;
  itemNameRequired?: string;
  invalidPrice?: string;
  errorGeneric?: string;
}

/**
 * ============================================================================
 * INTERFACE: InventoryTabProps
 * ============================================================================
 */
export interface InventoryTabProps {
  /* --- Local Form Bindings --- */
  itemName: string;
  setItemName: (val: string) => void;
  newInvPrice: string;
  setNewInvPrice: (val: string) => void;
  itemQuantity: string;
  setItemQuantity: (val: string) => void;
  
  /* --- Search & Filtering --- */
  inventorySearch: string;
  setInventorySearch: (val: string) => void;
  
  /* --- Core Actions & Mutations --- */
  handleRegisterItem: (e: React.FormEvent, id: string | null) => Promise<void> | void;
  triggerDeleteConfirm: (type: 'item' | 'shop' | 'sale', id: string) => void;
  
  /* --- Data Sets --- */
  scopedItems: ItemRecord[];
  items: ItemRecord[];
  t: InventoryTranslation;
  
  /* --- Modal & View States --- */
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalMode: 'create' | 'edit';
  setModalMode: (mode: 'create' | 'edit') => void;
  selectedItemId: string | null; 
  setSelectedItemId: (id: string | null) => void;

  /* --- Pagination --- */
  pageSize: number;
  setPageSize: (size: number) => void;
}

/**
 * ============================================================================
 * SUB-COMPONENT PROPS: InputFieldProps
 * ============================================================================
 */
export interface InputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  min?: string;
  step?: string;
  disabled?: boolean;
  required?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'search' | 'email' | 'url';
}

/**
 * ============================================================================
 * SUB-COMPONENT PROPS: InventoryModalProps
 * ============================================================================
 */
export interface InventoryModalProps {
  onSubmit: (e: React.FormEvent) => void;
  mode: 'create' | 'edit';
  values: { 
    itemName: string; 
    newInvPrice: string; 
    itemQuantity: string;
  };
  setters: {
    setItemName: (val: string) => void;
    setNewInvPrice: (val: string) => void;
    setItemQuantity: (val: string) => void;
  };
  globalItems: ItemRecord[];
  onClose: () => void;
  t: InventoryTranslation;
  
  /* Optional extended form handlers */
  unit?: UnitOfMeasure;
  setUnit?: (unit: UnitOfMeasure) => void;
  unitCost?: string;
  setUnitCost?: (cost: string) => void;
  minStockLevel?: string;
  setMinStockLevel?: (min: string) => void;
}

/**
 * ============================================================================
 * SUB-COMPONENT PROPS: InventoryListProps
 * ============================================================================
 */
export interface InventoryListProps {
  items: ItemRecord[];
  onEdit: (item: ItemRecord) => void;
  onDelete: (type: 'item' | 'shop' | 'sale', id: string) => void;
  t: InventoryTranslation;
  pageSize: number;
  selectedIds?: string[];
  onSelectToggle?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
}

/**
 * ============================================================================
 * SUB-COMPONENT PROPS: InventoryRowProps
 * ============================================================================
 */
export interface InventoryRowProps {
  item: ItemRecord;
  onEdit: (item: ItemRecord) => void;
  onDelete: (type: 'item' | 'shop' | 'sale', id: string) => void;
  t: InventoryTranslation;
  isSelected?: boolean;
  onSelectToggle?: (id: string) => void;
}

/**
 * ============================================================================
 * HOOK CONFIGURATION PROPS: UseInventoryProps
 * ============================================================================
 */
export interface UseInventoryProps {
  currentUser: any;
  items: ItemRecord[];
  setItems: React.Dispatch<React.SetStateAction<ItemRecord[]>>;
  selectedShopFilter: string;
  syncCloudDatabases: () => Promise<void>;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
  lang: 'en' | 'am';
  t: InventoryTranslation;
}