<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme }   from '$lib/stores/theme.svelte.js';
	import { Toaster } from 'svelte-french-toast';

	interface Props {
		children : import( 'svelte' ).Snippet;
	}

	let { children }: Props = $props();

	onMount( () => {
		theme.init();
	} );
</script>

<Toaster
	position="bottom-right"
	toastOptions={ {
		style : 'background: var(--bg-surface-2, #1e293b); color: var(--text-primary, #f8fafc); border: 1px solid var(--border, rgba(255,255,255,0.1)); border-radius: 1rem; font-weight: 600; font-size: 0.875rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); padding: 12px 16px;'
	} }
/>

{@render children()}
