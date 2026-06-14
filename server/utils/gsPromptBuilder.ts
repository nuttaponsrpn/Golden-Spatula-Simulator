// Server-side prompt builders for the intent-routed, two-phase Planner → Builder pipeline.
// These are pure functions — no Vue or Nuxt dependencies.

interface AnchorChampion {
  id: string;
  name: string;
}

export interface RouterPromptOptions {
  versionName?: string;
  anchorChampions?: AnchorChampion[];
}

export interface PlannerProposeOptions {
  versionName?: string;
  anchorChampions?: AnchorChampion[];
  guardContext?: string;   // verified version + trait block from the guard rail
}

export interface PlannerBuildOptions {
  versionName?: string;
  anchorChampions?: AnchorChampion[];
  proposerOutput: string;  // full Propose-phase text (with A/B/C options)
  userSelection: string;   // the user's confirm message (e.g. "เลือก B")
}

export interface AnswerPromptOptions {
  versionName?: string;
  guardContext?: string;   // verified version + trait block from the guard rail
}

// Keep existing exports for backward compatibility
export interface PlannerPromptOptions {
  versionName?: string;
  anchorChampions?: AnchorChampion[];
}

export interface BuilderPromptOptions {
  versionName?: string;
  plannerOutput: string;
  guardContext?: string;   // verified version + trait block from the guard rail
  retryFeedback?: string;  // corrective feedback when re-running after validation failure
}

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

Wording example (in Thai):
"คำขอนี้แตกต่างจากทีมที่เราคุยกันมาก ขอแนะนำให้เปิด Chat ใหม่เพื่อความแม่นยำในการสร้างทีมครับ 😊"`;

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
- sourceToolCall MUST be present on every unit entry`;

export function buildPlannerPrompt(opts: PlannerPromptOptions): string {
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
1. get_version — confirm the active game version name and id. Log: "Active version: {name} ({id})"
2. get_traits?mode=list — get all available synergy IDs for this version. You MUST use only IDs returned by this call.
3. get_champions?mode=summary — survey the full champion roster (id, name, cost, traitIds)
4. If an anchor champion is specified → get_champions?mode=detail&names=[anchor] to read skillDesc and determine damage type (physical / magic / hybrid) and correct carry role

## CRITICAL: Trait ID Rules
- Every trait ID in targetSynergies and fallbackSynergies MUST come directly from the get_traits tool response in step 2
- NEVER guess or invent trait IDs from memory or training data — the IDs change between game versions
- If you are unsure of a trait ID, call get_traits again to verify

## Rules
- Do NOT call get_lineups — derive strategy purely from champion pool and synergy data
- Do NOT output unit IDs — produce strategy only
- targetSynergies must be achievable: pick synergies where the champion pool has enough units to meet the lowest activation threshold
- Include fallbackSynergies so the Builder can recover if a primary synergy pool is unexpectedly small
- If an anchor champion is set, set it as carry unconditionally; read its skillDesc to determine role
${anchorSection}
${PLANNER_OUTPUT_SCHEMA}`;
}

// ── Router ────────────────────────────────────────────────────────────────────
// Lightweight classifier — no tools, just reads the conversation and outputs intent JSON.
export function buildRouterPrompt(opts: RouterPromptOptions): string {
  const { versionName, anchorChampions = [] } = opts;
  const versionSection = versionName ? `Current game version: "${versionName}"\n` : "";
  const anchorSection =
    anchorChampions.length > 0
      ? `Anchor champions (user wants these in the team): ${anchorChampions.map((c) => c.name).join(", ")}\n`
      : "";

  return `You are an intent classifier for a TFT (Teamfight Tactics) assistant chatbot.
${versionSection}${anchorSection}
## Task
Read the conversation history and the latest user message. Classify the user's intent into EXACTLY ONE of these four categories:

- **build_team** — user wants a new team composition built from scratch (first request, or a clearly new direction)
- **answer_question** — user is asking a factual, meta, or mechanics question that does NOT require building a comp (e.g. "how does Rapidfire work?", "which carry is best right now?")
- **confirm_intent** — user is CONFIRMING or SELECTING one of the A/B/C strategy options that were already proposed in the previous assistant message (e.g. "เลือก A", "ขอแบบ B", "B ครับ", "option 2", "go with C")
- **clarify** — the user's request is too vague or ambiguous to route — you need to ask 1-2 focused questions

## Rules
- If the previous assistant message contained strategy options labelled A, B, or C and the user is choosing one → always classify as **confirm_intent**
- Short affirmative messages like "ใช่", "โอเค", "ทำเลย", "สร้างเลย" after options were proposed → **confirm_intent**
- Questions about synergies, items, or meta that don't ask to build a team → **answer_question**
- When unsure between build_team and clarify → prefer **clarify** (better to ask than guess)

## Output
Respond with a single JSON object. No markdown. No extra text.
{ "intent": "build_team | answer_question | confirm_intent | clarify", "reasoning": "one sentence" }`;
}

// ── Planner — Propose phase ───────────────────────────────────────────────────
// Surveys the pool and presents A/B/C strategy options to the user.
// Does NOT fill unit slots — that is the Builder's job after the user selects.
export function buildPlannerProposePrompt(opts: PlannerProposeOptions): string {
  const { versionName, anchorChampions = [], guardContext } = opts;
  const versionSection = versionName ? `\n## Game Version\nCurrent version: "${versionName}"\n` : "";
  const guardSection = guardContext ? `\n${guardContext}\n` : "";
  const anchorSection =
    anchorChampions.length > 0
      ? `\n## Anchor Champions (MUST appear in every strategy option)\n${anchorChampions.map((c) => `- ${c.name} (id: "${c.id}")`).join("\n")}\n`
      : "";

  // When the guard rail supplied verified version + traits, the agent can skip
  // those discovery calls and start from the champion survey.
  const toolOrder = guardContext
    ? `1. get_champions?mode=summary — survey the full champion roster (id, name, cost, traitIds)
2. If an anchor champion is specified → get_champions?mode=detail&names=[anchor] to read skillDesc and confirm carry role
3. (Optional) get_traits?mode=info&trait_ids=[…] — read activation thresholds for synergies you are considering`
    : `1. get_version — confirm the active game version name and id
2. get_traits?mode=list — get all available synergy IDs for this version
3. get_champions?mode=summary — survey the full champion roster (id, name, cost, traitIds)
4. If an anchor champion is specified → get_champions?mode=detail&names=[anchor] to read skillDesc and confirm carry role`;

  return `You are the Planner (Propose phase) of a two-stage TFT team composition builder.
Your job is to survey the champion pool and synergies, then PROPOSE 3 distinct strategy options (A, B, C) for the user to choose from.
You do NOT fill unit slots — that is the Builder's job after the user selects an option.
${versionSection}${guardSection}
## Mandatory Tool Call Order
You MUST call tools in this exact order before producing output:
${toolOrder}

## CRITICAL: Trait ID Rules
- All trait IDs in your options MUST come from the verified trait list above (or the get_traits tool response if no list was provided)
- NEVER guess or invent trait IDs — they change between game versions

## Rules
- Do NOT call get_lineups — derive strategies purely from champion pool and synergy data
- Each option must be genuinely different: different carry, different primary synergy, or different playstyle
- targetSynergies must be achievable (enough champions in the pool to meet the activation threshold)
- Include fallbackSynergies for each option so the Builder can recover if a pool is too small
- If an anchor champion is specified, it MUST appear as the carry or a core support in every option
${anchorSection}
## Output Format
Respond with a JSON object containing the propose text AND the raw plan data for each option.
No markdown code blocks. No text outside the JSON.

{
  "title": "Short Thai session title (5-8 words)",
  "text": "Thai-language text presenting the 3 options in chat format:\n**A. [Option Name]** — [1-2 sentence description of playstyle and core synergy]\n**B. [Option Name]** — [1-2 sentence description]\n**C. [Option Name]** — [1-2 sentence description]\n\nเลือกแบบไหนดีครับ? 😊",
  "options": {
    "A": {
      "carry": { "id": "champion_id", "name": "Name", "cost": 4, "damageType": "physical | magic | hybrid", "role": "AD_Carry | AP_Carry | Tank | Utility" },
      "targetSynergies": ["trait_id_1", "trait_id_2"],
      "fallbackSynergies": ["trait_id_3"],
      "costCurve": { "1cost": 2, "2cost": 3, "3cost": 3, "4cost": 2 }
    },
    "B": { ... },
    "C": { ... }
  }
}

Rules for the options object:
- All champion and trait IDs MUST come from tool responses
- costCurve values for each option must sum to exactly 10
- Do NOT include individual unit slot assignments`;
}

// ── Planner — Build phase (confirm_intent path) ───────────────────────────────
// Receives the Propose-phase output + user's selection → injects selected plan into Builder.
// This function extracts the correct option plan from the proposer output.
export function buildPlannerBuildPrompt(opts: PlannerBuildOptions): string {
  const { versionName, proposerOutput, userSelection } = opts;
  const versionSection = versionName ? `\n## Game Version\nCurrent version: "${versionName}"\n` : "";

  return `You are the Planner (Build phase) of a two-stage TFT team composition builder.
The user has reviewed strategy options (A, B, C) and selected one.
Your job is to extract the correct option plan from the Proposer's output and produce the Planner JSON that the Builder will use.
${versionSection}
## Proposer's Output (contains all three options)
${proposerOutput}

## User's Selection
"${userSelection}"

## Task
1. Identify which option (A, B, or C) the user selected from their message
2. Extract the plan object for that option from the "options" field above
3. Output ONLY the plan for the selected option as a Planner JSON object

## Output Schema
Output a single valid JSON object. No markdown. No extra text.
{
  "carry": { "id": "...", "name": "...", "cost": N, "damageType": "...", "role": "..." },
  "targetSynergies": ["..."],
  "fallbackSynergies": ["..."],
  "costCurve": { "1cost": N, "2cost": N, "3cost": N, "4cost": N }
}`;
}

// ── Answer agent ──────────────────────────────────────────────────────────────
// Handles answer_question intent — no tools needed for most questions.
export function buildAnswerPrompt(opts: AnswerPromptOptions): string {
  const { versionName, guardContext } = opts;
  const versionSection = versionName ? `\nCurrent game version: "${versionName}"\n` : "";
  const guardSection = guardContext ? `\n${guardContext}\n` : "";

  return `You are Golden Spatula, an expert TFT (Teamfight Tactics) advisor.
${versionSection}${guardSection}
The user has asked a question about game mechanics, meta, synergies, items, or strategy.
Answer concisely and helpfully. You may use the get_traits, get_champions, get_items, or get_augments tools if you need to look up specific current data, but for general questions answer directly from your knowledge.

## Output Format
Respond with a single JSON object. No markdown code blocks. No text outside the JSON.
{
  "title": "Short Thai session title (5-8 words)",
  "text": "Your full answer here in plain conversational Thai or English matching the user's language"
}`;
}

// ── Clarify agent ─────────────────────────────────────────────────────────────
// Handles clarify intent — asks focused questions before routing to build_team.
export function buildClarifyPrompt(opts: AnswerPromptOptions): string {
  const { versionName } = opts;
  const versionSection = versionName ? `\nCurrent game version: "${versionName}"\n` : "";

  return `You are Golden Spatula, an expert TFT (Teamfight Tactics) advisor.
${versionSection}
The user's request was too vague to build a team composition. Ask 1-2 focused clarifying questions to narrow down what they want.

Focus on the most impactful unknowns:
- **Playstyle**: Reroll (3-star carries), Fast 8 (strong 4-cost units), Slow Roll, Hyper Roll
- **Win condition**: Single damage carry, Tank frontline, AOE burst, Healing/sustain
- **Cost preference**: Budget (1-2 cost reroll) vs Premium (4-5 cost carry)

Keep it brief — maximum 2 questions with A/B/C options each.

## Output Format
Respond with a single JSON object. No markdown code blocks. No text outside the JSON.
{
  "title": "Short Thai session title (5-8 words)",
  "text": "Your clarifying questions here with lettered options"
}`;
}

export function buildBuilderPrompt(opts: BuilderPromptOptions): string {
  const { versionName, plannerOutput, guardContext, retryFeedback } = opts;
  const versionSection = versionName ? `\n## Game Version\nCurrent version: "${versionName}"\n` : "";
  const guardSection = guardContext ? `\n${guardContext}\n` : "";

  // Retry feedback is surfaced at the very top so the model addresses it first.
  const retrySection = retryFeedback
    ? `\n## ⚠️ VALIDATION FAILURE — FIX THESE BEFORE ANYTHING ELSE\n${retryFeedback}\n`
    : "";

  // When the guard rail provided the verified trait list, Loop 0 verifies against
  // that list instead of making a fresh get_traits?mode=list call.
  const loop0 = guardContext
    ? `### Loop 0 — Trait ID Verification (ALWAYS run first, no exceptions)
1. The verified trait list is provided in the "Verified Game Context" section above.
2. For each trait ID in targetSynergies and fallbackSynergies from the Planner's plan: verify it appears in that verified list.
3. If a trait ID from the plan does NOT appear in the verified list → it is invalid for this version. Drop it and pick a replacement from the verified list.
4. You MUST NOT proceed to Loop 1 until all synergy IDs are verified against the list.`
    : `### Loop 0 — Trait ID Verification (ALWAYS run first, no exceptions)
1. get_traits?mode=list — fetch the full trait list for this game version
2. For each trait ID in targetSynergies and fallbackSynergies from the Planner's plan: verify it exists in the tool response
3. If a trait ID from the plan does NOT appear in the tool response → it is invalid for this version. Drop it and pick a replacement from the traits returned by the tool.
4. You MUST NOT proceed to Loop 1 until all synergy IDs are verified against this tool response.`;

  return `You are the Builder stage of a two-stage TFT team composition builder.
You have received a strategic plan from the Planner. Your job is to construct a complete, validated 10-unit team composition through four sequential validation loops.
${retrySection}${versionSection}${guardSection}
## Planner's Strategic Plan
${plannerOutput}

## Mandatory Four-Loop Workflow

${loop0}

### Loop 1 — Pool Validation (run before filling any units)
1. get_traits?mode=info&trait_ids=[verifiedTargetSynergies] — read actual activation thresholds
2. get_champions?mode=summary&trait_ids=[verifiedTargetSynergies] — count units available per synergy
3. If pool count < lowest threshold for a synergy → drop it, replace with next verified fallbackSynergy, repeat

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

${CLARIFICATION_PROTOCOL}

${BUILDER_OUTPUT_SCHEMA}`;
}
