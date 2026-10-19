<script lang="ts">
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import X from '@lucide/svelte/icons/x';
  import type { PlaylistItem } from '../utils/playlistTypes';

  type Props = {
    items: PlaylistItem[];
    currentId: string | null;
    onPlay: (id: string) => void;
    onRemove: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
  };

  let { items, currentId, onPlay, onRemove, onMoveUp, onMoveDown }: Props = $props();
</script>

<div class="playlist">
  {#if !items.length}
    <p class="empty">Drop tracks to build a playlist.</p>
  {:else}
    {#each items as item (item.id)}
      <div class={['row', currentId === item.id && 'active']}>
        <div
          class="meta"
          role="button"
          tabindex="0"
          onclick={() => onPlay(item.id)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onPlay(item.id)}
        >
          <div class="title">{item.title}</div>
          <div class="artist">{item.artist}{!item.hasBlob ? ' · needs file' : ''}</div>
        </div>
        <div class="controls">
          <button onclick={() => onMoveUp(item.id)} aria-label="Move up" disabled={currentId === item.id}>
            <ChevronUp size={20} />
          </button>
          <button onclick={() => onMoveDown(item.id)} aria-label="Move down" disabled={currentId === item.id}>
            <ChevronDown size={20} />
          </button>
          <button onclick={() => onRemove(item.id)} aria-label="Remove">
            <X size={20} />
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
