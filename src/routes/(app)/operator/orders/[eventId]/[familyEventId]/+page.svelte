<script lang="ts">
	import { deserialize }                                                                      from '$app/forms';
	import { invalidateAll }                                                                    from '$app/navigation';
	import { Trash2, Users, ShoppingBasket, Plus, Check, X, Clock, CheckCircle2 }                from '@lucide/svelte';
	import { isEventExpired, formatDateTime }                                                   from '$lib/utils/date.js';
	import Button                                                                               from '$lib/components/ui/Button.svelte';
	import Modal                                                                                from '$lib/components/ui/Modal.svelte';
	import InputNumber                                                                          from '$lib/components/ui/InputNumber.svelte';
	import ButtonBack                                                                           from '$lib/components/ui/ButtonBack.svelte';

	interface Props {
		data : {
			event         : any;
			familyEvent   : any;
			orders        : any[];
			eventProducts : any[];
			isSuperAdmin  : boolean;
		};
	}

	let { data }: Props = $props();

	let isSubmitting    = $state( false );
	let submitError     = $state<string | null>( null );
	let deleteModalOpen = $state( false );
	let orderToDelete   = $state<string | null>( null );
	let isDeleting      = $state( false );
	let deleteError     = $state<string | null>( null );
	let formValues      = $state<Record<string, number>>( {} );

	const isExpired = $derived( data.event.expires_at ? isEventExpired( data.event.expires_at ) : false );

	$effect( () => {
		for ( const ep of data.eventProducts ) {
			const keyAdult = `qty_adult_${ ep.product_id }`;
			if ( formValues[ keyAdult ] === undefined ) {
				formValues[ keyAdult ] = 0;
			}
			const keyChild = `qty_child_${ ep.product_id }`;
			if ( formValues[ keyChild ] === undefined ) {
				formValues[ keyChild ] = 0;
			}
		}
	} );

	const members           = $derived( data.familyEvent.family?.members || [] );
	const totalMembersCount = $derived( members.length );

	const adultsCount = $derived(
		data.event.detect_by_minors
			? members.filter( ( m : any ) => m.organization !== 'PRIMARIA' ).length
			: totalMembersCount
	);

	const childrenCount = $derived(
		data.event.detect_by_minors
			? members.filter( ( m : any ) => m.organization === 'PRIMARIA' ).length
			: 0
	);

	const activeOrders = $derived( data.orders.filter( ( o ) => o.status !== 'CANCELLED' ) );

	const claimedAdult = $derived.by( () => {
		const claimed : Record<string, number> = {};
		for ( const o of activeOrders ) {
			for ( const item of o.items || [] ) {
				if ( !item.is_minor_portion ) {
					claimed[ item.product_id ] = ( claimed[ item.product_id ] || 0 ) + item.quantity_claimed;
				}
			}
		}
		return claimed;
	} );

	const claimedChild = $derived.by( () => {
		const claimed : Record<string, number> = {};
		for ( const o of activeOrders ) {
			for ( const item of o.items || [] ) {
				if ( item.is_minor_portion ) {
					claimed[ item.product_id ] = ( claimed[ item.product_id ] || 0 ) + item.quantity_claimed;
				}
			}
		}
		return claimed;
	} );

	const isAllClaimed = $derived.by( () => {
		if ( !data.eventProducts || data.eventProducts.length === 0 ) return false;
		return data.eventProducts.every( ( ep : any ) => {
			const maxA = adultsCount * ep.quantity;
			const maxC = childrenCount * ep.quantity;
			const remA = Math.max( 0, maxA - ( claimedAdult[ ep.product_id ] || 0 ) );
			const remC = Math.max( 0, maxC - ( claimedChild[ ep.product_id ] || 0 ) );
			return remA === 0 && remC === 0;
		} );
	} );

	const totalRationsQuota = $derived.by( () => {
		let total = 0;
		for ( const ep of data.eventProducts ) {
			total += ( adultsCount * ep.quantity ) + ( childrenCount * ep.quantity );
		}
		return total;
	} );

	const totalRationsClaimed = $derived.by( () => {
		let total = 0;
		for ( const ep of data.eventProducts ) {
			total += ( claimedAdult[ ep.product_id ] || 0 ) + ( claimedChild[ ep.product_id ] || 0 );
		}
		return total;
	} );

	const totalRationsRemaining = $derived( Math.max( 0, totalRationsQuota - totalRationsClaimed ) );

	function translateStatus( status : string ): string {
		const mapping : Record<string, string> = {
			AVAILABLE    : 'Disponible',
			OUT_OF_STOCK : 'Agotado',
			PAUSED       : 'Pausado',
			DISCONTINUED : 'Descontinuado'
		};
		return mapping[ status ] || status;
	}

	async function changeStatus( orderId : string, status : string ): Promise<void> {
		const formData = new FormData();
		formData.append( 'orderId', orderId );
		formData.append( 'status', status );

		try {
			const response = await fetch( '?/updateStatus', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidateAll();
			} else {
				alert( ( result as any ).data?.error || 'Error al cambiar estado' );
			}
		} catch ( err : any ) {
			alert( err.message );
		}
	}

	function openDeleteModal( orderId : string ): void {
		orderToDelete   = orderId;
		deleteError     = null;
		deleteModalOpen = true;
	}

	async function confirmDeleteOrder(): Promise<void> {
		if ( !orderToDelete ) return;

		isDeleting  = true;
		deleteError = null;

		const formData = new FormData();
		formData.append( 'orderId', orderToDelete );

		try {
			const response = await fetch( '?/deleteOrder', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidateAll();
				deleteModalOpen = false;
				orderToDelete   = null;
			} else {
				deleteError = ( result as any ).data?.error || 'Error al eliminar la orden';
			}
		} catch ( err : any ) {
			deleteError = err.message;
		} finally {
			isDeleting = false;
		}
	}

	async function createManualOrder( e : SubmitEvent ): Promise<void> {
		e.preventDefault();
		isSubmitting = true;
		submitError  = null;

		const form     = e.currentTarget as HTMLFormElement;
		const formData = new FormData( form );

		try {
			const response = await fetch( '?/createOrder', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				form.reset();
				for ( const key of Object.keys( formValues ) ) {
					formValues[ key ] = 0;
				}
				await invalidateAll();
			} else {
				submitError = ( result as any ).data?.error || 'Error al crear la orden';
			}
		} catch ( err : any ) {
			submitError = err.message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Entrega de Órdenes — {data.familyEvent.family?.family_name || 'Familia'}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3.5 relative z-10">
			<ButtonBack href="/operator/scan" label="Escáner" />

			<div class="space-y-0.5">
				<div class="flex items-center gap-2.5 flex-wrap">
					<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
						Entrega de Raciones
					</h1>
					{#if isAllClaimed}
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)] select-none">
							<CheckCircle2 size={ 14 } strokeWidth={ 2.5 } />
							<span>Todo Cobrado</span>
						</span>
					{/if}
				</div>
				<p class="text-xs text-(--text-secondary)">
					Familia <span class="font-bold text-(--text-primary)">{ data.familyEvent.family?.family_name }</span> · Evento: { data.event.event_name }
				</p>
			</div>
		</div>
	</div>

	{#if isExpired}
		<div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
			<span>⚠️</span>
			<div>
				<p class="font-bold">Este evento ha expirado ({data.event.expires_at}).</p>
				<p class="text-xs">No se pueden crear ni modificar órdenes para este evento.</p>
			</div>
		</div>
	{/if}

	<!-- Info Summary Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="card p-5 space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
				<Users size={14} class="text-(--accent)" />
				<span>Familia</span>
			</h2>
			<p class="font-bold text-sm text-(--text-primary)">{data.familyEvent.family?.family_name}</p>
			<p class="text-xs text-(--text-secondary)">
				{totalMembersCount} miembros ({adultsCount} Adultos / {childrenCount} Niños)
			</p>
		</div>

		<div class="card p-5 space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
				<ShoppingBasket size={14} class="text-(--accent)" />
				<span>Evento</span>
			</h2>
			<p class="font-bold text-sm text-(--text-primary)">{data.event.event_name}</p>
			<p class="text-xs text-(--text-secondary)">
				{data.event.detect_by_minors ? 'Diferenciación Primaria (Niños)' : 'Raciones Generales'}
			</p>
		</div>

		<div class="card p-5 space-y-2">
			<div class="flex items-center justify-between gap-1.5">
				<h2 class="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
					<Clock size={ 14 } class="text-(--accent)" />
					<span>Raciones Restantes</span>
				</h2>
				{#if totalRationsRemaining === 0}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
						Todo Cobrado
					</span>
				{/if}
			</div>
			<p class="font-black text-xl { totalRationsRemaining === 0 ? 'text-emerald-400' : 'text-(--accent)' }">
				{ totalRationsRemaining } { totalRationsRemaining === 1 ? 'ración pendiente' : 'raciones pendientes' }
			</p>
			<p class="text-xs text-(--text-secondary)">
				{ totalRationsClaimed } de { totalRationsQuota } cobradas · { activeOrders.length } { activeOrders.length === 1 ? 'orden activa' : 'órdenes activas' }
			</p>
		</div>
	</div>

	<!-- Form and Orders Section -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
		<!-- New Order Form -->
		<div class="card p-6 space-y-6">
			<div class="border-b border-(--border) pb-4 flex items-center justify-between">
				<div>
					<h2 class="text-lg font-bold text-(--text-primary)">Registrar Nueva Entrega</h2>
					<p class="text-xs text-(--text-muted) mt-0.5">Ingresa las raciones que se están entregando en este momento.</p>
				</div>
				{#if isAllClaimed}
					<span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
						Cobro Finalizado
					</span>
				{/if}
			</div>

			<form onsubmit={ createManualOrder } class="space-y-6">
				<div class="space-y-4 divide-y divide-(--border)">
					{#each data.eventProducts as ep}
						{@const isAvailable = ep.status === 'AVAILABLE'}
						{@const maxAdultQuota = adultsCount * ep.quantity}
						{@const maxChildQuota = childrenCount * ep.quantity}
						{@const curClaimedAdult = claimedAdult[ ep.product_id ] || 0}
						{@const curClaimedChild = claimedChild[ ep.product_id ] || 0}
						{@const remAdult = maxAdultQuota - curClaimedAdult}
						{@const remChild = maxChildQuota - curClaimedChild}
						{@const isItemFullyClaimed = remAdult <= 0 && remChild <= 0}

						<div class="pt-4 first:pt-0 space-y-3">
							<div class="flex items-start justify-between gap-2">
								<div>
									<h3 class="font-bold text-sm text-(--text-primary)">{ ep.product?.name }</h3>
									{#if ep.product?.description}
										<p class="text-xs text-(--text-muted) mt-0.5">{ ep.product.description }</p>
									{/if}
								</div>
								{#if !isAvailable}
									<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/20 text-red-400 border border-red-400/30">
										{ translateStatus( ep.status ) }
									</span>
								{:else if isItemFullyClaimed}
									<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-400 border border-emerald-400/30">
										Cobrado Completo
									</span>
								{:else}
									<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-400/20 text-green-400 border border-green-400/30">
										Disponible
									</span>
								{/if}
							</div>

							<!-- Inputs Container -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<!-- Adult portions -->
								<div class="space-y-1.5">
									<label for="qty_adult_{ ep.product_id }" class="text-xs text-(--text-muted) font-medium block">
										{ data.event.detect_by_minors ? 'Adulto' : 'Raciones' } (Disponibles: { remAdult })
									</label>
									<InputNumber
										id="qty_adult_{ ep.product_id }"
										name="qty_adult_{ ep.product_id }"
										min={ 0 }
										max={ remAdult }
										disabled={ !isAvailable || remAdult <= 0 || isExpired }
										bind:value={ formValues[ `qty_adult_${ ep.product_id }` ] }
									/>
									<span class="text-[10px] text-(--text-muted) block">
										Reclamados: { curClaimedAdult } de { maxAdultQuota }
									</span>
								</div>

								<!-- Child portions -->
								{#if data.event.detect_by_minors}
									<div class="space-y-1.5">
										<label for="qty_child_{ ep.product_id }" class="text-xs text-(--text-muted) font-medium block">
											Niño (Disponibles: { remChild })
										</label>
										<InputNumber
											id="qty_child_{ ep.product_id }"
											name="qty_child_{ ep.product_id }"
											min={ 0 }
											max={ remChild }
											disabled={ !isAvailable || remChild <= 0 || isExpired }
											bind:value={ formValues[ `qty_child_${ ep.product_id }` ] }
										/>
										<span class="text-[10px] text-(--text-muted) block">
											Reclamados: { curClaimedChild } de { maxChildQuota }
										</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if submitError}
					<p class="text-xs text-red-500 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/30">
						{ submitError }
					</p>
				{/if}

				<Button
					type="submit"
					variant="primary"
					size="lg"
					class="w-full"
					loading={ isSubmitting }
					disabled={ isExpired || isAllClaimed }
				>
					{#if isAllClaimed}
						<CheckCircle2 size={ 18 } />
						<span>Todas las Raciones Cobradas</span>
					{:else}
						<Plus size={ 18 } />
						<span>Registrar Orden</span>
					{/if}
				</Button>
			</form>
		</div>

		<!-- Order History -->
		<div class="space-y-4">
			<div class="card p-6">
				<h2 class="text-lg font-bold text-(--text-primary)">Historial de Entregas</h2>
				<p class="text-xs text-(--text-muted)">Registro de raciones entregadas a esta familia.</p>
			</div>

			{#each data.orders as o}
				<div class="card p-5 space-y-3 border-l-4 {o.status === 'COMPLETED' ? 'border-l-green-500' : o.status === 'PENDING' ? 'border-l-amber-500' : 'border-l-red-500'}">
					<div class="flex items-start justify-between gap-2">
						<div>
							<p class="text-[10px] font-mono text-(--text-muted) uppercase font-bold">Orden #{o.id.slice( 0, 8 )}</p>
							<p class="text-xs text-(--text-secondary) mt-0.5">{formatDateTime( o.created_at )}</p>
							<p class="text-[11px] text-(--text-muted) mt-1">
								Operador: <span class="font-semibold text-(--text-primary)">{o.scanned_by_user?.user_name ?? 'Operador'}</span>
							</p>
						</div>

						<div class="flex items-center gap-1.5">
							{#if o.status !== 'COMPLETED' && !isExpired}
								<button
									type="button"
									onclick={() => changeStatus( o.id, 'COMPLETED' )}
									class="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors cursor-pointer"
									title="Completar"
								>
									<Check size={16} />
								</button>
							{/if}

							{#if o.status !== 'PENDING' && !isExpired}
								<button
									type="button"
									onclick={() => changeStatus( o.id, 'PENDING' )}
									class="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
									title="Marcar Pendiente"
								>
									<Clock size={16} />
								</button>
							{/if}

							{#if o.status !== 'CANCELLED' && !isExpired}
								<button
									type="button"
									onclick={() => changeStatus( o.id, 'CANCELLED' )}
									class="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
									title="Cancelar Orden"
								>
									<X size={16} />
								</button>
							{/if}

							{#if data.isSuperAdmin && !isExpired}
								<button
									type="button"
									onclick={() => openDeleteModal( o.id )}
									class="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors ml-1 cursor-pointer"
									title="Eliminar Orden"
								>
									<Trash2 size={16} />
								</button>
							{/if}
						</div>
					</div>

					<!-- Items List -->
					<div class="bg-(--bg-surface-2) rounded-xl p-3">
						<ul class="divide-y divide-(--border) space-y-1.5 first:space-y-0">
							{#each o.items || [] as item}
								<li class="flex justify-between items-center text-xs pt-1.5 first:pt-0">
									<div>
										<span class="font-semibold text-(--text-primary)">{item.product?.name ?? 'Producto'}</span>
										{#if item.is_minor_portion}
											<span class="ml-1.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase">
												Niño
											</span>
										{/if}
									</div>
									<span class="font-mono font-bold text-xs text-(--text-primary)">
										×{item.quantity_claimed}
									</span>
								</li>
							{:else}
								<p class="text-[11px] text-(--text-muted) text-center py-1">Sin productos asignados.</p>
							{/each}
						</ul>
					</div>
				</div>
			{:else}
				<div class="card p-8 text-center text-(--text-muted) space-y-2">
					<ShoppingBasket size={32} class="mx-auto opacity-30" />
					<p class="text-xs">No hay entregas registradas para esta familia aún.</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Modal Confirm Delete Order -->
<Modal
	open={deleteModalOpen}
	onClose={() => { deleteModalOpen = false; }}
	onConfirm={confirmDeleteOrder}
	title="Eliminar Orden"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={isDeleting}
>
	<p class="text-sm">¿Estás seguro de que deseas eliminar permanentemente esta orden?</p>
	<p class="mt-2 text-xs text-(--text-muted)">Esta acción removerá los productos reclamados de esta orden y repondrá la cuota familiar.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-xs font-semibold">
			{deleteError}
		</p>
	{/if}
</Modal>
