<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Curriculum shape lives in `src/data/curriculum.ts` (sample) and `src/lib/curriculum-schema.ts` (AI extraction + normalization); every question references a rule and every rule a PDF section — the UI depends on these links.
- The active curriculum is either the built-in sample (key `sample`) or a row in `curricula`; load it only through `loadCurriculum` so server and client agree.
- XP, streaks and lesson progress are written only by the `submitLesson` server function via the admin client after re-grading answers; never add client write access to `learner_stats` or `lesson_progress`.
- Game rules (XP amounts, combo, streak math, unlocking) are pure functions in `src/lib/game-logic.ts` with tests in `src/test/game-logic.test.ts`; change rules there, not in components.
- Leaderboards read other users only through the RPCs `get_global_leaderboard` (security definer) and `get_topic_leaderboard` (service-role only, called via the admin client with the verified user as `_viewer`), which expose public fields only; this keeps protected rows out of direct client RPC calls.
- The tutor chat streams plain text from the `/api/chat` server route (bearer-verified) and persists one conversation per user in `chat_messages`.
- Unit tone colors come from `data-tone` scopes setting `--tone`; use `bg-tone`/`text-tone` instead of hard-coded unit colors.
