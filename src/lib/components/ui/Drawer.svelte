<script lang="ts">
	import { X } from '@lucide/svelte';

	interface Props {
		open         : boolean;
		title        : string;
		description? : string;
		onClose      : () => void;
		children     : import( 'svelte' ).Snippet;
	}

	let {
		open,
		title,
		description,
		onClose,
		children
	}: Props = $props();

	function handleBackdrop( e : MouseEvent ): void {
		if ( ( e.target as HTMLElement ).dataset.backdrop ) {
			onClose();
		}
	}

	function handleKeydown( e : KeyboardEvent ): void {
		if ( e.key === 'Escape' ) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex"
		data-backdrop="true"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		aria-labelledby="drawer-title"
	>
		<!-- Backdrop -->
		<div class="fixed inset-0 bg-black/60 backdrop-blur-xs animate-backdrop" data-backdrop="true"></div>

		<!-- Panel deslizante de izquierda a derecha -->
		<div class="relative z-10 w-full max-w-sm sm:max-w-md h-full bg-(--bg-surface) border-r border-(--border) shadow-2xl flex flex-col animate-drawer">
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-(--border)/60 bg-(--bg-surface-2)/40 shrink-0">
				<div>
					<h2 id="drawer-title" class="text-base font-bold text-(--text-primary)">
						{title}
					</h2>
					{#if description}
						<p class="text-xs text-(--text-muted) mt-0.5">
							{description}
						</p>
					{/if}
				</div>

				<button
					type="button"
					onclick={onClose}
					class="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-surface-2) transition-colors cursor-pointer"
					aria-label="Cerrar panel"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Content (scrollable) -->
			<div class="flex-1 overflow-y-auto p-5">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes backdrop-in {
		from {
			opacity : 0;
		}
		to {
			opacity : 1;
		}
	}

	@keyframes slide-in-left {
		from {
			transform : translateX( -100% );
		}
		to {
			transform : translateX( 0 );
		}
	}

	.animate-backdrop {
		animation : backdrop-in 0.25s cubic-bezier( 0.16, 1, 0.3, 1 );
	}

	.animate-drawer {
		animation : slide-in-left 0.28s cubic-bezier( 0.16, 1, 0.3, 1 );
	}
</style>
