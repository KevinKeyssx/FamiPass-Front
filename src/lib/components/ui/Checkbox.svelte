<script lang="ts">
	import { Checkbox } from 'bits-ui';
	import { Check }    from '@lucide/svelte';

	interface Props {
		checked      : boolean;
		label        : string;
		description? : string;
		disabled?    : boolean;
		required?    : boolean;
		id?          : string;
	}

	let {
		checked     = $bindable( false ),
		label       = '',
		description = '',
		disabled    = false,
		required    = false,
		id          = ''
	}: Props = $props();
</script>

<div
	onclick={() => { if ( !disabled ) checked = !checked; }}
	onkeydown={( e ) => e.key === 'Enter' && !disabled && ( checked = !checked )}
	tabindex="0"
	role="checkbox"
	aria-checked={checked}
	class="flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-300 border text-left cursor-pointer select-none
	       focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/10
	       {checked
	           ? 'bg-accent-muted/30 border-accent'
	           : 'bg-bg-surface-2 border-border hover:border-accent/40'}
	       {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
>
	<div class="flex flex-col gap-0.5">
		<span class="text-sm font-semibold transition-colors duration-200 text-text-primary">
			{label}
			{#if required}
				<span class="text-accent">*</span>
			{/if}
		</span>
		{#if description}
			<p class="text-xs text-text-secondary">{description}</p>
		{/if}
	</div>

	<Checkbox.Root
		bind:checked={checked}
		{disabled}
		{required}
		{id}
		class="w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer
		       {checked
		           ? 'bg-accent border-accent'
		           : 'bg-bg-surface border-border'}
		       focus-visible:outline-none"
	>
		{#snippet children( { checked } )}
			{#if checked}
				<div class="text-accent-text animate-in zoom-in duration-200">
					<Check size={14} strokeWidth={3} />
				</div>
			{/if}
		{/snippet}
	</Checkbox.Root>
</div>
