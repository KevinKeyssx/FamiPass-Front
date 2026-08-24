<script lang="ts">
	import { goto }      from '$app/navigation';
	import { ArrowLeft } from '@lucide/svelte';

	interface Props {
		href?   : string;
		label?  : string;
		onclick?: () => void;
	}

	let { href = '', label = '', onclick }: Props = $props();

	function handleKeyDown( event : KeyboardEvent ): void {
		if ( event.key !== 'Escape' ) return;

		const active = document.activeElement;

		if (
			active &&
			(
				active.tagName === 'INPUT'
				|| active.tagName === 'TEXTAREA'
				|| active.getAttribute( 'contenteditable' ) === 'true'
			)
		) return;

		if ( onclick ) {
			onclick();
		} else if ( href ) {
			goto( href );
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if href}
	<a
		{href}
		class="inline-flex items-center gap-2 p-2.5 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted border border-border/40 bg-transparent transition-all duration-300 group/back shrink-0 focus-ring"
		aria-label="Volver"
	>
		<ArrowLeft
			size={18}
			class="transition-transform duration-300 group-hover/back:-translate-x-1 shrink-0"
		/>
		{#if label}
			<span class="text-xs font-semibold pr-1">{label}</span>
		{/if}
	</a>
{:else}
	<button
		type="button"
		{onclick}
		class="inline-flex items-center gap-2 p-2.5 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted border border-border/40 bg-transparent transition-all duration-300 group/back shrink-0 focus-ring cursor-pointer"
		aria-label="Volver"
	>
		<ArrowLeft
			size={18}
			class="transition-transform duration-300 group-hover/back:-translate-x-1 shrink-0"
		/>
		{#if label}
			<span class="text-xs font-semibold pr-1">{label}</span>
		{/if}
	</button>
{/if}
