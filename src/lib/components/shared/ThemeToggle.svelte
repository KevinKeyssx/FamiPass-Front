<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';
	import { theme }     from '$lib/stores/theme.svelte.js';

	interface Props {
		class? : string;
	}

	let { class : extraClass = '' }: Props = $props();
</script>

<button
	type="button"
	onclick={() => theme.toggle()}
	class="p-2.5 rounded-xl text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-all duration-200 border border-(--border) cursor-pointer select-none active:scale-90 {extraClass}"
	aria-label={theme.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
	title={theme.isDark ? 'Modo Claro' : 'Modo Oscuro'}
>
	{#if theme.isDark}
		<Sun size={18} />
	{:else}
		<Moon size={18} />
	{/if}
</button>
