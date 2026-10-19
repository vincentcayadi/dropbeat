# Dropbeat

This repo is made to just test my js skills and ui skills nothing too fancy like a navidrome or subsonic client.

Drag and drop audio files anywhere on the page to queue them. The queue is stored in IndexedDB, plays endlessly (the last track wraps back to the first), and pulls lyrics from [lrclib.net](https://lrclib.net).

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000). The app starts at `src/App.svelte`.

| Command | What it does |
| --- | --- |
| `bun dev` | Vite dev server on port 3000 |
| `bun run build` | Production build into `dist/` |
| `bun test` | Run unit tests |
| `bunx svelte-check` | Type-check Svelte and TypeScript |
