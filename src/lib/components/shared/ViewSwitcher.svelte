<script lang="ts">
	import { page }               from '$app/state';
	import { goto }               from '$app/navigation';
	import { LayoutGrid, Table }  from '@lucide/svelte';

	interface Props {
		paramName? : string;
	}

	let {
		paramName = 'view'
	}: Props = $props();

	const activeValue = $derived( page.url.searchParams.get( paramName ) || 'card' );

	function select( val : string ): void {
		const newUrl = new URL( page.url );
		newUrl.searchParams.set( paramName, val );

		goto( newUrl.pathname + newUrl.search, {
			keepFocus    : true,
			replaceState : true
		} );
	}
</script>

<div class="inline-flex rounded-full border border-(--border)/60 p-1 bg-(--bg-surface-2)/90 backdrop-blur-sm shadow-inner shadow-black/5">
	<button
		type="button"
		onclick={() => { select( 'card' ); }}
		class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer active:scale-95 select-none
			{ activeValue === 'card'
				? 'bg-(--accent) text-(--accent-text) shadow-sm font-bold'
				: 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border)/30' }"
	>
		<LayoutGrid size={13} />
		Tarjetas
	</button>

	<button
		type="button"
		onclick={() => { select( 'table' ); }}
		class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer active:scale-95 select-none
			{ activeValue === 'table'
				? 'bg-(--accent) text-(--accent-text) shadow-sm font-bold'
				: 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border)/30' }"
	>
		<Table size={13} />
		Tabla
	</button>
</div>
