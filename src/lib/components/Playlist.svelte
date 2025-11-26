<script lang="ts">
  export type PlaylistItem = {
    id: string;
    title: string;
    artist: string;
    hasBlob: boolean;
  };

  export let items: PlaylistItem[] = [];
  export let currentId: string | null = null;
  export let onPlay: (id: string) => void;
  export let onRemove: (id: string) => void;
  export let onMoveUp: (id: string) => void;
  export let onMoveDown: (id: string) => void;
</script>

<div class="playlist">
  {#if !items.length}
    <p class="empty">Drop tracks to build a playlist.</p>
  {:else}
    {#each items as item}
        <div class={`row ${currentId === item.id ? 'active' : ''}`}>
          <div
            class="meta"
            role="button"
            tabindex="0"
          on:click={() => onPlay(item.id)}
          on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onPlay(item.id)}
        >
          <div class="title">{item.title}</div>
          <div class="artist">{item.artist}{!item.hasBlob ? ' · needs file' : ''}</div>
          </div>
          <div class="controls">
            <button on:click={() => onMoveUp(item.id)} aria-label="Move up" disabled={currentId === item.id}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
            <button on:click={() => onMoveDown(item.id)} aria-label="Move down" disabled={currentId === item.id}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          <button on:click={() => onRemove(item.id)} aria-label="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .playlist {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 8px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 8px;
    gap: 8px;
    border-radius: 8px;
    transition: background 0.2s ease;
  }

  .row.active {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .row + .row {
    margin-top: 4px;
  }

  .meta {
    cursor: pointer;
  }

  .title {
    font-weight: 600;
    color: #f8f8f8;
  }

  .artist {
    font-size: 0.85rem;
    color: #cfd0d2;
  }

  .controls {
    display: inline-flex;
    gap: 4px;
  }

  button {
    background: rgba(255, 255, 255, 0.08);
    color: #f6f6f6;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    padding: 4px 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  button:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .empty {
    margin: 0;
    color: #cfd0d2;
    font-size: 0.9rem;
    padding: 4px;
  }
</style>
