<script lang="ts">
	interface Props {
		class?   : string;
		children : import( 'svelte' ).Snippet;
	}

	let { class : extraClass = '', children }: Props = $props();
</script>

<span
	class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
	       bg-(--status-bg) text-(--status-text) {extraClass}"
>
	{@render children()}
</span>
