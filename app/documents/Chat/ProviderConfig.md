# ChatProviderConfig

> Chat header widget for selecting and configuring the AI provider (Gemini Default, Claude, Gemini, or OpenAI-compatible). Reads and writes configuration to localStorage.

**Type:** Smart
**Component:** `app/components/Chat/ProviderConfig.vue`

## Props

None — reads config from `useAiProvider()`.

## Emits

None.

## Slots

None.

## Behavior

- Shows a small button in the chat header. When no provider is configured, the indicator dot is gray and the label reads "ตั้งค่า AI". When configured, the dot is green and shows the provider name.
- Clicking the button opens `ElementBaseModal` with a form:
  - Provider dropdown: Gemini Default / Claude / Gemini / Copilot
    - "Gemini — Default" is disabled when `NUXT_PUBLIC_GEMINI_API_KEY` is not set in the environment
  - API Key input (password field) — hidden when "Gemini Default" is selected
  - Base URL input (Copilot/OpenAI only) — allows pointing to a CORS proxy
  - Model input (optional override) — hidden when "Gemini Default" is selected (always uses `gemini-2.0-flash`)
  - An info banner replaces the key/model inputs when "Gemini Default" is selected
- Saving calls `useAiProvider().setConfig()`, which writes to both `useState` and `localStorage`.
- "Delete" button calls `clearConfig()` to remove the stored config.
- `data-testid="chat-provider-config-button"` on the trigger button.

## Examples

### Default

```json
{}
```

```vue
<ChatProviderConfig />
```

## Notes

- Direct browser-to-API calls work for Claude and Gemini (both support CORS for browser clients).
- For OpenAI-compatible APIs that don't support CORS, set the `baseUrl` to a self-hosted CORS proxy endpoint.
