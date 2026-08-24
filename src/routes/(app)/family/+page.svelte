<script lang="ts">
	import { invalidateAll }                                                               from '$app/navigation';
	import { deserialize }                                                                 from '$app/forms';
	import toast                                                                           from 'svelte-french-toast';
	import TicketVerse                                                                     from '$lib/components/tickets/TicketVerse.svelte';
	import Button                                                                          from '$lib/components/ui/Button.svelte';
	import Select                                                                          from '$lib/components/ui/Select.svelte';
	import InputText                                                                       from '$lib/components/ui/InputText.svelte';
	import { isEventExpired }                                                              from '$lib/utils/date.js';
	import { Users, Plus, Link2, Ticket, Settings, CalendarPlus, Search, X, CheckCircle2 } from '@lucide/svelte';
	import type { Family, FamilyEvent, EventConfig }                                       from '$lib/types/index.js';

	interface Props {
		data : {
			family           : Family | null;
			tickets          : FamilyEvent[];
			availableEvents? : EventConfig[];
			error?           : string;
		};
	}

	let { data }: Props = $props();

	let selectedEventId = $state( '' );
	let isJoining       = $state( false );
	let searchQuery     = $state( '' );
	let statusFilter    = $state<'ACTIVE' | 'ALL'>( 'ACTIVE' );

	const eventOptions = $derived(
		( data.availableEvents || [] ).map( ( ev ) => ( {
			value : ev.id,
			label : `${ ev.event_name } (${ ev.event_date })`
		} ) )
	);

	const filteredTickets = $derived.by( () => {
		let list = data.tickets || [];

		// Filter by status (ACTIVE vs ALL)
		if ( statusFilter === 'ACTIVE' ) {
			list = list.filter( ( t ) => {
				if ( !t.event ) return true;
				if ( t.event.status === 'FINISHED' || t.event.status === 'CANCELLED' ) return false;
				if ( t.event.expires_at && isEventExpired( t.event.expires_at ) ) return false;
				return true;
			} );
		}

		// Filter by search query (Event Name, Short Code, or QR Hash)
		const query = searchQuery.trim().toLowerCase();
		if ( query ) {
			list = list.filter( ( t ) => {
				const eventName = t.event?.event_name?.toLowerCase() || '';
				const shortCode = t.short_code?.toLowerCase() || '';
				const qrHash    = t.qr_code_hash?.toLowerCase() || '';
				return eventName.includes( query ) || shortCode.includes( query ) || qrHash.includes( query );
			} );
		}

		return list;
	} );

	async function handleJoinEvent(): Promise<void> {
		if ( !selectedEventId || isJoining ) return;

		isJoining = true;
		const toastId = toast.loading( 'Inscribiendo familia al evento...' );

		const formData = new FormData();
		formData.append( 'event_id', selectedEventId );

		try {
			const res = await fetch( '?/joinEvent', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await res.text() );

			if ( result.type === 'success' ) {
				toast.success( '¡Inscripción exitosa! Tu ticket ya está disponible.', { id : toastId } );
				selectedEventId = '';
				await invalidateAll();
			} else if ( result.type === 'failure' ) {
				const errorMsg = ( result.data as any )?.error || 'No fue posible completar la inscripción.';
				toast.error( errorMsg, { id : toastId, duration : 5000 } );
			} else {
				toast.error( 'Ocurrió un error inesperado al procesar la solicitud.', { id : toastId, duration : 4000 } );
			}
		} catch ( err : any ) {
			toast.error( err.message || 'Error de conexión con el servidor.', { id : toastId, duration : 4000 } );
		} finally {
			isJoining = false;
		}
	}
</script>

<svelte:head>
	<title>Mis Tickets — FamiPass</title>
</svelte:head>

<div class="space-y-6">
	{#if !data.family}
		<!-- No Family Linked View -->
		<div class="card p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto my-6">
			<div class="w-20 h-20 rounded-3xl bg-(--accent-muted) text-(--accent) flex items-center justify-center mx-auto shadow-(--shadow-glow)">
				<Users size={40} />
			</div>

			<div class="space-y-2">
				<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
					¡Bienvenido a FamiPass!
				</h1>
				<p class="text-sm text-(--text-secondary) leading-relaxed">
					Para acceder a los tickets de eventos y canjear tus raciones, crea tu grupo familiar o vincula uno ya registrado.
				</p>
			</div>

			<div class="flex flex-col sm:flex-row gap-3 justify-center pt-2">
				<a href="/family/manage" class="w-full sm:w-auto">
					<Button variant="primary" size="lg" class="w-full">
						<Plus size={18} />
						<span>Crear Mi Familia</span>
					</Button>
				</a>

				<a href="/family/link" class="w-full sm:w-auto">
					<Button variant="secondary" size="lg" class="w-full">
						<Link2 size={18} />
						<span>Vincular por Código</span>
					</Button>
				</a>
			</div>
		</div>
	{:else}
		<!-- Family Header Banner -->
		<div class="header-banner group">
			<div class="header-glow"></div>

			<div class="relative z-10 space-y-1">
				<div class="flex items-center gap-2 flex-wrap">
					<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
						Familia {data.family.family_name}
					</h1>
					<span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-(--accent-muted) text-(--accent) border border-(--accent)/30">
						Cód: {data.family.code}
					</span>
				</div>
				<p class="text-xs text-(--text-secondary)">
					{data.family.members?.length || 0} integrantes registrados
				</p>
			</div>

			<div class="relative z-10 flex items-center gap-2">
				<a href="/family/manage">
					<Button variant="secondary" size="sm">
						<Settings size={14} />
						<span>Gestionar Miembros</span>
					</Button>
				</a>
			</div>
		</div>

		<!-- Event Registration Card -->
		<div class="card p-6 space-y-4">
			<div class="flex items-center gap-2 pb-2 border-b border-(--border)">
				<span class="p-1.5 rounded-lg bg-(--accent-muted) text-(--accent)">
					<CalendarPlus size={18} />
				</span>
				<div>
					<h2 class="text-base font-bold text-(--text-primary)">
						Inscribir Familia a un Evento
					</h2>
					<p class="text-xs text-(--text-muted)">
						Selecciona un evento disponible para obtener tu ticket interactivo y código PIN
					</p>
				</div>
			</div>

			{#if eventOptions.length === 0}
				<div class="p-4 rounded-xl bg-(--bg-surface-2) border border-(--border) text-center space-y-1">
					<p class="text-xs font-bold text-(--text-primary)">
						No hay nuevos eventos disponibles para inscripción en este momento.
					</p>
					<p class="text-[11px] text-(--text-muted)">
						Tu familia ya está inscrita en todos los eventos activos o los plazos de inscripción han finalizado.
					</p>
				</div>
			{:else}
				<form onsubmit={handleJoinEvent} class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
					<div class="md:col-span-2">
						<Select
							label="Evento Disponible"
							bind:value={selectedEventId}
							options={eventOptions}
							placeholder="Selecciona un evento para obtener tu ticket..."
							required
						/>
					</div>

					<Button
						type="submit"
						variant="primary"
						size="md"
						class="w-full h-[42px]"
						loading={ isJoining }
						disabled={ !selectedEventId || isJoining }
					>
						<Ticket size={16} />
						<span>Inscribirse y Obtener Ticket</span>
					</Button>
				</form>
			{/if}
		</div>

		<!-- Tickets Section with Search & Filter -->
		<div class="space-y-4">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<Ticket size={18} class="text-(--accent)" />
					<h2 class="text-lg font-bold text-(--text-primary)">
						Mis Tickets de Eventos
					</h2>
					<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-(--bg-surface-2) text-(--text-muted) border border-(--border)">
						{filteredTickets.length} de {data.tickets.length}
					</span>
				</div>

				<!-- Status Filter Tabs -->
				<div class="inline-flex p-1 rounded-xl bg-(--bg-surface-2) border border-(--border) self-start sm:self-auto">
					<button
						type="button"
						onclick={() => ( statusFilter = 'ACTIVE' )}
						class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer {statusFilter === 'ACTIVE' ? 'bg-(--accent) text-(--text-primary) shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary)'}"
					>
						Activos
					</button>
					<button
						type="button"
						onclick={() => ( statusFilter = 'ALL' )}
						class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer {statusFilter === 'ALL' ? 'bg-(--accent) text-(--text-primary) shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary)'}"
					>
						Todos
					</button>
				</div>
			</div>

			<!-- Search Bar -->
			{#if data.tickets.length > 0}
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-muted)">
						<Search size={15} />
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Buscar ticket por nombre de evento o código PIN (ej: ABC123)..."
						class="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-(--bg-surface-2) border border-(--border) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) focus:ring-4 focus:ring-(--accent)/10 transition-all"
					/>
					{#if searchQuery}
						<button
							type="button"
							onclick={() => ( searchQuery = '' )}
							aria-label="Limpiar búsqueda"
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
						>
							<X size={14} />
						</button>
					{/if}
				</div>
			{/if}

			{#if data.tickets.length === 0}
				<div class="card p-10 text-center space-y-3">
					<Ticket size={36} class="mx-auto text-(--text-muted) opacity-40" />
					<p class="text-sm font-semibold text-(--text-primary)">
						Aún no tienes tickets asignados
					</p>
					<p class="text-xs text-(--text-muted) max-w-sm mx-auto">
						Inscribe a tu familia en alguno de los eventos disponibles arriba para generar tu ticket interactivo con código QR.
					</p>
				</div>
			{:else if filteredTickets.length === 0}
				<div class="card p-8 text-center space-y-3">
					<Search size={30} class="mx-auto text-(--text-muted) opacity-40" />
					<p class="text-sm font-semibold text-(--text-primary)">
						No se encontraron tickets
					</p>
					<p class="text-xs text-(--text-muted) max-w-sm mx-auto">
						No hay tickets que coincidan con la búsqueda "{searchQuery}" o con el filtro seleccionado.
					</p>
					<Button variant="secondary" size="sm" onclick={() => { searchQuery = ''; statusFilter = 'ALL'; }}>
						Restablecer Filtros
					</Button>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
					{#each filteredTickets as ticket}
						{@const lastOrder = ticket.orders && ticket.orders.length > 0 ? ticket.orders[ 0 ] : null}
						<div class="w-full flex justify-center sm:justify-start">
							<TicketVerse
								familyEvent={ ticket }
								order={ lastOrder }
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
