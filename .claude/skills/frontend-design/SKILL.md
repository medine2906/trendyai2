---
name: frontend-design
description: Design system and taste rules for any UI work in this repo (new components, pages, or visual edits under src/app or src/components). Load before writing JSX/Tailwind so output uses a real type scale, an 8px spacing grid, defined color tokens, and consistent component patterns instead of generic ad-hoc Tailwind.
---

# Frontend Design Rules (ShopMind)

Apply these whenever building or editing UI in `src/app/**` or `src/components/**`. This
project has no shadcn/ui — components in `src/components/ui/` are hand-rolled, so new
components must match the tokens and patterns below rather than inventing new ones.

## Typography scale

Use only these sizes (Tailwind classes). Never reach for an arbitrary `text-[13px]` etc.

| Role              | Class            |
|-------------------|------------------|
| Page title        | `text-2xl font-bold` |
| Section heading   | `text-lg font-semibold` |
| Card title        | `text-base font-semibold` |
| Body              | `text-sm` |
| Secondary/meta    | `text-xs text-muted-foreground` (or `text-gray-500` if no token exists) |

Line height: default Tailwind leading is fine for body; headings use `leading-tight`.

## Spacing (8px grid)

Only use spacing values that are multiples of `2` (=8px) in Tailwind's scale: `p-2, p-4,
p-6, p-8, p-12`, `gap-2, gap-4, gap-6`, `space-y-4`, etc. Avoid odd values like `p-3`,
`p-5`, `gap-7` — they break rhythm with the rest of the app. Exception: `1px` borders
and `px-1`/`py-1` for tight badges/chips are fine.

Standard paddings:
- Card: `p-4` (mobile) / `p-6` (desktop)
- Page container: `px-4 py-6 md:px-8 md:py-8`
- Stack gaps between sections: `space-y-6` or `space-y-8`

## Color tokens

Do not use random hex codes or arbitrary Tailwind colors picked ad hoc. Use:

- **Primary / brand**: whatever brand color already appears in `globals.css` /
  `layout.tsx` (check for CSS variables like `--primary` before adding a new one). If
  none exists yet, use `zinc-900` (light) / `zinc-50` (dark) as primary-neutral and pick
  ONE accent color for actions (buttons, links, active states) — reuse it everywhere.
- **Neutral scale**: `zinc-*` (backgrounds, borders, secondary text) — don't mix `gray-*`
  and `zinc-*` and `slate-*` in the same component.
- **Semantic**: success `green-600`, error `red-600`, warning `amber-600` — only for
  actual state feedback (form errors, toasts), never decoratively.
- **Borders**: `border-zinc-200` (light) / `border-zinc-800` (dark).

Before adding a new color, grep `src/app/globals.css` and existing components for
already-defined tokens/variables and reuse them instead of introducing a new one.

## Component patterns

- **Buttons**: consistent height (`h-9` default, `h-10` for primary CTAs), `rounded-lg`,
  `font-medium text-sm`. States: default / `hover:` (slightly darker or `/90` opacity) /
  `disabled:opacity-50 disabled:pointer-events-none` / focus ring
  (`focus-visible:ring-2 focus-visible:ring-offset-2`).
- **Cards**: `rounded-xl border border-zinc-200 bg-white p-4 shadow-sm` (dark:
  `border-zinc-800 bg-zinc-950`). Don't mix `rounded-md`/`rounded-2xl` across sibling
  cards — pick one radius per component family.
- **Forms**: label above input, `text-sm font-medium` label, `h-10 rounded-lg border
  px-3 text-sm` input, error text `text-xs text-red-600 mt-1`. Consistent vertical
  rhythm via `space-y-4` between fields.
- **Icon buttons**: fixed square hit area (`h-9 w-9`), icon centered, never icon
  touching the edge — keep `p-2` minimum padding around the icon.

Reuse existing components in `src/components/ui/` before writing a new primitive from
scratch — check that folder first.

## Avoid the generic AI aesthetic

- No purple/violet gradient backgrounds or hero sections unless explicitly requested.
- No unnecessary drop shadows, glassmorphism, or blur (`backdrop-blur`) stacked on
  everything — use `shadow-sm` sparingly, only on elevated surfaces (cards over page bg,
  dropdowns, modals).
- No emoji as icons — use a real icon set already in use in the project (check imports
  in existing components before adding a new icon library).
- Don't center everything in a `max-w-md mx-auto` card by default — match the layout
  density of surrounding pages (this is a social/feed app, not a landing page).
- Vary visual weight intentionally: one primary action per view, not five equally
  bold buttons.
- Real, specific copy over placeholder-sounding text ("Explore trending picks", not
  "Discover Amazing Products Today").

## Windows/Tailwind-v4 caveat for this repo specifically

Per `CLAUDE.md`: Tailwind's class scanner sometimes fails to pick up a brand-new class
name in this project's path (contains "Masaüstü"). When using a Tailwind utility class
that has never appeared anywhere else in the codebase (check with a repo-wide grep
first), verify it actually landed in compiled CSS rather than trusting the DOM. If it's
a layout-critical property (max-width, overflow, position offset, z-index, or a
first-use `hover:`/`focus:` variant), prefer an existing already-used class or fall back
to an inline `style={{ ... }}` rather than risking a silently-dropped rule.
