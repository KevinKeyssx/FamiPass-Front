<script lang="ts">
	import {
		ChevronDown,
		Check,
		CircleAlert
	}                 from '@lucide/svelte';
	import { Select } from 'bits-ui';

	interface Option {
		value : string;
		label : string;
	}

	interface Props {
		label?       : string;
		value        : string;
		options      : Option[];
		placeholder? : string;
		error?       : string | null;
		required?    : boolean;
		disabled?    : boolean;
		size?        : 'small' | 'normal';
	}

	let {
		label       = '',
		value       = $bindable( '' ),
		options     = [],
		placeholder = 'Selecciona una opción',
		error       = null,
		required    = false,
		disabled    = false,
		size        = 'normal'
	}: Props = $props();

	let selectedLabel = $derived(
		options.find( ( o ) => o.value === value )?.label ?? ''
	);
</script>

<Select.Root type="single" bind:value={value} {disabled} {required}>
	<div class="flex flex-col gap-1.5 w-full">
		{#if label}
			<span class="text-sm font-medium text-text-primary select-none">
				{label}
				{#if required}
					<span class="text-accent">*</span>
				{/if}
			</span>
		{/if}

		<div class="relative w-full">
			<Select.Trigger
				class="w-full transition-all duration-300 flex items-center justify-between text-left border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group
                    bg-bg-surface-2 text-text-primary placeholder:text-text-muted
                    focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
                    {size === 'small' ? 'px-3 py-1.5 rounded-lg text-xs' : 'px-4 py-2.5 rounded-xl text-sm'}
                    {error
                        ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
                        : 'border-border hover:border-accent/40'}"
			>
				<span class={selectedLabel ? 'text-text-primary' : 'text-text-muted'}>
					{selectedLabel || placeholder}
				</span>

				<ChevronDown
					size={size === 'small' ? 14 : 16}
					class="text-text-muted group-focus:text-accent group-hover:text-accent transition-colors shrink-0 ml-2"
				/>
			</Select.Trigger>

			<Select.Portal>
				<Select.Content
					class="z-50 rounded-2xl border border-border bg-bg-surface p-1.5 shadow-lg animate-in fade-in duration-200 w-(--bits-select-anchor-width) min-w-48 max-h-60 overflow-y-auto"
					sideOffset={4}
				>
					{#each options as opt}
						<Select.Item
							value={opt.value}
							label={opt.label}
							class="flex items-center justify-between transition-colors cursor-pointer select-none text-text-primary hover:bg-bg-surface-2 data-selected:bg-accent-muted data-selected:text-accent
								{size === 'small' ? 'px-2 py-1.5 rounded-lg text-xs' : 'px-3 py-2 rounded-xl text-sm'}"
						>
							{opt.label}

							{#if value === opt.value}
								<Check size={size === 'small' ? 14 : 16} class="text-accent shrink-0" />
							{/if}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Portal>
		</div>

		{#if error}
			<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
				<CircleAlert size={14} class="shrink-0 text-red-500" />
				<span>{error}</span>
			</div>
		{/if}
	</div>
</Select.Root>
