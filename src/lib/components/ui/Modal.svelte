<script lang="ts">
	import Button from './Button.svelte';

	interface Props {
		open            : boolean;
		title           : string;
		onClose         : () => void;
		onConfirm?      : () => void;
		confirmLabel?   : string;
		confirmVariant? : 'primary' | 'secondary' | 'ghost' | 'danger';
		loading?        : boolean;
		size?           : 'md' | 'lg' | 'xl';
		children        : import( 'svelte' ).Snippet;
	}

	let {
		open,
		title,
		onClose,
		onConfirm,
		confirmLabel   = 'Confirmar',
		confirmVariant = 'primary',
		loading        = false,
		size           = 'md',
		children
	}: Props = $props();

	function handleBackdrop( e : MouseEvent ): void {
		if ( ( e.target as HTMLElement ).dataset.backdrop ) onClose();
	}

	function handleKeydown( e : KeyboardEvent ): void {
		if ( e.key === 'Escape' ) onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		data-backdrop="true"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-backdrop="true"></div>

		<!-- Panel -->
		<div
			class="relative z-10 w-full {size === 'lg' ? 'max-w-lg' : size === 'xl' ? 'max-w-xl' : 'max-w-md'} rounded-2xl border border-(--border) bg-(--bg-surface) shadow-(--shadow-lg) p-6 animate-in"
		>
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<h2 id="modal-title" class="text-lg font-bold text-(--text-primary)">
					{title}
				</h2>
				<button
					type="button"
					onclick={onClose}
					class="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-surface-2) transition-colors cursor-pointer"
					aria-label="Cerrar modal"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="text-(--text-secondary) mb-6">
				{@render children()}
			</div>

			<!-- Actions -->
			{#if onConfirm}
				<div class="flex gap-3 justify-end">
					<Button variant="secondary" onclick={onClose}>Cancelar</Button>
					<Button variant={confirmVariant} onclick={onConfirm} {loading}>
						{confirmLabel}
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes animate-in {
		from {
			opacity   : 0;
			transform : scale( 0.96 ) translateY( 8px );
		}
		to {
			opacity   : 1;
			transform : scale( 1 ) translateY( 0 );
		}
	}
	.animate-in {
		animation : animate-in 0.2s ease-out;
	}
</style>
