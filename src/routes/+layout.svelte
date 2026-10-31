<script lang="ts">
  import '@fontsource/geist/400.css';
  import '@fontsource/geist/500.css';
  import '@fontsource/geist/600.css';
  import '@fontsource/geist-mono/400.css';
  import '@fontsource/geist-mono/500.css';
  import 'lxgw-wenkai-webfont/lxgwwenkaimono-regular.css';
  import '../app.css';
  import { publicEnv as env } from '../lib/config';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={env.PUBLIC_FAVICON_URL || '/favicon.svg'} />
</svelte:head>

{@render children()}
