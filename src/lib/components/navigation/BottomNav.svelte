<script lang="ts">
	import { page }                                               from '$app/stores';
	import type { UserRole }                                      from '$lib/types/index.js';
	import { QrCode, Ticket, Users, ClipboardList, Calendar }    from '@lucide/svelte';

	interface Props {
		role : UserRole;
	}

	let { role }: Props = $props();

	const isOperator = $derived( [ 'SUPER_ADMIN', 'ADMIN', 'STAFF' ].includes( role ) );
	const pathname   = $derived( $page.url.pathname );
</script>

<nav class="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-(--border) px-2 py-1.5 pb-safe">
	<div class="flex items-center justify-around">
		{#if isOperator}
			<!-- Operator Tabs -->
			<a
				href="/operator/scan"
				class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all {pathname === '/operator/scan' ? 'text-(--accent) font-bold' : 'text-(--text-muted) hover:text-(--text-primary)'}"
			>
				<div class="p-1 rounded-lg {pathname === '/operator/scan' ? 'bg-(--accent-muted)' : ''}">
					<QrCode size={20} />
				</div>
				<span class="text-[10px]">Escanear</span>
			</a>

			<a
				href="/operator/orders"
				class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all {pathname.startsWith( '/operator/orders' ) ? 'text-(--accent) font-bold' : 'text-(--text-muted) hover:text-(--text-primary)'}"
			>
				<div class="p-1 rounded-lg {pathname.startsWith( '/operator/orders' ) ? 'bg-(--accent-muted)' : ''}">
					<ClipboardList size={20} />
				</div>
				<span class="text-[10px]">Órdenes</span>
			</a>

			<a
				href="/operator/events"
				class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all {pathname === '/operator/events' ? 'text-(--accent) font-bold' : 'text-(--text-muted) hover:text-(--text-primary)'}"
			>
				<div class="p-1 rounded-lg {pathname === '/operator/events' ? 'bg-(--accent-muted)' : ''}">
					<Calendar size={20} />
				</div>
				<span class="text-[10px]">Eventos</span>
			</a>

			<a
				href="/family"
				class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all {pathname.startsWith( '/family' ) ? 'text-(--accent) font-bold' : 'text-(--text-muted) hover:text-(--text-primary)'}"
			>
				<div class="p-1 rounded-lg {pathname.startsWith( '/family' ) ? 'bg-(--accent-muted)' : ''}">
					<Users size={20} />
				</div>
				<span class="text-[10px]">Mi Familia</span>
			</a>
		{:else}
			<!-- Member Tabs -->
			<a
				href="/family"
				class="flex flex-col items-center gap-1 py-1 px-6 rounded-xl transition-all {pathname === '/family' ? 'text-(--accent) font-bold' : 'text-(--text-muted) hover:text-(--text-primary)'}"
			>
				<div class="p-1 rounded-lg {pathname === '/family' ? 'bg-(--accent-muted)' : ''}">
					<Ticket size={20} />
				</div>
				<span class="text-[10px]">Mis Tickets</span>
			</a>

			<a
				href="/family/manage"
				class="flex flex-col items-center gap-1 py-1 px-6 rounded-xl transition-all {pathname.startsWith( '/family/manage' ) ? 'text-(--accent) font-bold' : 'text-(--text-muted) hover:text-(--text-primary)'}"
			>
				<div class="p-1 rounded-lg {pathname.startsWith( '/family/manage' ) ? 'bg-(--accent-muted)' : ''}">
					<Users size={20} />
				</div>
				<span class="text-[10px]">Miembros</span>
			</a>
		{/if}
	</div>
</nav>
