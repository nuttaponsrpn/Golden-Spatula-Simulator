export type ChampionCost = 1 | 2 | 3 | 4 | 5;

export interface ChampionAbility {
  name: string;
  description: string;
  mana?: number;
  iconUrl?: string;
  scalingValues?: string;
}

export interface Champion {
  id: string;
  name: string;
  cost: ChampionCost;
  traits: string[];
  imageUrl: string;
  isHero: boolean;
  ability: ChampionAbility;
  damage: number;
}
