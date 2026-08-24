<script lang="ts">
	import { formatDateTime }                         from '$lib/utils/date.js';
	import StatusBadge                                from '$lib/components/ui/StatusBadge.svelte';
	import { ClipboardList, ShoppingBasket, ExternalLink } from '@lucide/svelte';

	interface Props {
		data : {
			orders : any[];
			error? : string;
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Órdenes Recientes — Portal Operador</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="space-y-1 relative z-10">
			<div class="flex items-center gap-2">
				<span class="p-1 rounded-lg bg-(--accent-muted) text-(--accent)">
					<ClipboardList size={18} />
				</span>
				<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
					Órdenes Registradas
				</h1>
			</div>
			<p class="text-xs text-(--text-secondary)">
				Historial general de entregas de raciones en eventos
			</p>
		</div>
	</div>

	{#if data.error}
		<div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
			{data.error}
		</div>
	{/if}

	{#if data.orders.length === 0}
		<div class="card p-12 text-center text-(--text-muted) space-y-3">
			<ShoppingBasket size={40} class="mx-auto opacity-30" />
			<p class="text-sm font-semibold text-(--text-primary)">No hay órdenes registradas aún</p>
			<p class="text-xs max-w-xs mx-auto">Utiliza el escáner QR para registrar la primera entrega a una familia.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each data.orders as o}
				<div class="card p-5 space-y-3">
					<div class="flex items-start justify-between gap-2">
						<div class="space-y-0.5">
							<span class="text-[10px] font-mono font-bold text-(--text-muted) uppercase">
								Orden #{o.id.slice( 0, 8 )}
							</span>
							<h3 class="font-extrabold text-base text-(--text-primary)">
								Familia {o.family_event?.family?.family_name || 'Desconocida'}
							</h3>
							<p class="text-xs text-(--text-secondary)">
								Evento: {o.event?.event_name || 'Evento'}
							</p>
						</div>

						<StatusBadge status={o.status} />
					</div>

					<!-- Items snapshot -->
					<div class="bg-(--bg-surface-2) rounded-xl p-3 space-y-1.5 text-xs">
						{#each o.items || [] as item}
							<div class="flex justify-between items-center text-text-primary">
								<span>{item.product?.name ?? item.product_id}</span>
								<span class="font-mono font-bold">×{item.quantity_claimed}</span>
							</div>
						{/each}
					</div>

					<div class="pt-2 border-t border-(--border) flex items-center justify-between text-[11px] text-(--text-muted)">
						<span>{formatDateTime( o.created_at )}</span>
						{#if o.event_id && o.family_event_id}
							<a
								href="/operator/orders/{o.event_id}/{o.family_event_id}"
								class="inline-flex items-center gap-1 font-bold text-(--accent) hover:underline"
							>
								<span>Ver Detalles</span>
								<ExternalLink size={12} />
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
