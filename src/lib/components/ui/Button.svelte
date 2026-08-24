<script lang="ts">
	interface Props {
		variant?  : 'primary' | 'secondary' | 'ghost' | 'danger';
		size?     : 'sm' | 'md' | 'lg';
		type?     : 'button' | 'submit' | 'reset';
		disabled? : boolean;
		loading?  : boolean;
		class?    : string;
		onclick?  : () => void;
		children  : import( 'svelte' ).Snippet;
	}

	let {
		variant  = 'primary',
		size     = 'md',
		type     = 'button',
		disabled = false,
		loading  = false,
		class    : extraClass = '',
		onclick,
		children
	}: Props = $props();

	const baseStyles = [
		'inline-flex items-center justify-center gap-2 font-medium rounded-xl',
		'transition-all duration-200 cursor-pointer select-none',
		'focus-visible:outline-2 focus-visible:outline-offset-2',
		'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
	].join( ' ' );

	const sizeStyles: Record<string, string> = {
		sm : 'px-3 py-1.5 text-xs',
		md : 'px-4 py-2.5 text-sm',
		lg : 'px-6 py-3.5 text-base font-semibold'
	};

	const variantStyles: Record<string, string> = {
		primary   : 'bg-(--accent) text-(--accent-text) hover:bg-(--accent-hover) shadow-sm hover:shadow-md active:scale-95 focus-visible:outline-(--accent)',
		secondary : 'bg-(--bg-surface-2) text-(--text-primary) border border-(--border) hover:border-(--accent) hover:text-(--accent) active:scale-95',
		ghost     : 'bg-transparent text-(--text-secondary) hover:bg-(--accent-muted) hover:text-(--accent) active:scale-95',
		danger    : 'bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md active:scale-95 focus-visible:outline-red-500'
	};
</script>

<button
	{type}
	{disabled}
	class="{baseStyles} {sizeStyles[ size ]} {variantStyles[ variant ]} {extraClass}"
	onclick={onclick}
	aria-disabled={disabled || loading}
>
	{#if loading}
		<span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
	{/if}
	{@render children()}
</button>
