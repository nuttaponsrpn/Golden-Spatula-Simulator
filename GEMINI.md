# Project Conventions (Universal AI Rules)

> This file is the Single Source of Truth for all AI agents.
> It is mirrored to CLAUDE.md, GEMINI.md, .cursorrules, and .github/copilot-instructions.md.

---

## Conventions

### Component File Structure — Template Before Script Before Style

Every `.vue` file must always have its blocks ordered as follows:

1. `<template>` — markup comes first (see the UI that will render before anything else)
2. `<script setup lang="ts">` — logic follows
3. `<style scoped>` — styles close it out (if any)

**Rationale:** When reading a new component → see the UI shape first → then understand the logic driving that UI → style is the last detail.

```vue
<!-- ✅ Correct -->
<template>
  <button @click="$emit('click')">{{ label }}</button>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
defineEmits<{ click: [] }>();
</script>

<style scoped>
button { ... }
</style>
```

```vue
<!-- ❌ Wrong — script before template -->
<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <button>{{ label }}</button>
</template>
```

---

### Components — Pure vs Smart

**Pure Component** (default — always use this as the starting point)

- Receives data through `props` only — same props → same output every time
- Communicates out through `emits` only — does not access the store directly
- No side effects, no data fetching
- Easy to test because no state needs to be mocked

```vue
<!-- ✅ Pure Component -->
<script setup lang="ts">
defineProps<{ value: number; color: "green" | "red" }>();
defineEmits<{ click: [] }>();
</script>
```

**Smart Component** (use only when necessary)

- Use when the component is the "connection point" between a composable and Pure Components
- Pages (`pages/`) and layouts are always allowed to be Smart
- Ask: "If I moved this component to another project, would I have to drag its composables along?" — If yes = Smart

**Decision guide:**

| Question                          | Answer → Type                          |
| --------------------------------- | -------------------------------------- |
| Reused in ≥ 2 places?             | Yes → Pure                             |
| Only render logic?                | Yes → Pure                             |
| Needs to access a composable?     | Yes → Smart (or receive via props instead) |
| Is it a page or layout?           | Yes → can be Smart                     |

---

### Folder Structure — Feature-based

Organize folders by **topic/feature**, not by type (no `ui/`, `common/`, `shared/`)

```
app/components/
  AppLoading.vue             ← global chrome
  Element/                   ← reusable UI primitives
    BaseButton.vue           → <ElementBaseButton>
    BaseTextField.vue        → <ElementBaseTextField>
    ...
  (Feature)/                 ← add folders per feature
    ComponentA.vue           → <FeatureComponentA>
    ComponentB.vue           → <FeatureComponentB>
```

**Nuxt auto-naming rules:**

- `components/Foo.vue` → `<Foo>`
- `components/Foo/Bar.vue` → `<FooBar>` (folder becomes prefix automatically)
- If the file name matches the folder: `components/Foo/Foo.vue` → `<FooFoo>` — **do not do this**; place the main component at the root instead

**Folder naming rules:**

- Use PascalCase (`UserProfile/`, `Element/`, `ShoppingCart/`)
- Name by domain/feature, not by role (not `forms/`, `ui/`, `shared/`)

---

### Responsive Design & Mobile-First
- **Mobile-First**: Styles without a prefix apply to mobile. Use `sm:`, `md:`, `lg:`, etc., only to add complexity for larger screens.
- **Fluid Layouts**: Prefer `flex`, `grid`, and `max-w-*` over fixed widths (px).
- **Touch Targets**: Interactive elements must be at least 44x44px on mobile.
- **Typography**: Use responsive text classes (e.g., `text-base md:text-lg`).

---

### Types — All interfaces and types live in `types/` without exception

**Core rule:** Never declare `interface` or `type` directly inside a composable or component.

```
app/types/
  (feature).ts  ← all types for that feature
  user.ts
  cart.ts
  ...
```

**Nuxt auto-import covers Vue APIs, composables, and components — but not TypeScript types:**

```ts
// ✅ auto-imported — no import line needed
const x = ref<number>(0);
const y = computed(() => x.value * 2);
const { data, fetch } = useMyComposable();

// ✅ must import manually — types have no runtime value, so they are not auto-imported
import type { MyType } from "~/types/feature";
```

```ts
// ❌ Wrong — Nuxt already handles this import
import { ref, computed } from "vue";

// ❌ Wrong — declaring an interface inside a composable/component
export interface MyData {
  id: string;
}
```

**When to create a new type file:**

- Two or more types related to the same feature → create `types/(feature).ts`
- Name the file after the domain (`cart.ts`, `user.ts`), not after a role (`models.ts`, `interfaces.ts`)        
- Even if a type is used in only one place, still put it in `types/` — consistency matters more than DRY        

**Pattern inside a type file:**

```ts
// types/feature.ts

// UI / Component types
export interface MyItem { ... }

// API response types (prefix with Api)
export interface ApiMyItem { ... }

// Union / literal types
export type MyStatus = "active" | "inactive";
```

---

### Type Safety — Get it right from the start to avoid pain later

**Core rule:** Every value that flows across a boundary (props, emits, API, composable return, function param) must have an explicit type — no implicit `any`.

#### `tsconfig.json` must have all strict flags enabled

```jsonc
{
  "compilerOptions": {
    "strict": true, // enables all strict flags
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true, // arr[0] → T | undefined
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
  },
}
```

#### Never use `any` — always use `unknown` instead

```ts
// ❌ Wrong — any disables type checking entirely
function parse(data: any) {
  return data.user.name; // easy runtime error
}

// ✅ Correct — unknown forces you to narrow before using
function parse(data: unknown) {
  if (typeof data === "object" && data !== null && "user" in data) {
    // narrow first, then use
  }
}
```

If you genuinely need to escape the type system → you must include a comment explaining why:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 3rd party lib has no types
const result = (window as any).legacyAPI();
```

#### No non-null assertion (`!`) without a clear reason

```ts
// ❌ Wrong — lying to the compiler that it is not null
const user = users.find((u) => u.id === id)!;
user.name; // crashes if not found

// ✅ Correct — narrow explicitly with if or throw
const user = users.find((u) => u.id === id);
if (!user) throw new Error(`User ${id} not found`);
user.name;
```

#### Type assertion (`as`) only at boundaries

```ts
// ❌ Wrong — asserting to silence an error
const count = value as number; // if value is a string → silent bug

// ✅ Correct — assert at the API boundary, then validate
const data = (await res.json()) as ApiMyItem;
// then validate with zod / valibot if data comes from the network
```

Use a **runtime validator** (zod / valibot) for API responses to ensure the type matches the actual data.       

#### Props and Emits — always specify types explicitly

```ts
// ❌ Wrong — no types specified, defaults to any
const props = defineProps(["item", "count"]);
const emit = defineEmits(["select", "update"]);

// ✅ Correct — generic type-only declaration
const props = defineProps<{
  item: MyItem;
  count?: number;
}>();

const emit = defineEmits<{
  select: [id: string];
  update: [value: MyItem];
}>();
```

#### Composable return types must be clearly inferable

```ts
// ❌ Wrong — implicit return type, easy to break on refactor
export const useFeature = () => {
  const items = ref([]); // ref<never[]> — cannot push anything into it
  return { items };
};

// ✅ Correct — explicitly specify the generic for ref/useState
export const useFeature = () => {
  const items = useState<MyItem[]>("feature-items", () => []);
  const selected = ref<MyItem | null>(null);
  return { items, selected };
};
```

#### `noUncheckedIndexedAccess` — array/object access returns `T | undefined`

```ts
const items: MyItem[] = [...];

// ❌ Wrong — assumes the element exists
const first = items[0];
first.name; // TS error: possibly undefined

// ✅ Correct — check first
const first = items[0];
if (first) first.name;

// or use optional chaining
items[0]?.name;
```

#### Discriminated Union instead of conflicting optional fields

```ts
// ❌ Wrong — impossible states still pass the type check
interface Result {
  loading: boolean;
  data?: MyItem;
  error?: Error;
}

// ✅ Correct — discriminated union, invalid states are blocked by the compiler
type Result =
  | { status: "loading" }
  | { status: "success"; data: MyItem }
  | { status: "error"; error: Error };
```

#### Enums → use literal unions instead

```ts
// ❌ Avoid — TS enums have runtime cost and surprising behavior
enum Status {
  Active,
  Inactive,
}

// ✅ Correct — literal union, zero runtime overhead, narrows well
export type Status = "active" | "inactive";
```

#### Pre-commit checklist

- [ ] No `any` (unless there is an explanatory comment)
- [ ] No unnecessary `!` non-null assertions
- [ ] Props / Emits have generic types
- [ ] Composable returns have explicit ref/useState generics
- [ ] API responses go through a validator or have a type assertion at a single boundary
- [ ] `pnpm typecheck` (or `nuxt typecheck`) passes with no warnings

#### Rules for Claude — when working on type safety tasks

**Do not report a task as done without actually running `nuxi typecheck`.**

Reading code by eye is not sufficient. Flags like `noUncheckedIndexedAccess` turn array indices (`arr[0]`, `match[1]`) into `T | undefined`, which can look fine visually but will fail compilation — always run the compiler first.

**Mandatory protocol when fixing type safety:**

1. Fix the code
2. Run `npx nuxi typecheck` — review the actual output
3. If errors remain → keep fixing, repeat until clean
4. Report results only after "typecheck passed"

---

### Composables — Business Logic Layer

A **composable** is the place for logic that:

- Uses Vue reactivity (`ref`, `computed`, `watch`) or Nuxt `useState()`
- Is reused across 2+ components
- Connects state to components (transformation, derived data)
- Is too complex to live inline inside a component

```ts
// ✅ Correct — use useState() for shared state
export function useMyFeature() {
  const items = useState<MyItem[]>("my-feature-items", () => []);
  const loading = useState<boolean>("my-feature-loading", () => false);
  const api = useApi();

  const fetchItems = async () => { ... };

  return { items, loading, fetchItems };
}
```

**Do not put logic directly inside a component if:**

- The logic exceeds ~10 lines
- The logic is used elsewhere too
- The logic needs to be mocked to test the component

**Composable vs Utility function:**

|                          | Composable (`use*.ts`) | Utility (`utils/*.ts`) |
| ------------------------ | ---------------------- | ---------------------- |
| Uses Vue reactivity?     | ✅ Yes                 | ❌ No                  |
| Returns reactive values? | ✅                     | ❌                     |
| Lives in                 | `composables/`         | `utils/`               |

```ts
// ✅ Composable — has useState/ref/computed
export const useMyFeature = () => {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);
  return { count, doubled };
};

// ✅ Utility — pure function with no reactivity
export const formatPrice = (value: number) => `${value} THB`;
```

**Folder structure — feature-based, same as components:**

```
app/composables/
  (feature)/              ← create a subfolder when there are ≥ 3 related composables
    useFeatureA.ts
    useFeatureB.ts
    useFeatureC.ts
  useApi.ts               ← base HTTP client used by all composables
  useAuth.ts
```

- Create a subfolder when there are ≥ 3 related composables
- Name folders after the domain, not the type (`authentication/` not `hooks/`)
- Every composable must start with `use`

**⚠️ Never call a composable inside a function:**

Composables must always be called at the top level of `<script setup>`. Vue requires a stable call order to correctly track reactive state.

```ts
// ✅ Correct — called at top-level
const { items, fetchItems } = useMyFeature();
const { isAuthenticated } = useAuth();

function handleRefresh() {
  fetchItems(); // fine — calling a function already obtained above
}

// ❌ Wrong — calling a composable inside a function
function loadData() {
  const { items } = useMyFeature(); // forbidden
  const route = useRoute(); // forbidden
}

// ❌ Wrong — calling a composable inside an if/loop
if (condition) {
  const { isAuthenticated } = useAuth(); // forbidden
}
```

---

## Testing — TDD with Flexibility for UI/UX

This project is a UX/UI template — the design will change frequently. Tests must be resilient to refactoring without requiring a complete rewrite.

### Principle: Test Behavior, Not Implementation

```
❌ Brittle tests (testing implementation)
- Checking class names or HTML structure directly
- Full component snapshot tests
- Counting DOM elements

✅ Tests that survive UI/UX changes (testing behavior)
- Checking that the text/label the user sees is correct
- Checking that events are emitted when the user interacts
- Checking that a composable correctly computes derived state
```

### Layers to test

| Layer                        | Tool                       | Must update tests when UI changes? |
| ---------------------------- | -------------------------- | ---------------------------------- |
| Utility functions (`utils/`) | Vitest unit test           | ❌ No                              |
| Composables (logic, state)   | Vitest + `@vue/test-utils` | ❌ No                              |
| Pure Components (behavior)   | Vitest + `@vue/test-utils` | ⚠️ Only if behavior changes        |
| Page/Visual layout           | No test needed             | ✅ Change freely                   |

### TDD flow

```
1. Write tests for composable/utility logic first (Red)
2. Implement the logic to make them pass (Green)
3. Refactor freely — tests confirm behavior is preserved (Refactor)
4. Component tests can be written after, or alongside, once behavior is clear
```

### Example — test the composable before the UI

```ts
// ✅ Test composable logic — not concerned with UI
describe("useProductFilter", () => {
  it("filters by category", () => {
    const { items, setCategory } = useProductFilter();
    setCategory("shoes");
    expect(items.value.every((i) => i.category === "shoes")).toBe(true);
  });
});
```

```ts
// ✅ Test component behavior — not checking class/structure
it("emits select when item clicked", async () => {
  const wrapper = mount(ProductCard, { props: { item } });
  await wrapper.find('[data-testid="card"]').trigger("click");
  expect(wrapper.emitted("select")).toBeTruthy();
});
```

### `data-testid` rules

- Use `data-testid` instead of querying by class or tag
- `data-testid` has no effect on styles — layouts can change without touching tests
- Name by role: `data-testid="submit-button"`, `data-testid="price-display"`

### What **not** to test in this UI template

- Rendering of Nuxt UI / shadcn components (the library handles its own tests)
- CSS animations or transitions
- Pixel-perfect layout
- Full component snapshot tests

---

### Component Documentation

Every file under `app/components/**/*.vue` must have a corresponding `ComponentName.md` file in `app/documents/`, mirroring the component's folder structure.

```
app/components/Feature/ActionMenu.vue
app/documents/Feature/ActionMenu.md    ← mirror path in documents/
```

**Creating a new component** → always create the paired `.md` in the same commit.

**The `.md` must be updated when changing:**

- `defineProps` (adding/removing/changing type / required / default)
- `defineEmits` (adding/removing/changing payload)
- Slots (adding/removing/changing slot props)
- Externally observable behavior (keyboard, a11y, visible state)

**The `.md` does not need to be touched when:**

- Changing internal styles / classes / layout
- Refactoring internal logic that does not affect the public API
- Adding comments or fixing typos in code

#### Template for `ComponentName.md`

````markdown
# ComponentName

> One sentence summarizing what this component does / when to use it

**Type:** Pure | Smart
**Component:** `app/components/<Folder>/ComponentName.vue`

## Props

| Name    | Type       | Required | Default | Description        |
| ------- | ---------- | -------- | ------- | ------------------ |
| `propA` | `string`   | ✅       | —       | Brief description  |
| `propB` | `MyType[]` | —        | `[]`    |                    |

## Emits

| Event    | Payload       | Description                    |
| -------- | ------------- | ------------------------------ |
| `select` | `string` (id) | Fired when the user clicks...  |

## Slots

| Name      | Props | Description |
| --------- | ----- | ----------- |
| `default` | —     |             |

## Behavior

- Important render conditions (disabled, loading state)
- Externally observable side effects (animation, focus management)
- a11y: keyboard / aria handled by the component itself
- `data-testid` values used by tests (if any)

## Examples

Include at least one real usage example from the project (not a hypothetical).
Each example has a name + props JSON + usage snippet — used for live preview at `/dev/components`.

### Default

```json
{
  "propA": "hello",
  "propB": [{ "id": "1", "label": "Item" }]
}
```

```vue
<FeatureActionMenu :actions="actions" :active-action-id="activeId" @select="onSelect" />
```

## Notes (optional)

- Limitations, dependencies on composables, intentional omissions
````

#### Prohibited

- Do not write implementation details in the doc (e.g., "uses computed", "loops with v-for")
- Do not duplicate type definitions from `types/` — reference the type name instead, e.g., `FeatureAction[]`     
- Do not include hypothetical Usage or Examples — they must be real examples from the project

#### Dev Component Explorer

The `/dev/components` page (dev mode only) reads each `.md` file and displays:

- A list of all components
- A live interactive preview using the props JSON from the `## Examples` section
- Guarded with `if (import.meta.dev)` — does not appear in production builds

---

### Environment Variables — `.env.example` must always stay in sync

Every time an environment variable is set up or added to the project, `.env.example` at the project root must be updated in the same commit.

**Core rules:**

- If `.env.example` does not exist yet → create it at the root when adding the first env var
- Adding an env var to `.env` (local) → it must also be added to `.env.example`
- Removing/renaming an env var → it must also be removed/renamed in `.env.example`
- `.env` is in `.gitignore` (never commit it); `.env.example` is always committed to the repo

**Rules for values in `.env.example`:**

- ❌ Never put real values / secrets / API keys / tokens / passwords
- ✅ Use placeholders that clearly indicate the expected format, or safe defaults (e.g., local dev URLs)        
- ✅ Add a brief comment explaining what the var is for and where to find its value (if not obvious)

**Example:**

```bash
# .env.example

# Public API base URL — used to call the backend
NUXT_PUBLIC_API_BASE=http://localhost:8000

# Google OAuth Client ID — obtain from Google Cloud Console
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# JWT secret for session signing — generate with openssl rand -hex 32
NUXT_SESSION_SECRET=replace-with-random-32-byte-hex
```

**Nuxt-specific rules:**

- Public env vars (safe to expose to the client) must be prefixed with `NUXT_PUBLIC_*`
- Server-only env vars must be prefixed with `NUXT_*` (without `PUBLIC`)
- Both must also be declared with defaults in `nuxt.config.ts` → `runtimeConfig` so that TypeScript recognizes them

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    sessionSecret: "", // server-only, overridden by NUXT_SESSION_SECRET
    public: {
      apiBase: "", // overridden by NUXT_PUBLIC_API_BASE
      googleClientId: "",
    },
  },
});
```

---

### README.md — Single Source of Truth for Onboarding

The `README.md` at the root is the first document a new team member (including AI agents) reads when entering the project. It must always be kept in sync with the actual state of the codebase — it must never be left as the Nuxt starter default.

**Core rule:** Whenever any of the following changes occur, `README.md` must be updated in the same commit.     

| When this changes                                          | README section to update         |
| ---------------------------------------------------------- | -------------------------------- |
| Adding/removing an env var in `.env.example`               | `## Environment Variables`       |
| Adding a new script in `package.json`                      | `## Scripts`                     |
| Changing package manager (npm → pnpm/bun)                  | `## Setup`, `## Development`     |
| Adding a major dependency (UI lib, auth, i18n, Capacitor)  | `## Tech Stack`                  |
| Adding a new folder convention under `app/`                | `## Project Structure`           |
| Changing rendering mode (SSG/SSR/SPA)                      | `## Tech Stack`, `## Deployment` |
| Adding an external service that must be set up before run  | `## Prerequisites`               |
| Adding a CI/CD pipeline or new deployment target           | `## Deployment`                  |

**Required `README.md` structure** (unused sections may be removed, but do not add sections not listed here without good reason):

```markdown
# <Project Name>

One paragraph explaining what this project is / what it is for.

## Tech Stack

- Framework, UI lib, state, auth, i18n, mobile (if applicable) — one bullet per item, keep it brief

## Prerequisites

- Node version (from `.nvmrc` or `package.json` engines)
- Package manager + version
- External services / accounts required (Google Cloud, LINE Developer, etc.)

## Setup

1. Clone the repo
2. Copy `.env.example` → `.env` and fill in values (see `## Environment Variables`)
3. Install: `<pm> install`

## Environment Variables

Summary table of all env vars (mirrored from `.env.example`):

| Name                   | Required | Description     |
| ---------------------- | -------- | --------------- |
| `NUXT_PUBLIC_API_BASE` | ✅       | Backend API URL |
| ...                    |          |                 |

## Development

- `<pm> dev` — start the dev server at http://localhost:3000
- `<pm> typecheck` — run nuxi typecheck
- `<pm> test` — run Vitest

## Scripts

Bullet list of key scripts in `package.json` that developers use frequently.

## Project Structure

Refer to `CLAUDE.md` for full conventions — this section contains only a brief overview.

## Deployment

Target (Azure Static Web Apps / Vercel / Cloudflare), build command, output dir.

## Documentation

- `CLAUDE.md` — conventions and rules for AI agents + developers
- `app/documents/` — component documentation
- `/dev/components` (dev mode) — live component explorer
```

**Prohibited:**

- ❌ Do not keep the Nuxt starter default content (`# Nuxt Minimal Starter`, links to Nuxt docs without adjustedd context)
- ❌ Do not list commands for every package manager (npm + pnpm + yarn + bun) — only include the one the projectt actually uses
- ❌ Do not duplicate convention details from `CLAUDE.md` — link to `CLAUDE.md` instead
- ❌ Do not include secrets / API keys / production URLs in the README

**Rules for Claude:**

- Before starting any task that touches files listed in the "When this changes" table above, always check whether the relevant sections of `README.md` still match the actual code. If they do not → update them in the same commit as the change.
- If `README.md` is still the Nuxt starter default when beginning any project setup task → regenerate it using the structure above immediately, reading actual values from `package.json`, `.env.example`, and `nuxt.config.ts`.
- Do not create separate markdown files (e.g., `SETUP.md`, `DEVELOPMENT.md`) to avoid updating `README.md` — everything needed for onboarding must live in `README.md` or be linked from it.

---

### API Contract — OpenAPI as the Single Source of Truth

This project uses **FastAPI** as the backend, which automatically exports `openapi.json` at `<API_BASE>/openapi.json`. The frontend **fetches from the live URL** and generates TypeScript types using [`openapi-typescript`](https://github.com/openapi-ts/openapi-typescript) — **never write API types by hand**.

#### Core rules

1. **Single source of truth** = the `openapi.json` exported by the backend — the frontend only consumes it      
2. **Generated files must never be edited by hand** — every file under `app/types/api/` has an `// AUTO-GENERATED` header and is regenerated every time the script runs
3. **Multiple API sources supported** — the config at `api-sources.config.ts` at the root can hold multiple entries to support cases with multiple backends (main API, payment API, 3rd-party proxy)
4. **Commit generated files to the repo** — to keep builds deterministic and to avoid CI depending on a running backend
5. **Validate at the boundary for critical paths** — endpoints related to auth / payment / user data must also be wrapped with a Zod schema as an additional layer (manually maintained)

#### File structure

```
api-sources.config.ts              ← config declaring all OpenAPI endpoints (root, committed to repo)
scripts/
  gen-api.ts                       ← fetch + generate script (run via pnpm gen:api)
app/
  types/
    api/                           ← AUTO-GENERATED — do not edit by hand
      main.ts                      ← from source "main"
      payment.ts                   ← from source "payment"
      index.ts                     ← re-exports all sources (auto-generated)
    user.ts                        ← UI domain types (manual, separate from API types)
    cart.ts
  schemas/                         ← Zod schemas for critical paths (manual)
    auth.ts
    payment.ts
  api/                             ← typed clients separated by domain
    user.ts
    cart.ts
  composables/
    useApi.ts                      ← base HTTP client (auth, retry, error handling)
    useUserApi.ts                  ← domain composable wrapping api/user.ts
```

#### `api-sources.config.ts` — standard format

```ts
// api-sources.config.ts
export interface ApiSource {
  /** Source name — used as the output filename at app/types/api/<name>.ts */
  name: string;
  /** URL of openapi.json — supports env vars via ${VAR_NAME} */
  url: string;
  /** Output path (optional) — default: app/types/api/<name>.ts */
  output?: string;
  /** Additional headers, e.g. auth token for a private API (optional) */
  headers?: Record<string, string>;
}

export const apiSources: ApiSource[] = [
  {
    name: "main",
    url: "${NUXT_PUBLIC_API_BASE}/openapi.json",
  },
  // Add new entries here → run pnpm gen:api → types are added automatically
  // {
  //   name: "payment",
  //   url: "https://payment.internal.example.com/openapi.json",
  //   headers: { Authorization: "Bearer ${PAYMENT_API_TOKEN}" },
  // },
];
```

**Rule for adding a source:** Add an entry to `apiSources` → run `pnpm gen:api` → commit both the config and the generated files in a single commit.

#### Script `gen-api.ts` — Behavior

1. Read `api-sources.config.ts`
2. Resolve `${VAR_NAME}` from `process.env` (if missing → throw with the name of the missing var)
3. Fetch `openapi.json` for each source in parallel — fail-fast if any source returns a non-2xx status
4. Run `openapi-typescript` against each source → write output to `app/types/api/<name>.ts`
5. Generate `app/types/api/index.ts` that does `export * as <Name>Api from "./<name>"` for every source
6. Format with Prettier

**Scripts in `package.json`:**

```json
{
  "scripts": {
    "gen:api": "tsx scripts/gen-api.ts",
    "gen:api:check": "tsx scripts/gen-api.ts --check"
  }
}
```

`--check` mode → fetch + generate into a temp location → diff against committed files → exit 1 if they differ (used in CI)

#### Using Generated Types

```ts
// ✅ Correct — import from the generated namespace
import type { paths, components } from "~/types/api/main";

type GetUserResponse =
  paths["/users/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
type ApiUser = components["schemas"]["User"];

// ✅ Correct — keep UI types separate from API types
// types/user.ts
export interface User {
  id: string;
  createdAt: Date; // parsed from ISO string
  isActive: boolean; // mapped from is_active
}

// api/user.ts — adapter at the boundary
const toUser = (raw: ApiUser): User => ({
  id: raw.id,
  createdAt: new Date(raw.created_at),
  isActive: raw.is_active,
});
```

```ts
// ❌ Wrong — writing API types by hand
export interface ApiUser {
  id: string;
  created_at: string;
}

// ❌ Wrong — using ApiUser directly in a UI component
const props = defineProps<{ user: ApiUser }>(); // couples the UI to the backend shape → hard to refactor       
```

#### Error Contract

Every error response from the backend must share the same shape — defined in `types/api-error.ts` (manual, not generated):

```ts
// types/api-error.ts
export interface ApiErrorPayload {
  code: string; // machine-readable, e.g. "USER_NOT_FOUND"
  message: string; // human-readable
  details?: Record<string, unknown>;
}

export class ApiException extends Error {
  constructor(
    public status: number,
    public payload: ApiErrorPayload,
  ) {
    super(payload.message);
  }
}
```

The UI must handle errors based on `code` only — never parse `message` (it may change based on locale).

#### Workflow When the Backend Changes Its Contract

1. Backend deploys a new openapi version to dev/staging
2. Frontend runs `pnpm gen:api` → generated files change
3. Run `nuxi typecheck` → broken usages are caught immediately
4. Fix usages until typecheck passes → commit both the generated files and the fixed code
5. PR review clearly shows the contract diff in the generated files

#### CI Check

CI must run `pnpm gen:api:check` on every PR to catch cases where:

- A developer edited generated files by hand
- A developer forgot to regenerate after a backend update

```yaml
# .github/workflows/ci.yml (snippet)
- run: pnpm gen:api:check
  env:
    NUXT_PUBLIC_API_BASE: ${{ secrets.STAGING_API_BASE }}
```

#### Versioning

- Use **path-based versioning** on the backend side (`/api/v1/...`, `/api/v2/...`)
- The frontend selects the version via `NUXT_PUBLIC_API_BASE` in the env
- While migrating v1 → v2: temporarily add a new source to `api-sources.config.ts` (`main-v1`, `main-v2`) until all code has been migrated, then remove `main-v1`

#### Rules for Claude

- Never write `interface` or `type` that matches an API response shape by hand — instruct the user to run `pnpm gen:api` instead
- Before proposing code that calls an API → read `app/types/api/` first to use the correct types
- If the user requests adding a new backend → edit `api-sources.config.ts` + run `pnpm gen:api` + commit in a single step; never create manual types as a workaround
- When generated files have a diff → never revert them to make tests pass; fix the usage code instead

---

### Error Handling — Prevent App Crashes and Notify the User Correctly

Error handling in this project operates at two levels that work together:

- **Specific Error Handler** — handles known, anticipated errors within each composable / page
- **Global Error Handler** — catches errors that bubble up to prevent the app from silently crashing

#### Required file structure

```
app/
  types/
    app-error.ts                   ← AppError type + error kinds (manual)
  utils/
    error.ts                       ← pure helpers: isApiError(), normalizeError()
  composables/
    useErrorHandler.ts             ← normalize + display errors to the user
    useGlobalError.ts              ← shared state for the global error banner/toast
  plugins/
    error-reporter.client.ts       ← intercepts window.onerror + unhandledrejection
  error.vue                        ← Nuxt global error page (fatal / navigation error)
```

---

#### Layer 1 — Error Types (`app/types/app-error.ts`)

Every error that flows through the app must pass through this type before being displayed — never throw a raw `Error` across a boundary.

```ts
// types/app-error.ts
export type AppErrorKind =
  | "network"       // no connection, timeout
  | "api"           // backend responded with an error (4xx, 5xx)
  | "validation"    // data does not match the schema
  | "unexpected";   // an error that was not anticipated

export interface AppError {
  kind: AppErrorKind;
  code: string;           // machine-readable, e.g. "USER_NOT_FOUND", "NETWORK_TIMEOUT"
  userMessage: string;    // message safe to show the user — must not contain technical details
  recoverable: boolean;   // true = show a "Try again" button, false = must reload / go home
  cause?: unknown;        // original error for logging purposes (not shown to the user)
}
```

**Rules:**
- `userMessage` must be in language the user understands — no stack traces or HTTP status codes
- `code` uses SCREAMING_SNAKE_CASE — consistent with `ApiErrorPayload.code` from the backend
- `recoverable: true` → show a retry button; `recoverable: false` → redirect or reload

---

#### Layer 2 — Pure Error Utilities (`app/utils/error.ts`)

```ts
// utils/error.ts

// type guard — checks whether the error is an ApiException from useApi
export const isApiError = (e: unknown): e is ApiException => ...

// normalize any error type → AppError
export const normalizeError = (e: unknown): AppError => ...

// convenience factory for a network failure AppError
export const networkError = (): AppError => ({
  kind: "network",
  code: "NETWORK_UNAVAILABLE",
  userMessage: "Unable to connect. Please check your internet connection.",
  recoverable: true,
});
```

`normalizeError` is the single entry point — every `catch (unknown)` block must pass through this function before doing anything else.

---

#### Layer 3 — Specific Error Handler in Composables

Every composable that performs an async operation must return a Discriminated Union — never throw across a boundary.

```ts
// ✅ Correct — return a union instead of throwing
export const useUserApi = () => {
  const fetchUser = async (id: string): Promise<
    | { status: "success"; data: User }
    | { status: "error"; error: AppError }
  > => {
    try {
      const data = await api.get(`/users/${id}`);
      return { status: "success", data };
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  };

  return { fetchUser };
};
```

```ts
// ❌ Wrong — throwing out of a composable without wrapping
export const useUserApi = () => {
  const fetchUser = async (id: string) => {
    const data = await api.get(`/users/${id}`); // throws on failure → caller has no idea it needs to catch     
    return data;
  };
};
```

**Pattern for pages/components that use composables:**

```ts
// pages/user.vue — <script setup>
const { fetchUser } = useUserApi();
const { showError } = useErrorHandler();

const result = await fetchUser(userId);
if (result.status === "error") {
  showError(result.error); // hand off to useErrorHandler
  return;
}
// result.status === "success" → result.data is safe to use
```

---

#### Layer 4 — `useErrorHandler` (displaying errors to the user)

```ts
// composables/useErrorHandler.ts
export const useErrorHandler = () => {
  const { setGlobalError } = useGlobalError();

  const showError = (error: AppError) => {
    if (error.recoverable) {
      // show a dismissible toast or inline error — user can retry
      setGlobalError(error);
    } else {
      // redirect to the error page or show a full-page error
      navigateTo(`/error?code=${error.code}`);
    }
  };

  return { showError };
};
```

**Rules:**
- `recoverable: true` → show a dismissible notification (toast, banner) — does not block interaction
- `recoverable: false` → show a full-page error or redirect — the user must take a clear action

---

#### Layer 5 — Global Error Handler

**`app/composables/useGlobalError.ts`** — shared state for errors displayed app-wide

```ts
// composables/useGlobalError.ts
export const useGlobalError = () => {
  const error = useState<AppError | null>("global-error", () => null);

  const setGlobalError = (e: AppError) => { error.value = e; };
  const clearError = () => { error.value = null; };

  return { error, setGlobalError, clearError };
};
```

**`app/plugins/error-reporter.client.ts`** — intercepts unhandled errors from the browser

```ts
// plugins/error-reporter.client.ts
export default defineNuxtPlugin(() => {
  const { setGlobalError } = useGlobalError();

  window.addEventListener("unhandledrejection", (event) => {
    const error = normalizeError(event.reason);
    setGlobalError(error);
    if (import.meta.dev) console.error("[unhandledrejection]", event.reason);
  });

  window.onerror = (_msg, _src, _line, _col, err) => {
    const error = normalizeError(err);
    setGlobalError(error);
    if (import.meta.dev) console.error("[onerror]", err);
    return true; // prevents the browser from showing its default error dialog
  };
});
```

**`app/error.vue`** — Nuxt fatal error page

```vue
<!-- error.vue — shown when Nuxt throws a fatal error (e.g. navigation failure, SSR crash) -->
<template>
  <div>
    <h1>An error occurred</h1>
    <p>{{ userFacingMessage }}</p>
    <button @click="handleReload">Reload page</button>
    <button @click="handleGoHome">Go to home</button>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const userFacingMessage = computed(() =>
  props.error.statusCode === 404
    ? "Page not found."
    : "An unexpected error occurred. Please try again."
);

const handleReload = () => clearError({ redirect: "/" });
const handleGoHome = () => clearError({ redirect: "/" });
</script>
```

---

#### Rules for Components

**Pure Component** — does not handle errors itself; receives error state via props instead:

```ts
// ✅ Correct — Pure component receives error state as a prop
defineProps<{
  items: MyItem[];
  error: AppError | null;  // the parent has already handled the error and passes the result down
  loading: boolean;
}>();

// ❌ Wrong — Pure component fetches data and handles errors on its own
const { data, error } = await useFetch("/api/items"); // do not do this in a Pure component
```

**Smart Component / Page** — handles errors via `useErrorHandler()`:

```ts
// pages/example.vue — <script setup>
const { fetchItems } = useItemApi();
const { showError } = useErrorHandler();

const result = await fetchItems();
if (result.status === "error") {
  showError(result.error);
}
```

---

#### Prohibited patterns

```ts
// ❌ Forbidden — throwing a raw string as an error
throw "something went wrong";

// ❌ Forbidden — showing a backend error message directly to the user
alert(error.message); // message may contain technical details or be in another language

// ❌ Forbidden — silently swallowing an error without notifying the user
try {
  await riskyOperation();
} catch {
  // silent — the user has no idea something went wrong
}

// ❌ Forbidden — logging only in dev but never notifying the user
try {
  await riskyOperation();
} catch (e) {
  if (import.meta.dev) console.error(e); // production users never know it failed
}
```

---

#### Pre-commit checklist (in addition to Type Safety)

- [ ] Every async operation in a composable has a `try/catch` and returns `{ status: "error", error: AppError }`
- [ ] No `throw` crosses a composable boundary
- [ ] No `error.message` from the backend is displayed directly to the user
- [ ] `recoverable` is set according to actual severity — network error = recoverable, auth error = not recoverable
- [ ] `error.vue` exists in `app/` (Nuxt fatal error page)
- [ ] `error-reporter.client.ts` exists in `app/plugins/`

---

#### Rules for Claude — when creating or modifying composables / pages

1. **New async composable** → must always return a Discriminated Union `{ status: "success" | "error" }` — never throw
2. **New page** → must call `useErrorHandler()` at the top level and handle `status === "error"` before rendering data
3. **New Pure Component** → if it needs to display an error state, receive it via `prop: AppError | null` — never fetch or catch on its own
4. **When fixing error handling** → verify that `normalizeError()` is called at every point where `unknown` is caught
5. **Never use** `console.log` / `console.error` as a substitute for `useErrorHandler` — logging is only acceptable as a temporary debug aid in dev

---

## Project-Specific Decisions

- **Rendering** — SSR (Nuxt 4 default, no route-level override)
- **Package manager** — pnpm with `shamefully-hoist=true` in `.npmrc` and `allowBuilds` for `@parcel/watcher` / `esbuild` in `pnpm-workspace.yaml`
- **State management** — `useState()` only; no Pinia
- **Auth** — not yet implemented
- **UI library** — Tailwind CSS (`@nuxtjs/tailwindcss`) + custom CSS at `app/assets/css/battle.css` — no component library
- **i18n** — none; strings are currently hardcoded
- **Mobile** — no Capacitor
- **API** — types are auto-generated with `openapi-typescript` from the FastAPI backend (`pnpm gen:api`) → output at `app/types/api/` — configured in `api-sources.config.ts`
- **Testing** — Playwright only (no Vitest) with the `data-testid` pattern in components

---

## Architecture Scribe & Decision Logging

As an AI Expert Technical Lead and Architecture Scribe, you must manage the project's Context and Architecture Decision Records (ADR) to prevent context loss and AI looping.

Whenever a significant architectural choice is made, a complex bug is resolved, or a coding standard is established, you MUST automatically perform the following steps:

1. **RECORD THE DECISION:**
   Create or append to a file named `docs/decisions/DECISION_LOG.md` using the following concise format:
   - **Date:** [YYYY-MM-DD]
   - **Context:** [Brief description of the problem or limitation]
   - **Decision:** [What we decided to do]
   - **Reason:** [Why we chose this over other alternatives. Mention any counter-intuitive logic]

2. **UPDATE ACTIVE RULES (COMPACT SUMMARY):**
   After recording the decision, extract the "Active Rule" and update the `CONVENTIONS.md` (and mirrored files like `GEMINI.md`, `.cursorrules`, etc.). This file must ONLY contain currently active constraints and tech stacks. Remove any outdated rules. Use this format under the "Project-Specific Decisions" or a new rules section:
   - **[Domain/Category]:** [Short rule, e.g., "Use Zustand for state. DO NOT use Context API due to re-render issues (see DECISION_LOG.md)"]

3. **AUTO-COMPACT TRIGGER:**
   If you notice the `docs/decisions/DECISION_LOG.md` is getting too long (exceeding ~50 lines of active context), proactively suggest performing a "Garbage Collection". If agreed, summarize older decisions into a `docs/decisions/archive/` folder and keep only the active context in the main log.

Always remind the user to review these updated documents after a major session.
