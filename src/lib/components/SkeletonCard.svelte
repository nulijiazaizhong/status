<div class="skeleton" aria-label="正在加载状态数据" role="status">
  <div class="line title"></div><div class="line copy"></div><div class="line copy short"></div>
  <div class="card"><div class="line copy"></div><div class="bars">{#each Array(30) as _} <span></span>{/each}</div></div>
</div>

<style>
  .skeleton { padding-top: 80px; }
  .line, .bars span { background: #272727; animation: pulse 1.5s cubic-bezier(.22,1,.36,1) infinite alternate; }
  .line { border-radius: 4px; }
  .title { width: 60%; height: 48px; }
  .copy { width: 80%; height: 20px; margin-top: 24px; }
  .short { width: 45%; margin-top: 12px; }
  .card { margin-top: 64px; padding: 24px; border: 1px solid #272727; border-radius: 16px; }
  .bars { display: flex; gap: 4px; margin-top: 32px; }
  .bars span { flex: 1; height: 32px; border-radius: 2px; }
  @keyframes pulse { from { opacity: .35; } to { opacity: .8; } }
  @media (prefers-reduced-motion: reduce) { .line, .bars span { animation: none; } }
</style>
