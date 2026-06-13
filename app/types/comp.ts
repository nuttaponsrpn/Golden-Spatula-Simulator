export type ScoreGrade = "S" | "A" | "B" | "C" | "D";

export interface ScoreDimension {
  label: string;
  value: number;
  weight: number;
  feedback: string;
}

export interface CompScore {
  total: number;
  grade: ScoreGrade;
  dimensions: ScoreDimension[];
}

export interface UnitPlacement {
  championId: string;
  itemIds: string[];
  location: string; // "row,col"
  isCarry: boolean;
}

export interface SuggestedComp {
  id: string;
  name: string;
  description: string;
  championIds: string[];
  unitPlacements: UnitPlacement[];
  keyTraits: string[];
  quality: "S" | "A" | "B" | "C";
  difficulty: "easy" | "medium" | "hard";
  playstyle: string;
  imageUrl?: string;
}
