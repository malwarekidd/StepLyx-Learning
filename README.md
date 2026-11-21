# Pathwise Learning Garden

Build an interactive web prototype/demo for an AI-powered learning path platform called "LEARNWITHAI" with a modern dark UI inspired by the provided reference screenshots, using sample/illustrative content derived from a curriculum PDF.

### 1. Visual Direction & Layout (Illustrative Reference)

- **Theme:** Sleek dark mode interface (`#0f1318` / `#181a1f` dark surfaces) with vibrant magenta/pink unit headers (e.g., "Natural ədədlər / Unit 1") and clean, high-contrast typography.

- **Top Navigation Bar:** Include a hamburger menu icon on the left, centered brand title ("LEARNWITHAI"), and a profile/status badge on the right.

- **Learning Path View (Screen 1):**

  - Display a unit banner card at the top followed by a vertical, connected node path (using dashed connectors, circular lesson nodes, lightning/star/review/checkpoint icons, and a "BAŞLAT" callout on the active node).

  - Include sample nodes such as:

    1. "Natural ədədlər və onların onluq yazılışı" (Active)

    2. "Bölünmə əlamətləri və qalıqlı bölmə"

    3. "Sadə və mürəkkəb ədədlər, ƏBOB və ƏKOB"

    4. "Unit 1 Review"

    5. Section divider ("Çoxluqlar, kəsrlər və faiz") and subsequent nodes.

  - Clicking any unlocked/active lesson node opens the interactive lesson/quiz view for that topic. Also include a "Simulate PDF Upload / Regenerate Path" control in the demo so reviewers can see how a PDF structures units, lessons, questions, and rules.

### 2. Lesson & Quiz View (Screen 2)

- When a user enters a lesson, display structured multiple-choice question cards (`Sual 1`, `Sual 2`, etc.) with four selectable radio/option choices (`A)`, `B)`, `C)`, `D)`).

- Populate realistic sample questions and options for the selected topic (e.g., natural numbers, decimal place value, divisibility rules), while keeping the structure modular so questions and rules are mapped to extracted PDF sections.

- Below the answer options on each question card, include the **"Bilmirsənsə qaydaya bax"** ("If you don't know, see the rule") button.

### 3. Rule Drawer / Modal ("Bilmirsənsə qaydaya bax")

- Clicking **"Bilmirsənsə qaydaya bax"** on any question reveals an expandable panel, drawer, or modal showing the specific rule and step-by-step guidance extracted from the reference PDF for solving that exact question (e.g., the mathematical rule, formula/condition, PDF source reference tag, and a short worked example).

- Allow the user to toggle/close the rule easily and continue answering the question with immediate feedback (correct/incorrect state, score/progress update, and next-question/return-to-path navigation).

### 4. Demo Polish & Interactivity

- Make the entire prototype responsive, interactive, and self-contained with clean mock/sample PDF rule data so a stakeholder or evaluator can test:

  1. Navigating the learning path (`LEARNWITHAI`).

  2. Entering a lesson and answering multiple-choice questions.

  3. Clicking **"Bilmirsənsə qaydaya bax"** to view the PDF-backed solving rule and then selecting an answer.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pathwise-learning-garden.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b6c2025-29c4-485e-9752-aa3535d76cd1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
