<script lang="ts">
	import Navbar    from '$lib/components/navigation/Navbar.svelte';
	import BottomNav from '$lib/components/navigation/BottomNav.svelte';

	interface Props {
		data : {
			user : any;
			role : any;
		};
		children : import( 'svelte' ).Snippet;
	}

	let { data, children }: Props = $props();
</script>

<div class="min-h-screen flex flex-col bg-(--bg-base) text-(--text-primary)">
	<Navbar user={data.user} role={data.role} />

	<main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-24 sm:pb-8">
		{@render children()}
	</main>

	<BottomNav role={data.role} />
</div>
