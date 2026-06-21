// src/types/inventory.ts

/**
 * ============================================================================
 * INTERFACE: ItemRecord
 * ============================================================================
 * Represents the fundamental data schema for an inventory item/SKU record 
 * stored within local reactive states and the remote database system.
 */
export interface ItemRecord {
  /** Unique structural identification key (typically UUIDv4 generated) */
  id: string;
  
  /** Descriptive runtime label name of the inventory item */
  item_name: string;
  
  /** The standard base pricing value calculated in local currency */
  default_price: number;
  
  /** Current physical stock capacity sitting in shop bounds (defaults to 0 if omitted) */
  quantity?: number;
  
  /** Foreign key pointing to the managing retail location/shop assignment */
  shop_id?: string;
}

/**
 * ============================================================================
 * INTERFACE: InventoryTranslation
 * ============================================================================
 * Outlines the strict internationalization (i18n) localization key map
 * required to swap language packages dynamically across the UI text nodes.
 */
export interface InventoryTranslation {
  /** Action title trigger to add a product record (e.g., "Add Inventory Item") */
  addInventoryItem: string;
  
  /** Optional view context label modifier when transforming form layouts to edit modes */
  modifyItem?: string; 
  
  /** Form text descriptor for descriptive naming inputs */
  itemName: string;
  
  /** Interactive placeholder prompt displayed inside empty text bounds */
  itemNamePlaceholder?: string;
  
  /** Explicit currency label definition tracking price records (e.g., "Price (ETB)") */
  priceEtb: string;
  
  /** Form row indicator mapping physical numerical availability counts */
  quantity: string;
  
  /** Action execution title for fresh element submission buttons */
  registerItem: string;
  
  /** Optional completion prompt label for modification forms */
  saveChange?: string;       
  
  /** Placeholder hint text binding inside the inventory query search text inputs */
  searchInventory: string;
  
  /** Fallback layout prompt rendered when filtering returns an empty matrix array */
  noSalesGeneric: string;
  
  /** Column header title text marking available capacities */
  stock: string;
  
  /** Local units-of-measure signifier text trailing numerical outputs (e.g., "pcs") */
  pcs: string;
  
  /** Local currency operational shorthand designation (e.g., "ETB") */
  currency: string;
  
  /** Optional empty stock warning element flag string (e.g., "Out of Stock") */
  outOfStock?: string;
  
  /** Optional header title mapping layout modification/deletion controls */
  actions?: string;            

  /** Form row limit pagination options */
  rows?: string;

  /** Form collision state notifications handles */
  alreadyExist?: string;
  addExistingStock?: string;
  mergeUpdate?: string;
  edit?: string;
  deleteBtn?: string;
  cancelBtn?: string;
}

/**
 * ============================================================================
 * INTERFACE: InventoryTabProps
 * ============================================================================
 * Contract declaring type expectations for properties transferred directly
 * downstream into primary UI presentation modules from orchestrating custom hooks.
 */
export interface InventoryTabProps {
  /* --- Local Input Content Bindings --- */
  itemName: string;
  setItemName: (val: string) => void;
  newInvPrice: string;
  setNewInvPrice: (val: string) => void;
  itemQuantity: string;
  setItemQuantity: (val: string) => void;
  
  /* --- Live Query Control Bindings --- */
  inventorySearch: string;
  setInventorySearch: (val: string) => void;
  
  /* --- Core Operation Callbacks --- */
  /** Event wrapper logic managing database insertions, structural mutations, or updates */
  handleRegisterItem: (e: React.FormEvent, id: string | null) => Promise<void> | void;
  /** Action handler targeting resource components for eviction confirmation cycles */
  triggerDeleteConfirm: (type: 'item' | 'shop' | 'sale', id: string) => void;
  
  /* --- Presentation State Values --- */
  /** Compute-limited array matrix sliced directly down to matching workspace records */
  scopedItems: ItemRecord[];
  /** Active localized dictionary instance mapping matching language translation strings */
  t: InventoryTranslation;
  
  /* --- View Management & Modal Control Switches --- */
  /** Condition evaluating if the input action modal workspace should reveal itself */
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  
  /** Mode profile routing modal presentation interfaces to execute writes or modifications */
  modalMode: 'create' | 'edit';
  setModalMode: (mode: 'create' | 'edit') => void;
  
  /** Active database identifier key targeting the record being processed inside mutations */
  selectedItemId: string | null; 
  setSelectedItemId: (id: string | null) => void;

  /* --- Pagination Parameters --- */
  pageSize: number;
  setPageSize: (size: number) => void;
  items: ItemRecord[];
}

/**
 * ============================================================================
 * HOOK CONFIGURATION PROPS: UseInventoryProps
 * ============================================================================
 */
export interface UseInventoryProps {
  /** The currently logged-in user profile domain record */
  currentUser: any;

  /** Local state cached list of synchronized inventory database records */
  items: ItemRecord[];

  /** Upstream state-modifier function dispatched to update the main item array index */
  setItems: React.Dispatch<React.SetStateAction<ItemRecord[]>>;

  /** Active organizational store filtration key */
  selectedShopFilter: string;

  /** Refresh routine targeting background cluster synchronizations */
  syncCloudDatabases: () => Promise<void>;

  /** Layout notification trigger pipeline callback */
  triggerToast: (message: string, type?: 'success' | 'error') => void;

  /** Target runtime locale code framework tracking active translations */
  lang: 'en' | 'am';

  /** Dynamic generic localized text object layout mapping dictionary strings */
  t: InventoryTranslation;
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
  values: { itemName: string; newInvPrice: string; itemQuantity: string };
  setters: {
    setItemName: (val: string) => void;
    setNewInvPrice: (val: string) => void;
    setItemQuantity: (val: string) => void;
  };
  globalItems: ItemRecord[];
  onClose: () => void;
  t: InventoryTranslation;
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
}
