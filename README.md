# steplyx-learning

Upload any PDF — a textbook, exam guide, lecture notes, or any subject — and steplyx-learning builds a step-by-step interactive learning path for it. It's not limited to math: upload a history PDF and get history lessons; upload a chemistry PDF and get chemistry lessons. The topic comes from your file.

## What it does

**PDF → Learning path.** An AI reads your uploaded PDF and generates a structured curriculum: units broken into lessons, each lesson containing practice questions, with every question linked to the exact rule from your PDF that explains how to solve it.

**"If you don't know, see the rule."** When you're stuck on a question, one tap reveals the specific rule extracted from your PDF — not a vague hint, the actual rule that solves it. No more searching through 300 pages manually.

**AI tutor chat.** A chat assistant is aware of your current lesson, the active question, and all the rules in your PDF. It guides you through the reasoning without giving away the answer until you've answered.

**Progress tracking.** XP points, daily streaks, unit completion, and a leaderboard keep the momentum going across a long study period.

## How it works

1. Upload a PDF (textbook chapter, exam syllabus, lecture notes — any topic)
2. The AI extracts units, lessons, questions, and rules from your document
3. Work through lessons in order; each question shows only what your PDF covers
4. When stuck, tap "See the rule" for the relevant excerpt
5. Chat with the AI tutor for step-by-step guidance on the current question
6. Track your streak and XP as you progress through the material

## Stack

- **Frontend / routing** — React + TanStack Router + TanStack Start (SSR)
- **Styling** — Tailwind CSS + shadcn/ui
- **Database / auth** — Supabase (Postgres, Row-Level Security, Storage for PDFs)
- **AI** — AI gateway (PDF extraction + tutor chat streaming)
- **ORM / migrations** — Drizzle

## Development

```bash
bun install
bun dev
```

Requires a Supabase project. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (and `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` for server functions) in a `.env` file.
