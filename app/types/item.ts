// app/types/item.ts

export type ItemCategory = 'basic' | 'combined' | 'radiant' | 'artifact' | 'emblem' | 'special' | 'other';

export interface ItemStat {
  value: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  stats: ItemStat[];
  effect: string;
  imageUrl: string;
  category: ItemCategory;
  components?: [string, string]; // IDs of the two component items that combine into this
}

export type ItemSlot = Item | null;
export type UnitItems = [ItemSlot, ItemSlot, ItemSlot]; // fixed 3-slot tuple
