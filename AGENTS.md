# AGENTS.md — FlowJournal (心流手账)

## Stack

- **uni-app Vue 3** + `<script setup>` + Composition API — CLI project (Vite)
- **SCSS** — all components use `<style lang="scss" scoped>`
- **Sass** 1.70+ (devDependency)
- No test framework, no lint config, no TypeScript

## Dev commands

```bash
npm run dev          # H5 dev server at localhost:5173
npm run build:h5     # production build
```

Source is under `src/`. Entry: `src/main.js` → `createSSRApp(App)`.

## Project architecture

```
src/
  App.vue            # global ParticleCanvas + book-cover background
  main.js            # createApp(), init uni.$db
  pages.json         # 4 pages, all navigationStyle:"custom"
  uni.scss           # theme variables ($paper, $ink, $accent, etc.)
  common/db.js       # FlowDB: plus.sqlite wrapper (Promise API)
  utils/swipeNav.js  # composable for blank-area swipe navigation
  components/        # 9 reusable components
  pages/
    home/index.vue   # diary entries + mood bookmarks + date navigation
    todos/index.vue  # category cards with progress rings
    stats/index.vue  # statistics with animated numbers
    breathe/index.vue# breathing exercise
```

## Global state (via `uni.$`)

| Key | Purpose |
|-----|---------|
| `uni.$db` | FlowDB singleton (init in main.js, init() in App.onLaunch) |
| `uni.$flipDirection` | 'next'/'prev'/null — consumed by BookPage on mount |
| `uni.$pageOrder` | `['home','todos','stats','breathe']` — used for swipe navigation |
| `uni.$appState` | `{ currentMood, composeOpen }` |
| `uni.$spawnInkBurst(x,y,color)` | trigger particle effect |
| `uni.$spawnBookmarkDust(x,y,mood)` | trigger bookmark particle |
| `uni.$emit('particle:inkBurst', data)` | cross-component particle trigger |
| `uni.$emit('breath:scaleUpdate', n)` | sync breath scale to particles |

## Critical App compatibility rules

These **will break** on App platform if ignored:

| Don't | Do instead |
|-------|-----------|
| `<div>` | `<view>` |
| `@tap` | `@click` |
| `hover-class` | `:active` CSS pseudo-class |
| inline SVG | text/emoji (`📖✓📊🌬`) |
| `performance.now()` | `Date.now()` |
| `requestAnimationFrame` | `setTimeout(fn, 16)` |
| `ref.value.querySelectorAll()` | not available — use class-based CSS animations |
| `ref.value.getBoundingClientRect()` | doesn't exist — use `uni.createSelectorQuery()` |
| `backdrop-filter` | avoid (inconsistent support) |

## Page navigation

- No native tabBar — custom `NavSpine` component with `uni.reLaunch`
- Page order affects flip direction: `home(0) → todos(1) → stats(2) → breathe(3)`
- `uni.$flipDirection` must be set **synchronously before** `uni.reLaunch()`
- Flip animation is `@keyframes flipInNext/flipInPrev` (1.0s, `cubic-bezier(0.4,0,0.2,1)`)
- BookPage plays the animation on mount via CSS class

## Database (FlowDB — `common/db.js`)

- App: `plus.sqlite.openDatabase({name, path, success, fail})`
- H5 fallback: in-memory (no persistence, logs warning)
- **Methods**: `init()`, `getDiaries/addDiary/deleteDiary`, `getTodos/addTodo/toggleTodo/deleteTodo`, `getStats`
- API is `plus.sqlite.executeSql({name, sql, success, fail})` — **static method**, not on db handle
- Tables: `diaries(id,text,mood,date,fullDate,timestamp)`, `todos(id,text,completed,createdAt)`
- No parameterized queries — SQL injection guard via `this._esc()` (single-quote escape)

## Components

| Component | Role | Key interaction |
|-----------|------|----------------|
| `BookPage` | Paper sheet wrapper, 3D flip animation | `direction` prop, `@animationend→emit('ready')` |
| `NavSpine` | Bottom tab navigation (wooden tags + cords) | Sets `uni.$flipDirection` + `uni.reLaunch` |
| `DiaryCard` | Post-it note style entry | Swipe right → archive (30%) → delete (50%) |
| `MoodMark` | Right-side mood bookmarks | `v-model` on current mood |
| `TodoSwipe` | Swipeable todo item | Swipe right = complete, left = delete |
| `ComposeSheet` | Bottom sheet for new diary entry | `v-model:open`, emits `save` |
| `BreathOrb` | Breathing exercise orb | Emits `scaleChange` and `activeChange` |
| `ParticleCanvas` | Global canvas particle layer | Exposes `spawnInkBurst/setBreathScale` |

## Swipe navigation (`utils/swipeNav.js`)

- Import `useSwipeNav(pageId)` → returns `{ onTouchStart, onTouchEnd }`
- Bind to outermost `<view>` via `@touchstart`/`@touchend`
- Skips touches originating inside interactive elements (`.diary-entry`, `.header`, `.cat-head`, etc.)
- Right swipe → prev page, Left swipe → next page (threshold 50px)

## Styling

- Theme variables in `src/uni.scss`
- Fonts: `'Noto Serif SC'` (offline in `static/fonts/`, commented out in App.vue), falls back to system Songti
- Animation curves: `$ease-page-flip` (0.4,0,0.2,1), `$ease-ink` (0.22,1,0.36,1), `$ease-bounce` (0.34,1.56,0.64,1)
- No TypeScript — plain JS with `vue` + `@dcloudio/uni-app` imports
