export type TraitType = "origin" | "class";

export type TraitTier = "bronze" | "silver" | "gold" | "prismatic";

export interface TraitThreshold {
  count: number;
  tier: TraitTier;
  bonus: string;
}

export interface Trait {
  id: string;
  name: string;
  type: TraitType;
  description: string;
  thresholds: TraitThreshold[];
  imageUrl: string;
}

export interface SynergyActivation {
  trait: Trait;
  activeCount: number;
  activeTier: TraitTier | null;
  activeThreshold: TraitThreshold | null;
  nextThreshold: TraitThreshold | null;
  contributingUnitIds: string[];
}
