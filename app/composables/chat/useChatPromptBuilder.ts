import type { Champion } from "~/types/champion";
import type { Item } from "~/types/item";

interface PromptOptions {
  anchorChampions: Champion[];
  allChampions: Champion[];
  allItems: Item[];
  versionName?: string;
}

interface PlannerOptions {
  versionName?: string;
  anchorChampions?: Champion[];
}

interface BuilderOptions {
  versionName?: string;
  plannerOutput: string;
}

const RESPONSE_FORMAT = `## Response Format
ALWAYS respond with a single JSON object. No markdown code blocks. No text outside the JSON.

For clarification questions (before building the comp):
{
  "title": "Short session title (5-8 words in Thai, describing this conversation)",
  "text": "your clarification questions here — present options as **A.** ... **B.** ... **C.** ... for each question"
}

For team composition requests (only after the user has confirmed):
{
  "title": "Short session title (5-8 words in Thai, describing this conversation)",
  "text": "explanation and playstyle in plain text",
  "comp": {
    "explanation": "2-3 sentences explaining why this comp works",
    "playstyle": "early/mid/late game strategy and gameplan",
    "synergyReasoning": "Why these synergies — which tiers are reached and what each active bonus does",
    "itemReasoning": "Why each item on each carry — stat fit, ability type, or combo explanation",
    "units": [
      {
        "championId": "exact_id_from_champion_roster",
        "stars": 1,
        "items": ["exact_id_from_item_roster"],
        "isCarry": true,
        "position": { "row": 3, "col": 3 },
        "reason": "1 sentence: role this unit fills + synergy it activates (e.g. 'Jinx opens Rapidfire and reaches Enforcer Gold')"
      }
    ]
  }
}

For all other questions (meta, mechanics, tips):
{
  "title": "Short session title (5-8 words in Thai, describing this conversation)",
  "text": "your full answer here in plain conversational text"
}

Rules:
- title: short Thai phrase that captures the topic (e.g. "ถามเรื่อง Reroll Samira" or "สร้างทีม Darkflight Carry")
- championId MUST be an exact id value from champion data, not a name
- items entries MUST be exact id values from item data, not names
- Suggest exactly 10 units; each unit can have 0-3 items
- position is optional: row 0-3 (0 = front), col 0-6 (0 = left)
- comp field is ONLY present for team composition requests after user confirmation; omit it otherwise
- synergyReasoning: explain which synergy thresholds are active and what the bonus does
- itemReasoning: explain why each item was chosen for its carrier (stat fit, ability type)
- reason on each unit: 1 sentence explaining why that champion is in the comp`;

const CLARIFICATION_PROTOCOL = `## Team Composition Clarification Protocol
When the user asks to build a team composition (or if the request is ambiguous), you MUST ask clarifying questions BEFORE building the comp.
Do NOT output a "comp" field until you have gathered enough information AND the user has confirmed they want you to proceed.

Ask up to 3 focused questions, each with lettered options (A, B, C or more). Group them all in a single message.
Example clarification areas (choose only the ones relevant to the request):
1. **Playstyle** — Reroll (3-star carries), Fast 8 (strong 4-cost units), Slow Roll, Hyper Roll
2. **Win condition** — Damage carry, Tank frontline, AOE burst, Healing/sustain
3. **Stage priority** — Economy first (greedy), Aggressive early, Flexible

Once the user answers the clarification questions, respond with a brief summary of the team plan and ask them to confirm ("ยืนยันสร้างทีม?" or similar). Only after confirmation should you output the full comp with the "comp" field.

Skip the clarification step ONLY when:
- The user's request is already very specific (e.g. "สร้างทีม Reroll Jinx 10 ตัว เน้น Rapid Fire")
- The user is following up on a previous comp in this session
- The user explicitly says "สร้างเลย" or equivalent

## New Chat Recommendation Protocol
If the user asks to build a composition that is significantly different from the one already discussed in this session — for example switching to a completely different synergy set, swapping out the majority of champions, or changing the core carry — politely suggest starting a new chat for better accuracy.
Do NOT output a "comp" field in this case. Instead respond with a text-only message explaining why a fresh context will give better results.

Examples that should trigger this recommendation:
- Session is about a Reroll Jinx comp → user suddenly asks for a Fast 8 Ambusher comp
- Session has built a specific 10-unit roster → user asks to replace 7+ of those units with a different synergy
- Session focused on one trait (e.g. Rapidfire) → user asks to pivot to a completely unrelated trait

Wording example (in Thai):
"คำขอนี้แตกต่างจากทีมที่เราคุยกันมาก ขอแนะนำให้เปิด Chat ใหม่เพื่อความแม่นยำในการสร้างทีมครับ 😊"`;

// ─── Planner output schema (what the Planner MUST return as JSON) ───────────
const PLANNER_OUTPUT_SCHEMA = `## Planner Output Schema
You MUST output a single valid JSON object matching this schema EXACTLY. No markdown code blocks. No extra text.

{
  "carry": {
    "id": "champion_id_from_tool",
    "name": "Champion Name",
    "cost": 4,
    "damageType": "physical | magic | hybrid",
    "role": "AD_Carry | AP_Carry | Tank | Utility"
  },
  "targetSynergies": ["trait_id_1", "trait_id_2"],
  "fallbackSynergies": ["trait_id_3", "trait_id_4"],
  "costCurve": { "1cost": 2, "2cost": 3, "3cost": 3, "4cost": 2 }
}

Rules:
- carry.id and all trait IDs MUST come directly from tool responses — never invent IDs
- targetSynergies: 2–3 primary synergy IDs to activate
- fallbackSynergies: 2–3 backup synergy IDs in case primary pools are too small
- costCurve values must sum to exactly 10
- Do NOT include unit slot assignments — that is the Builder's job`;

// ─── Builder final output schema (what the Builder MUST return) ──────────────
const BUILDER_OUTPUT_SCHEMA = `## Builder Output Schema
You MUST output a single valid JSON object. No markdown code blocks. No text outside the JSON.

{
  "title": "Short session title (5-8 words in Thai)",
  "text": "explanation and playstyle strategy in plain text",
  "comp": {
    "explanation": "2-3 sentences explaining why this comp works",
    "playstyle": "early/mid/late game strategy",
    "synergyReasoning": "Which thresholds are activated and what each bonus does",
    "itemReasoning": "Why each item was chosen for its carrier",
    "activatedSynergies": [
      { "traitId": "trait_id", "count": 5, "threshold": 5 }
    ],
    "units": [
      {
        "championId": "exact_id_from_tool",
        "stars": 2,
        "items": ["exact_item_id_from_tool"],
        "isCarry": true,
        "position": { "row": 3, "col": 3 },
        "reason": "1 sentence: role + synergy this unit activates",
        "sourceToolCall": "loop identifier, e.g. get_champions#loop2"
      }
    ]
  }
}

Validation rules — the output is INVALID and must be regenerated if any of these fail:
- units array MUST contain EXACTLY 10 entries
- All championId values MUST come directly from get_champions tool responses
- All item id values MUST come directly from get_items tool responses
- Every activated synergy count MUST be ≥ its threshold
- carry unit MUST have 2–3 items assigned
- sourceToolCall MUST be present on every unit and item entry`;

export function useChatPromptBuilder() {
  // ── Used by Claude / Gemini / Copilot — embeds full roster in the prompt ──
  function buildSystemPrompt(opts: PromptOptions): string {
    const { anchorChampions, allChampions, allItems, versionName } = opts;

    const anchorIds = new Set(anchorChampions.map((c) => c.id));

    const roster = allChampions.map((c) => ({
      id: c.id,
      name: c.name,
      cost: c.cost,
      traits: c.traits,
      isAnchor: anchorIds.has(c.id),
    }));

    const itemRoster = allItems
      .filter((it) => it.category !== "basic" && it.category !== "other")
      .map((it) => ({ id: it.id, name: it.name, category: it.category }));

    const anchorSection =
      anchorChampions.length > 0
        ? `\n## Anchor Champions\nThe following champions MUST be included in every team composition you suggest:\n${anchorChampions.map((c) => `- ${c.name} (id: "${c.id}")`).join("\n")}\n`
        : "";

    const versionSection = versionName ? `\n## Game Version\nCurrent version: "${versionName}"\n` : "";

    return `You are Golden Spatula, an expert advisor integrated into the Golden Spatula Simulator.
You help players build optimal team compositions and answer questions about game mechanics, meta, and strategy.
${versionSection}
## Champion Roster
The following champions are available. Use ONLY these exact "id" values for championId when suggesting compositions.
${JSON.stringify(roster, null, 2)}
${anchorSection}
## Item Roster
The following items are available. Use ONLY these exact "id" values in the "items" array — NEVER use item names as IDs.
${JSON.stringify(itemRoster, null, 2)}

${CLARIFICATION_PROTOCOL}

${RESPONSE_FORMAT}`;
  }

  // ── Used by DeepAgents — the server-side router handles all pipeline logic.
  // This prompt is sent as context but the server's Router/Planner/Builder prompts
  // govern actual behaviour. We still pass anchor champion info so the server
  // can surface it in stage prompts.
  function buildDeepAgentsSystemPrompt(anchorChampions: Champion[], versionName?: string): string {
    const anchorSection =
      anchorChampions.length > 0
        ? `\n## Anchor Champions\nThe following champions MUST be included in every team composition:\n${anchorChampions.map((c) => `- ${c.name} (id: "${c.id}")`).join("\n")}\n`
        : "";

    const versionSection = versionName ? `\n## Game Version\nCurrent version: "${versionName}"\n` : "";

    return `You are Golden Spatula, an expert TFT advisor integrated into the Golden Spatula Simulator.
You help players build optimal team compositions and answer questions about game mechanics, meta, and strategy.
${versionSection}${anchorSection}`;
  }

  // ── Stage 1: Planner Agent ────────────────────────────────────────────────
  // Surveys champion pool and synergies → outputs a structured plan JSON.
  // Does NOT fill unit slots — that is the Builder's responsibility.
  function buildPlannerPrompt(opts: PlannerOptions): string {
    const { versionName, anchorChampions = [] } = opts;
    const versionSection = versionName ? `\n## Game Version\nCurrent version: "${versionName}"\n` : "";

    const anchorSection =
      anchorChampions.length > 0
        ? `\n## Anchor Champions (MUST be the carry or included in every comp)\n${anchorChampions.map((c) => `- ${c.name} (id: "${c.id}")`).join("\n")}\n`
        : "";

    return `You are the Planner stage of a two-stage TFT team composition builder.
Your ONLY job is to analyse the available champion pool and synergy data, then output a structured strategic plan.
You do NOT fill unit slots — that is the Builder's job.
${versionSection}
## Mandatory Tool Call Order
You MUST call tools in this exact order before producing output:
1. get_champions?mode=summary — survey the full champion roster (id, name, cost, traitIds)
2. get_traits?mode=list — survey all available synergies (id, name, type)
3. If an anchor champion is specified → get_champions?mode=detail&names=[anchor] to read skillDesc and determine damage type (physical / magic / hybrid) and correct carry role

## Rules
- Do NOT call get_lineups — derive strategy purely from champion pool and synergy data
- Do NOT output unit IDs — produce strategy only
- targetSynergies must be achievable: pick synergies where the champion pool has enough units to meet the lowest activation threshold
- Include fallbackSynergies so the Builder can recover if a primary synergy pool is unexpectedly small
- If an anchor champion is set, set it as carry unconditionally; read its skillDesc to determine role
${anchorSection}
${PLANNER_OUTPUT_SCHEMA}`;
  }

  // ── Stage 2: Builder Agent ────────────────────────────────────────────────
  // Receives the Planner's plan and constructs a complete validated 10-unit comp.
  function buildBuilderPrompt(opts: BuilderOptions): string {
    const { versionName, plannerOutput } = opts;
    const versionSection = versionName ? `\n## Game Version\nCurrent version: "${versionName}"\n` : "";

    return `You are the Builder stage of a two-stage TFT team composition builder.
You have received a strategic plan from the Planner. Your job is to construct a complete, validated 10-unit team composition through three sequential validation loops.
${versionSection}
## Planner's Strategic Plan
${plannerOutput}

## Mandatory Three-Loop Workflow

### Loop 1 — Pool Validation (run before filling any units)
1. get_traits?mode=info&trait_ids=[targetSynergies] — read actual activation thresholds
2. get_champions?mode=summary&trait_ids=[targetSynergies] — count units available per synergy
3. If pool count < lowest threshold for a synergy → drop it, replace with next fallbackSynergy, repeat

### Loop 2 — Unit Fill
1. get_champions?mode=detail&trait_ids=[confirmedSynergies] — fetch full unit data
2. Fill 10 slots following the Planner's costCurve
3. Validate before proceeding:
   - Exactly 10 units, all unique IDs
   - Every confirmed synergy count ≥ its activation threshold
   - All IDs come directly from this tool response (record sourceToolCall: "get_champions#loop2")

### Loop 3 — Item Assignment
1. get_champions?mode=detail&names=[carry.name] — confirm skillDesc and damage type
2. get_items?mode=detail&recommend_for_role=[carry.role] — fetch role-matched items
3. Assign 2–3 items to the carry. Assign 1 item to the strongest secondary unit if slots remain.
4. All item IDs must come from the tool response (record sourceToolCall: "get_items#loop3")

## Rules
- Do NOT output a comp until all three loops are complete
- Do NOT invent champion IDs or item IDs — every ID must trace back to a tool response
- If Loop 1 exhausts all fallbackSynergies without finding a valid pool, return a clarification request instead of a partial comp

${BUILDER_OUTPUT_SCHEMA}`;
  }

  return { buildSystemPrompt, buildDeepAgentsSystemPrompt, buildPlannerPrompt, buildBuilderPrompt };
}
