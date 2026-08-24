<script lang="ts">
	import { AlertCircle } from '@lucide/svelte';

	interface Props {
		label?       : string;
		value        : string;
		error?       : string | null;
		placeholder? : string;
		required?    : boolean;
		id?          : string;
		name?        : string;
		disabled?    : boolean;
		size?        : 'small' | 'normal';
	}

	let {
		label       = '',
		value       = $bindable(),
		error       = null,
		placeholder = '',
		required    = false,
		id          = '',
		name        = '',
		disabled    = false,
		size        = 'normal'
	}: Props = $props();
</script>

<div class="flex flex-col gap-1.5 w-full">
	{#if label}
		<label for={id} class="text-sm font-medium text-text-primary select-none">
			{label}
			{#if required}
				<span class="text-accent">*</span>
			{/if}
		</label>
	{/if}

	<input
		type="text"
		{id}
		{name}
		{placeholder}
		{disabled}
		bind:value={value}
		class="w-full border transition-all duration-300
		       bg-bg-surface-2 text-text-primary placeholder:text-text-muted
		       focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
		       {size === 'small' ? 'px-3 py-2 rounded-lg text-xs' : 'px-4 py-2.5 rounded-xl text-sm'}
		       {error
		           ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
		           : 'border-border hover:border-accent/40'}
		       disabled:opacity-60 disabled:cursor-not-allowed"
	/>

	{#if error}
		<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
			<AlertCircle size={14} class="shrink-0" />
			<span>{error}</span>
		</div>
	{/if}
</div>
