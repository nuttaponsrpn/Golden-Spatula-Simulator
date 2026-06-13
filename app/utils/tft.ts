import type { Champion } from "~/types/champion";
import type { Trait, SynergyActivation } from "~/types/trait";
import type { PlacedUnits } from "~/types/team";
import type { CompScore, ScoreDimension, ScoreGrade } from "~/types/comp";

// ─── Synergy Calculations ────────────────────────────────────────────────────

export function calculateSynergyActivations(
  units: PlacedUnits,
  champions: Champion[],
  traits: Trait[],
): SynergyActivation[] {
  const traitCounts = new Map<string, string[]>();

  for (const unit of units) {
    const champion = champions.find((c) => c.id === unit.championId);
    if (!champion) continue;

    for (const traitId of champion.traits) {
      const existing = traitCounts.get(traitId);
      if (existing) {
        existing.push(unit.id);
      } else {
        traitCounts.set(traitId, [unit.id]);
      }
    }
  }

  const activations: SynergyActivation[] = [];

  for (const [traitId, unitIds] of traitCounts) {
    const trait = traits.find((t) => t.id === traitId);
    if (!trait) continue;

    const activeCount = unitIds.length;
    const sortedThresholds = [...trait.thresholds].sort(
      (a, b) => a.count - b.count,
    );

    let activeThreshold = null;
    let nextThreshold = null;

    for (let i = 0; i < sortedThresholds.length; i++) {
      const threshold = sortedThresholds[i];
      if (!threshold) continue;

      if (activeCount >= threshold.count) {
        activeThreshold = threshold;
      } else if (nextThreshold === null) {
        nextThreshold = threshold;
      }
    }

    activations.push({
      trait,
      activeCount,
      activeTier: activeThreshold?.tier ?? null,
      activeThreshold,
      nextThreshold,
      contributingUnitIds: unitIds,
    });
  }

  return activations.sort((a, b) => {
    const aTierValue = tierValue(a.activeTier);
    const bTierValue = tierValue(b.activeTier);
    if (bTierValue !== aTierValue) return bTierValue - aTierValue;
    return b.activeCount - a.activeCount;
  });
}

function tierValue(tier: string | null): number {
  switch (tier) {
    case "prismatic":
      return 4;
    case "gold":
      return 3;
    case "silver":
      return 2;
    case "bronze":
      return 1;
    default:
      return 0;
  }
}

// ─── Score Dimensions ────────────────────────────────────────────────────────

export function calculateTraitScore(activations: SynergyActivation[]): number {
  if (activations.length === 0) return 0;

  const activeCount = activations.filter((a) => a.activeTier !== null).length;
  const tierBonus = activations.reduce((sum, a) => {
    return sum + tierValue(a.activeTier) * 10;
  }, 0);

  const baseScore = (activeCount / activations.length) * 60;
  const bonus = Math.min(40, tierBonus);
  return Math.min(100, Math.round(baseScore + bonus));
}

export function calculateCarryCoverage(
  units: PlacedUnits,
  champions: Champion[],
): number {
  const carries = units.filter((unit) => {
    const champ = champions.find((c) => c.id === unit.championId);
    // For now, consider cost 4+ as carries since explicit role is gone
    return (champ?.cost ?? 0) >= 4;
  });

  if (carries.length === 0) return 0;
  if (carries.length === 1) return 60;
  if (carries.length === 2) return 85;
  return 100;
}

export function calculateFrontlineBalance(
  units: PlacedUnits,
  champions: Champion[],
): number {
  // Use a heuristic for now: high cost or certain traits could be frontline
  // For simplicity, we'll just count high cost units for now as a placeholder
  const frontlineCount = units.filter((unit) => {
    const champ = champions.find((c) => c.id === unit.championId);
    return champ && (champ.cost >= 3);
  }).length;

  const required = units.length >= 7 ? 3 : 2;

  if (frontlineCount === 0) return 0;
  if (frontlineCount >= required + 1) return 100;
  if (frontlineCount >= required) return 80;
  if (frontlineCount >= required - 1) return 50;
  return 25;
}

export function calculateCostEfficiency(
  units: PlacedUnits,
  champions: Champion[],
): number {
  if (units.length === 0) return 0;

  const totalCost = units.reduce((sum, unit) => {
    const champ = champions.find((c) => c.id === unit.championId);
    return sum + (champ?.cost ?? 1);
  }, 0);

  const avgCost = totalCost / units.length;
  // Map 1.0 → 10, 3.0 → 55, 5.0 → 100
  return Math.round(Math.min(100, ((avgCost - 1) / 4) * 90 + 10));
}

export function calculateSlotEfficiency(unitCount: number): number {
  return Math.round((unitCount / 9) * 100);
}

// ─── Grade Mapping ───────────────────────────────────────────────────────────

function scoreToGrade(score: number): ScoreGrade {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

// ─── Composite Score Builder ─────────────────────────────────────────────────

export function buildCompScore(
  units: PlacedUnits,
  champions: Champion[],
  traits: Trait[],
): CompScore {
  const activations = calculateSynergyActivations(units, champions, traits);

  const traitRaw = calculateTraitScore(activations);
  const carryRaw = calculateCarryCoverage(units, champions);
  const frontlineRaw = calculateFrontlineBalance(units, champions);
  const costRaw = calculateCostEfficiency(units, champions);
  const slotRaw = calculateSlotEfficiency(units.length);

  const activeTraitCount = activations.filter((a) => a.activeTier !== null).length;
  const carryCount = units.filter((u) => {
    const c = champions.find((ch) => ch.id === u.championId);
    return (c?.cost ?? 0) >= 4;
  }).length;

  const dimensions: ScoreDimension[] = [
    {
      label: "Trait Synergy",
      value: traitRaw,
      weight: 0.35,
      feedback: `${activeTraitCount} active ${activeTraitCount === 1 ? "synergy" : "synergies"}`,
    },
    {
      label: "Carry Coverage",
      value: carryRaw,
      weight: 0.25,
      feedback:
        carryCount === 0
          ? "No carry unit"
          : `${carryCount} ${carryCount === 1 ? "carry" : "carries"}`,
    },
    {
      label: "Frontline Balance",
      value: frontlineRaw,
      weight: 0.2,
      feedback: (() => {
        const count = units.filter((u) => {
          const c = champions.find((ch) => ch.id === u.championId);
          return (c?.cost ?? 0) >= 3;
        }).length;
        return `${count} frontline ${count === 1 ? "unit" : "units"}`;
      })(),
    },
    {
      label: "Cost Efficiency",
      value: costRaw,
      weight: 0.1,
      feedback: (() => {
        if (units.length === 0) return "No units";
        const total = units.reduce((s, u) => {
          const c = champions.find((ch) => ch.id === u.championId);
          return s + (c?.cost ?? 1);
        }, 0);
        const avg = (total / units.length).toFixed(1);
        return `Avg cost: ${avg}`;
      })(),
    },
    {
      label: "Slot Efficiency",
      value: slotRaw,
      weight: 0.1,
      feedback: `${units.length}/9 slots filled`,
    },
  ];

  const total = Math.round(
    dimensions.reduce((sum, d) => sum + d.value * d.weight, 0),
  );

  return {
    total,
    grade: scoreToGrade(total),
    dimensions,
  };
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export function buildSuggestions(
  score: CompScore,
  units: PlacedUnits,
  champions: Champion[],
  traits: Trait[],
): string[] {
  const suggestions: string[] = [];

  if (units.length === 0) {
    suggestions.push("เริ่มต้นด้วยการเพิ่มแชมป์ลงบนบอร์ด");
    return suggestions;
  }

  const traitDim = score.dimensions.find((d) => d.label === "Trait Synergy");
  const carryDim = score.dimensions.find((d) => d.label === "Carry Coverage");
  const frontlineDim = score.dimensions.find(
    (d) => d.label === "Frontline Balance",
  );
  const slotDim = score.dimensions.find((d) => d.label === "Slot Efficiency");

  if (carryDim && carryDim.value === 0) {
    suggestions.push(
      "ยังไม่มี Carry — เพิ่มแชมป์ประเภท Carry เช่น Jinx, Caitlyn, หรือ Miss Fortune",
    );
  }

  if (frontlineDim && frontlineDim.value < 50) {
    suggestions.push(
      "Frontline บางเกินไป — เพิ่ม Tank หรือ Bruiser อย่างน้อย 2 ตัวเพื่อปกป้อง Carry",
    );
  }

  if (traitDim && traitDim.value < 40) {
    const activations = calculateSynergyActivations(units, champions, traits);
    const nearActive = activations.filter(
      (a) =>
        a.activeTier === null &&
        a.nextThreshold !== null &&
        a.nextThreshold.count - a.activeCount <= 2,
    );
    if (nearActive.length > 0) {
      const traitName = nearActive[0]?.trait.name ?? "";
      const needed = (nearActive[0]?.nextThreshold?.count ?? 0) - (nearActive[0]?.activeCount ?? 0);
      if (traitName) {
        suggestions.push(
          `เพิ่มแชมป์ ${traitName} อีก ${needed} ตัวเพื่อ activate synergy`,
        );
      }
    } else {
      suggestions.push(
        "ลอง focus ที่ trait เดียวให้ถึง threshold แทนที่จะกระจาย",
      );
    }
  }

  if (slotDim && slotDim.value < 60) {
    suggestions.push(
      `ยังมีที่ว่างอีก ${9 - units.length} slot — เพิ่มแชมป์เพื่อเสริมทีม`,
    );
  }

  const costDim = score.dimensions.find((d) => d.label === "Cost Efficiency");
  if (costDim && costDim.value < 40 && units.length >= 5) {
    suggestions.push(
      "ทีมส่วนใหญ่เป็น 1-2 cost — ลอง upgrade เป็น 3-4 cost เพื่อเพิ่มพลัง",
    );
  }

  if (suggestions.length === 0 && score.total >= 75) {
    suggestions.push("ทีมอยู่ในสภาพดี! ลอง upgrade แชมป์ให้เป็น 2-star เพื่อเพิ่มความแข็งแกร่ง");
  }

  return suggestions;
}
