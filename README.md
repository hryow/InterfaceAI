# Northstar Member Services

Northstar Member Services is a deterministic local proxy application for the Computer-Use Automation System assignment. It simulates a credit-union operator console with intentionally stable, legacy-style surfaces that can be inspected and automated without connecting to live member systems.

## Product surface

- Operator login with deterministic demo credentials.
- Member lookup by member ID or name.
- Member detail records with contact information, status, accounts, and balances.
- Account creation for an existing member with account-type selection.
- Success, validation, and business-error banners suitable for evidence capture.
- Stable synthetic records, nested account tables, accessibility labels, and responsive layouts for browser automation.

The current application is a client-side training environment. It stores state in memory, uses synthetic data only, and resets after a browser refresh. No API keys, database, or live service are required.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo operator credentials:

- Operator ID: `memberops`
- Passphrase: `northstar`

## Product workflow

1. Sign in with the demo credentials.
2. Search for `M-10482` or `Mara Ellison`.
3. Open Mara Ellison to inspect the nested account table and balances.
4. Select **New account**, enter `Emergency Fund`, and create it to exercise the success path.
5. Return to **New account**, enter `Everyday Checking`, and submit to trigger `Duplicate Account Name`.
6. Return to **Member lookup**, search `M-99999`, and submit to trigger `Member Not Found`.

Seed members are `M-10482` / Mara Ellison, `M-20871` / Jon Bell, and `M-31706` / Priya Nair.

## Automation boundary

The recommended automation stack is Playwright with Node.js/TypeScript. The application is designed for a two-phase workflow:

1. **Discovery:** a vision-capable LLM observes the current page and proposes validated actions. Playwright executes approved actions and records the resulting capability artifact.
2. **Replay:** Playwright re-runs the saved artifact with parameterized inputs. Replay must not call the LLM; locators, checkpoints, retry rules, and error classification provide determinism.

For discovery, use an LLM API that supports vision, tool calling, and strict structured JSON responses. Gemini is the configured provider for this project. Validate actions and artifacts with Zod before execution or persistence, and redact credentials and sensitive values from traces.

The app provides the proxy target, Gemini discovery client, and a working discovery runner. Deterministic replay, HITL handoff, and broader evidence capture are the remaining automation-layer deliverables.

## Gemini discovery setup

The Gemini integration is server-side only. [agent/gemini-client.js](agent/gemini-client.js) sends a goal and current page state to the Gemini API and receives one strict JSON browser action. It does not execute actions, handle credentials, or run during deterministic replay.

Set it up step by step:

1. Create a Gemini API key in Google AI Studio. Do not paste it into source files or chat.
2. Copy the environment template:

	```bash
	cp .env.example .env
	```

3. Open `.env` and replace `your-key-here` with your key. The default model is `gemini-3.6-flash`; change `GEMINI_MODEL` only to a model enabled for your account.
4. Run the configuration smoke test:

	```bash
	npm run gemini:verify
	```

The command loads `.env`, sends a minimal discovery request, and prints the validated action. It never prints the API key. Without a configured key, it exits with a setup message and makes no network request. The browser app itself remains usable without Gemini.

The discovery runner passes Playwright accessibility snapshots into `proposeNextAction`, validates the returned action against the project safety allowlist, executes it, and saves a redacted artifact. Replay should make no Gemini calls.

Run the first discovery flow after starting the app:

```bash
npm run discover
```

The default goal is to find member `M-10482` and open the member details page. Set `HEADLESS=false` to watch Chromium, or override `DISCOVERY_GOAL`, `MAX_STEPS`, and `ARTIFACT_PATH` for another run.

Discovery artifacts follow [schema/artifact.json](schema/artifact.json). Validate the generated artifact with:

```bash
npm run artifact:validate
```

The schema records metadata, replay inputs, allowed actions, redaction policy, step checkpoints, and typed results. Replay is explicitly marked as not allowing an LLM call.

## Playwright

Playwright Test is configured in [playwright.config.js](playwright.config.js). It targets Chromium, uses `http://localhost:3000` as its base URL, and starts Vite automatically when no local server is already running.

Install the browser once after cloning:

```bash
npm install
npx playwright install chromium
```

Run the end-to-end smoke suite:

```bash
npm run test:e2e
```

Open the latest HTML report:

```bash
npm run test:e2e:report
```

The tests in [tests/app.spec.js](tests/app.spec.js) cover login, member lookup, account balances, account creation, `Duplicate Account Name`, and `Member Not Found`. Playwright traces, screenshots, videos, and reports are generated locally and excluded from source control.

## Build validation

```bash
npm run build
```

The build command creates the production bundle in `dist/` and does not require a live service.