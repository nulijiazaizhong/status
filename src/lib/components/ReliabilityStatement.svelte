<script lang="ts">
  import { onMount } from 'svelte';
  let root: HTMLElement;
  let active = $state(false);
  const words = ['不仅告诉你', '是否正常，', '也说明', '发生了什么。'];

  onMount(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { active = true; return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { active = true; observer.disconnect(); }
    }, { threshold: 0.4 });
    observer.observe(root);
    return () => observer.disconnect();
  });
</script>

<section class="statement" bind:this={root} aria-label="可靠性承诺">
  <p>{#each words as word, index}<span class:active style={`transition-delay: ${index * 160}ms`}>{word}</span>{#if index === 1}<br />{/if}{/each}</p>
  <small>状态、影响与进展，都来自同一套监控事实。</small>
</section>

<style>
  .statement { padding: 96px 0; }
  p { max-width: 680px; margin: 0; color: #FFF; font-size: 48px; line-height: 1.15; letter-spacing: -.04em; font-weight: 600; text-wrap: balance; }
  p span { opacity: .3; transition: opacity 700ms cubic-bezier(.22,1,.36,1); }
  p span.active { opacity: 1; }
  small { display: block; margin-top: 32px; color: #737373; font-size: 14px; line-height: 20px; }
  @media (min-width: 900px) { p { font-size: 60px; line-height: 1; } }
  @media (max-width: 600px) { .statement { padding: 64px 0; } p { font-size: 36px; line-height: 40px; } }
  @media (prefers-reduced-motion: reduce) { p span { opacity: 1; transition: none; } }
</style>
