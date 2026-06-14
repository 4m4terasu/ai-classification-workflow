# AI Classification Workflow

An internal-style message triage tool built with Next.js, TypeScript, Tailwind CSS, and Zod. A user can submit an incoming customer or business message, have it classified by an AI provider, and place the validated result into a human review queue.

The app is intentionally small: no auth, no external database, and no deployment-specific setup. It works locally without API keys by falling back to a deterministic rule-based classifier.

## Features

- Submit raw customer or business messages for classification.
- Validate classification requests and AI responses with Zod.
- Parse provider output as strict JSON only.
- Try Gemini first, OpenAI second, then a deterministic local fallback.
- Store review items in a local JSON file through a small repository layer.
- Filter the queue by status, category, and priority.
- Edit category, priority, suggested reply, and reviewer notes.
- Approve or reject pending review items.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod
- Server-side route handlers
- Local file-based JSON persistence

## Strict JSON Parsing

AI providers are prompted to return JSON only. The backend does not attempt to rescue markdown, code fences, comments, or partial text. Provider responses are passed through `JSON.parse`, then validated by `ClassificationSchema`.

If parsing fails or the schema is invalid, that provider is treated as failed. The app then tries the next provider or falls back to the local rule-based classifier instead of crashing.

## Provider Fallback

Classification happens in this order:

1. Gemini, when `GEMINI_API_KEY` is configured.
2. OpenAI, when `OPENAI_API_KEY` is configured.
3. Local deterministic rules when keys are missing or providers fail.

This makes local development predictable. You can run the app with no `.env.local` file and still submit messages, populate the queue, and test the human review workflow.

## Environment Variables

Copy `.env.example` to `.env.local` if you want to use real providers:

```bash
GEMINI_API_KEY=
OPENAI_API_KEY=
```

Do not commit real API keys.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Review items are stored in `data/review-items.json`, which is ignored by git.

## Example Messages

- `I was charged twice for my invoice this month and need a refund urgently.`
- `The dashboard crashes every time I upload a CSV file.`
- `Can someone send pricing for the enterprise plan and schedule a demo?`
- `Please add a Slack integration so alerts can go to our support channel.`
- `I am unhappy with the response time and want to cancel my account.`

## Testing Ideas

This project keeps dependencies minimal, so no dedicated test runner is configured yet. Good next tests would cover:

- strict JSON parsing rejects markdown-wrapped responses;
- schema validation rejects unknown categories or out-of-range confidence;
- provider fallback uses the rule-based classifier after invalid provider output;
- rule-based classification maps billing, technical, sales, and complaint examples correctly.
