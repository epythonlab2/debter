// src/types/boot.ts

export type BootState =
  | "INIT"
  | "HYDRATING"
  | "READY"
  | "AUTHED"
  | "ERROR";

export interface BootUser {
  id: string;
  identifier: string;
  role: string;
  shop_id: string;
  approved: boolean;
}

export interface BootContext {
  state: BootState;
  user: BootUser | null;
  error: string | null;
}
