<script lang="ts">
	import { PinInput as BitsPinInput } from 'bits-ui';

	interface Props {
		value?         : string;
		length?        : number;
		pattern?       : string;
		disabled?      : boolean;
		onComplete?    : ( val : string ) => void;
		onValueChange? : ( val : string ) => void;
	}

	let {
		value = $bindable( '' ),
		length = 5,
		pattern,
		disabled = false,
		onComplete,
		onValueChange
	}: Props = $props();

	function handleComplete( val : string ): void {
		onComplete?.( val );
	}
</script>

<div class="flex justify-center w-full">
	<BitsPinInput.Root
		bind:value={value}
		maxlength={length}
		{pattern}
		{disabled}
		onComplete={handleComplete}
		onValueChange={onValueChange}
	>
		{#snippet children( { cells } )}
			<div class="flex items-center gap-2 sm:gap-2.5 justify-center">
				{#each cells as cell}
					<BitsPinInput.Cell
						{cell}
						class="w-11 h-14 sm:w-12 sm:h-15 rounded-2xl border text-center font-black text-xl sm:text-2xl text-(--accent) transition-all duration-300 uppercase flex items-center justify-center select-none
                            {cell.isActive ? 'border-(--accent) ring-4 ring-(--accent)/10 scale-105 shadow-[0_0_15px_rgba(0,180,216,0.2)]' : 'border-(--border) hover:border-(--accent)/40'}
                            {cell.char ? 'bg-(--accent-muted)/10 border-(--accent)/30' : 'bg-(--bg-surface-2)'}
                            {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
					>
						{cell.char}
					</BitsPinInput.Cell>
				{/each}
			</div>
		{/snippet}
	</BitsPinInput.Root>
</div>
