# Comp Strategy Guide

Principles for building team compositions in TFT Set 14. Used as context for the AI advisor and scoring system.

---

## Team Structure

Every strong comp has three layers:

```
Carry     (1–2 units)   → main damage dealer, needs items
Flex      (3–5 units)   → fills synergy thresholds, supports carry
Frontline (2–3 units)   → absorbs damage, buys carry time
```

---

## Anchor Champion

**What it is:** A champion the player commits to keeping in every comp — usually one where items are already built or which opens a key synergy.

**In this project:** The anchor is chosen when creating a new chat session. The AI will always include anchor champions in every comp it recommends.

**How to choose an anchor:**
- Champion that already has dedicated items (e.g. IE + RFC on an ADC)
- Champion that opens the main synergy of the comp
- Avoid anchoring cost 1–2 units if the plan is to reroll the team later

---

## Synergy Priority

**Order of importance when selecting synergies:**

1. **Active threshold ≥ 1** — must have at least one active synergy; inactive traits waste slots
2. **Higher tier is better** — prismatic > gold > silver > bronze
3. **Near-active threshold (≤ 2 away)** — easy to complete with 1–2 more units
4. **Splash synergy** — champions that contribute to 2+ synergies in one slot

**Example:** Caitlyn (Enforcer, Sniper) + Vi (Enforcer, Bruiser) covers both Enforcer and Bruiser from two units.

---

## Carry Selection

**Cost tier as proxy:**
- Cost 4–5 = primary carry candidates
- Cost 3 = secondary carry or flex

**Item priority on carry:**
- Damage items (Deathblade, Rabadon) → burst/sustained damage
- Attack speed (RFC, Guinsoo) → auto-attack carry
- Mana (Blue Buff, Shojin) → spell-based carry

**Rule:** Avoid spreading strong items across more than 2 units — spreading weakens everything.

---

## Frontline Balance

**Why frontline matters:**
- Carries need time to ramp up (stack items, cast spells)
- Without tanks, carries die before they deal damage

**Guidelines:**
- ≥ 7 units: need 3+ frontline
- < 7 units: 2 frontline is enough
- Bruiser trait is a reliable frontline choice (HP scaling)

---

## Early / Mid / Late Game Strategy

### Early (Rounds 1–3)
- Build econ (interest gold) — avoid rolling unless necessary
- Use cost 1–2 units that share synergies with the target comp
- Win streak or loss streak beats neutral

### Mid (Rounds 4–5)
- Start finding core units of the comp
- Roll if HP drops below 50 or a key unit appears in the shop
- Transition from early comp to target comp

### Late (Stage 5+)
- Level 8–9 to slot in cost 4–5 units
- Roll down if core units are still missing
- 2-star carry is the highest priority

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| No carry at all | Low damage, lose late game | Add at least 1 cost-4+ unit |
| Too little frontline | Carry dies instantly | Add 2–3 Bruiser/Tank units |
| Spreading across too many synergies | No active synergies | Focus on 2–3 core synergies |
| Spreading items across all units | No strong unit | Concentrate items on 1–2 carries |
| Rolling too late | Units remain low level | Roll when HP < 50 |
