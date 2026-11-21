StepLyx

Turn any PDF into a step-by-step learning path.

StepLyx is not just for math. Upload a PDF on any subject (math, law, medicine, history, languages, programming) and the app builds the learning path for that topic automatically: units, lessons, questions, and the rules needed to solve them.

How it works
Upload a PDF (textbook, notes, or practice tests).
The path is generated. The PDF is split into units and lesson nodes, shown as a connected path.
Practice. Each lesson has multiple-choice questions (A/B/C/D). You can change your answer before locking it in.
Stuck? See the rule. Press "Bilmirsənsə qaydaya bax" ("If you don't know, see the rule") to open the exact rule from your PDF for that question.
Ask the AI. The built-in chatbot knows your current topic, question, and PDF rules, so its explanations stay on point.
Stay motivated. Track your daily streak, XP, leaderboard rank, and unit progress.
Features
PDF → units, lesson nodes, questions, and question-linked rules
Sequential, game-style learning path
On-demand rule for every question
Context-aware AI chat (LLM API)
Streaks, XP, leaderboards, and completion tracking
Run locally
bash
git clone https://github.com/malwarekidd/StepLyx-Learning.git
cd StepLyx-Learning
npm i
npm run dev

Add your own keys (LLM API, database) to a local .env file. Never commit it.

Tech

React, Vite, TypeScript, Supabase, Drizzle.
