<script lang="ts">
	import { formatDate, isEventExpired }             from '$lib/utils/date.js';
	import StatusBadge                                from '$lib/components/ui/StatusBadge.svelte';
	import { Calendar, Users, QrCode, ArrowRight }    from '@lucide/svelte';

	interface Props {
		data : {
			events : any[];
			error? : string;
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Eventos — Portal Operador</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="space-y-1 relative z-10">
			<div class="flex items-center gap-2">
				<span class="p-1 rounded-lg bg-(--accent-muted) text-(--accent)">
					<Calendar size={18} />
				</span>
				<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
					Eventos Disponibles
				</h1>
			</div>
			<p class="text-xs text-(--text-secondary)">
				Listado de eventos activos para control de asistencia y raciones
			</p>
		</div>
	</div>

	{#if data.error}
		<div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
			{data.error}
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each data.events as ev}
			{@const expired = isEventExpired( ev.expires_at )}
			<div class="card p-5 space-y-4">
				<div class="flex items-start justify-between gap-2">
					<div class="space-y-1">
						<h3 class="font-extrabold text-lg text-(--text-primary)">
							{ev.event_name}
						</h3>
						<p class="text-xs text-(--text-secondary)">
							Fecha Evento: <span class="font-semibold text-(--text-primary)">{formatDate( ev.event_date )}</span>
						</p>
					</div>

					<StatusBadge status={ev.status} />
				</div>

				<div class="bg-(--bg-surface-2) rounded-xl p-3 space-y-1 text-xs text-(--text-muted)">
					<div class="flex justify-between">
						<span>Diferenciación Primaria:</span>
						<span class="font-semibold text-(--text-primary)">{ev.detect_by_minors ? 'Sí (Niños)' : 'No'}</span>
					</div>
					{#if ev.expires_at}
						<div class="flex justify-between">
							<span>Expira:</span>
							<span class="font-semibold {expired ? 'text-red-500' : 'text-(--text-primary)'}">{ev.expires_at}</span>
						</div>
					{/if}
				</div>

				<div class="pt-2 border-t border-(--border) flex items-center justify-end">
					<a
						href="/operator/scan"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-(--accent-muted) text-(--accent) hover:bg-(--accent)/20 border border-(--accent)/30 transition-all"
					>
						<QrCode size={14} />
						<span>Escanear para este Evento</span>
					</a>
				</div>
			</div>
		{:else}
			<div class="col-span-full card p-12 text-center text-(--text-muted) space-y-2">
				<Calendar size={36} class="mx-auto opacity-30" />
				<p class="text-sm font-semibold text-(--text-primary)">No hay eventos activos registrados</p>
			</div>
		{/each}
	</div>
</div>
