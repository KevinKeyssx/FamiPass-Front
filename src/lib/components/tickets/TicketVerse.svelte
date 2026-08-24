<script lang="ts">
	import { onMount, onDestroy }     from 'svelte';
	import QRCodeStyling             from 'qr-code-styling';
	import { theme }                 from '$lib/stores/theme.svelte.js';
	import type { FamilyEvent, Order } from '$lib/types/index.js';
	import { Crown, User as UserIcon, Users, ShoppingBasket } from '@lucide/svelte';

	interface Props {
		familyEvent : FamilyEvent & { orders? : Order[] };
		order?      : Order | null;
		isExpired?  : boolean;
	}

	let { familyEvent, order = null, isExpired = false }: Props = $props();

	let qrContainer = $state<HTMLDivElement | null>( null );
	let qrInstance  : QRCodeStyling | null = null;

	const ordersTaken = $derived( familyEvent.orders?.length ?? 0 );
	const maxOrders   = $derived( familyEvent.family?.members?.length ?? 0 );

	const qrUrl = $derived( familyEvent.qr_code_hash || null );

	const accentColor = $derived( theme.isDark ? '#f59e0b' : '#00b4d8' );

	const statusColor = $derived(
		order
			? order.status === 'COMPLETED'
				? '#10B981'
				: order.status === 'PENDING'
					? '#F59E0B'
					: '#EF4444'
			: 'var(--accent)'
	);

	const members = $derived( () => {
		if ( order?.family_members && order.family_members.length > 0 ) {
			return order.family_members;
		}
		return familyEvent.family?.members?.map( ( m ) => ( {
			rut               : m.rut,
			full_name         : m.full_name,
			organization      : m.organization,
			is_representative : m.is_representative
		} ) ) ?? [];
	} );

	const representativeName = $derived(
		members().find( ( m ) => m.is_representative )?.full_name || 'No asignado'
	);

	function formatDate( d : string ): string {
		if ( !d ) return '—';
		return new Date( d ).toLocaleDateString( 'es-CL', {
			day   : 'numeric',
			month : 'short',
			year  : 'numeric'
		} );
	}

	function buildQR(): void {
		if ( !qrUrl || !qrContainer ) return;

		qrContainer.innerHTML = '';

		qrInstance = new QRCodeStyling( {
			width                : 100,
			height               : 100,
			type                 : 'svg',
			data                 : qrUrl,
			dotsOptions          : { color : accentColor, type : 'rounded' },
			cornersSquareOptions : { type : 'extra-rounded', color : accentColor },
			cornersDotOptions    : { type : 'dot', color : accentColor },
			backgroundOptions    : { color : 'transparent' },
			imageOptions         : { hideBackgroundDots : true, imageSize : 0.3, margin : 4 },
			qrOptions            : { errorCorrectionLevel : 'M' }
		} );

		qrInstance.append( qrContainer );
	}

	onMount( () => {
		buildQR();
	} );

	onDestroy( () => {
		qrInstance = null;
	} );

	$effect( () => {
		const _dep1 = accentColor;
		const _dep2 = qrUrl;
		buildQR();
	} );
</script>

<div class="ticket-wrapper">
	<div class="ticket">
		<div class="t-main">
			<div class="t-content">
				<div class="t-header">
					<div class="t-logo">
						<svg viewBox="0 0 24 24" class="w-5 h-5">
							<path
								d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							></path>
						</svg>
						FamiPass
					</div>
					<div class="flex items-center gap-2 shrink-0">
						<div class="t-type" style="color: {statusColor}; border-color: {statusColor}">
							{order ? ( order.status === 'COMPLETED' ? 'Reclamado' : order.status === 'PENDING' ? 'Pendiente' : 'Cancelado' ) : 'Sin Orden'}
						</div>
					</div>
				</div>

				<div class="t-title truncate" title={familyEvent.family?.family_name}>
					{familyEvent.family?.family_name ?? 'FAMILIA'}
				</div>
				<div class="t-subtitle truncate" title={familyEvent.event?.event_name}>
					{familyEvent.event?.event_name ?? 'Evento FamiPass'}
				</div>

				<div class="t-details">
					<div class="t-detail-item">
						<span class="t-label">Representante</span>
						<span class="t-value truncate" style="max-width: 120px;" title={representativeName}>
							{representativeName}
						</span>
					</div>
					<div class="t-detail-item">
						<span class="t-label">Fecha</span>
						<span class="t-value">
							{formatDate( familyEvent.event?.event_date || familyEvent.created_at || '' )}
						</span>
					</div>
					<div class="t-detail-item">
						<span class="t-label">Estado</span>
						<span class="t-value" style="color: {statusColor}">
							{order ? ( order.status === 'COMPLETED' ? 'Reclamado' : order.status === 'PENDING' ? 'Pendiente' : 'Cancelado' ) : 'Disponible'}
						</span>
					</div>
					<div class="t-detail-item">
						<span class="t-label">Miembros</span>
						<span class="t-value">
							{members().length}
						</span>
					</div>
				</div>

				<!-- Lists: Members & Claimed Products -->
				<div class="t-lists-section mt-4 pt-3 border-t border-white/10 space-y-4">
					{#if members().length > 0}
						<div class="space-y-1.5">
							<div class="flex items-center gap-1.5">
								<Users size={ 13 } class="text-(--accent)" />
								<span class="text-[10px] font-black uppercase tracking-wider text-slate-200">Miembros de la Familia</span>
							</div>
							<ul class="space-y-1 max-h-24 overflow-y-auto pr-1">
								{#each members() as member}
									<li class="flex items-center justify-between text-xs text-white/95 py-0.5">
										<div class="flex items-center gap-1.5 truncate">
											{#if member.is_representative}
												<Crown size={ 11 } class="text-amber-400 shrink-0" />
											{:else}
												<UserIcon size={ 11 } class="text-white/40 shrink-0" />
											{/if}
											<span class="truncate font-medium" title={ member.full_name }>
												{ member.full_name }
											</span>
										</div>
										<span class="text-[10px] text-white/40 uppercase font-mono ml-2 shrink-0">
											{ member.organization }
										</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if order?.items && order.items.length > 0}
						<div class="space-y-1.5">
							<div class="flex items-center gap-1.5">
								<ShoppingBasket size={ 13 } class="text-(--accent)" />
								<span class="text-[10px] font-black uppercase tracking-wider text-slate-200">Productos Reclamados</span>
							</div>
							<ul class="space-y-1 max-h-24 overflow-y-auto pr-1">
								{#each order.items as item}
									<li class="flex justify-between text-xs text-white/95">
										<span class="truncate" title={ item.product?.name ?? item.product_id }>
											{ item.product?.name ?? item.product_id }
											{#if item.is_minor_portion}
												<span class="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 ml-1">Niño</span>
											{/if}
										</span>
										<span class="text-white/60 ml-2 font-mono font-bold text-xs">
											×{ item.quantity_claimed }
										</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
			<div
				class="t-perforation"
				style="position:absolute; bottom:0; left:0; width:100%; transform:translateY(50%);"
			>
				<div class="t-perf-line"></div>
			</div>
		</div>

		{#if qrUrl}
			<div class="t-stub">
				<div class="t-qr-container">
					<div bind:this={ qrContainer } class="t-qr-code"></div>
					<div class="t-qr-id font-mono font-black text-sm uppercase tracking-wider text-(--accent)">
						CÓD: { familyEvent.short_code || familyEvent.qr_code_hash }
					</div>
				</div>
				<div class="t-admit">
					<div class="t-admit-text">Órdenes</div>
					<div class="t-admit-num">
						{ ordersTaken }/{ maxOrders }
					</div>
					<span class="text-xs font-semibold text-white/90 block mt-1.5">Muestra este QR al Operador</span>
				</div>
			</div>
		{:else}
			<div class="t-stub">
				<div class="t-qr-container">
					<div class="t-qr-code border border-dashed border-white/20 rounded-lg flex items-center justify-center">
						<span class="text-[9px] text-white/30 text-center px-1">Sin QR</span>
					</div>
				</div>
				<div class="t-admit">
					<div class="t-admit-text">Órdenes</div>
					<div class="t-admit-num">
						{ordersTaken}/{maxOrders}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.ticket-wrapper {
		--t-bg         : #141f2d;
		--t-bg-light   : #1d2d42;
		--t-accent     : var( --accent );
		--t-accent-glow: rgba( 0, 180, 216, 0.35 );
		--t-text-main  : #f8fafc;
		--t-text-muted : #94a3b8;
		font-size      : 11px;
		perspective    : 1000px;
		display        : block;
		width          : 100%;
		max-width      : 360px;
	}

	.ticket {
		position        : relative;
		width           : 100%;
		color           : var( --t-text-main );
		font-family     : 'Inter', system-ui, sans-serif;
		transform-style : preserve-3d;
		transition      : transform 0.35s cubic-bezier( 0.34, 1.56, 0.64, 1 ), box-shadow 0.35s ease, filter 0.35s ease;
		box-shadow      : 0 15px 35px rgba( 0, 0, 0, 0.5 ), 0 0 0 1px rgba( 255, 255, 255, 0.08 );
		border-radius   : 1rem;
		overflow        : hidden;
		filter          : drop-shadow( 0px 8px 16px rgba( 0, 0, 0, 0.35 ) );
		cursor          : pointer;
	}

	.ticket-wrapper:hover .ticket {
		transform  : translateY( -5px ) scale( 1.025 );
		box-shadow : 0 25px 50px rgba( 0, 0, 0, 0.65 ), 0 0 25px var( --t-accent-glow ), 0 0 0 1px rgba( 255, 255, 255, 0.15 );
		filter     : drop-shadow( 0px 15px 25px rgba( 0, 0, 0, 0.5 ) );
	}

	.t-main {
		padding                 : 1.25em 1.5em;
		position                : relative;
		overflow                : hidden;
		background              : radial-gradient( circle at bottom left, transparent 1em, var( --t-bg ) 1.05em ),
		                          radial-gradient( circle at bottom right, transparent 1em, var( --t-bg ) 1.05em );
		background-size         : 51% 100%;
		background-position     : bottom left, bottom right;
		background-repeat       : no-repeat;
		border-top-left-radius  : 1em;
		border-top-right-radius : 1em;
	}

	.t-main::after {
		content          : '';
		position         : absolute;
		top              : 0;
		left             : 0;
		right            : 0;
		bottom           : 0;
		background-image : linear-gradient( rgba( 0, 180, 216, 0.1 ) 1px, transparent 1px ),
		                   linear-gradient( 90deg, rgba( 0, 180, 216, 0.1 ) 1px, transparent 1px );
		background-size  : 2em 2em;
		opacity          : 0.5;
		z-index          : 0;
		pointer-events   : none;
	}

	.t-content {
		position : relative;
		z-index  : 1;
	}

	.t-header {
		display         : flex;
		justify-content : space-between;
		align-items     : flex-start;
		margin-bottom   : 1em;
	}

	.t-logo {
		display        : flex;
		align-items    : center;
		gap            : 0.5em;
		font-weight    : 900;
		font-size      : 1.2em;
		letter-spacing : -0.03em;
		color          : #fff;
	}

	.t-type {
		font-size      : 0.8em;
		text-transform : uppercase;
		letter-spacing : 0.1em;
		border         : 1px solid;
		padding        : 0.25em 0.75em;
		border-radius  : 99em;
		font-weight    : 700;
	}

	.t-title {
		font-size               : 2em;
		font-weight             : 900;
		line-height             : 1.1;
		margin-bottom           : 0.2em;
		text-transform          : uppercase;
		background              : linear-gradient( 135deg, #fff 0%, #a5b4fc 100% );
		-webkit-background-clip : text;
		background-clip         : text;
		-webkit-text-fill-color : transparent;
	}

	.t-subtitle {
		color         : var( --t-text-muted );
		font-size     : 0.9em;
		margin-bottom : 1.15em;
	}

	.t-details {
		display               : grid;
		grid-template-columns : 1fr 1fr;
		gap                   : 1em;
	}

	.t-detail-item {
		display        : flex;
		flex-direction : column;
		gap            : 0.2em;
	}

	.t-label {
		font-size      : 0.8em;
		text-transform : uppercase;
		letter-spacing : 0.08em;
		color          : var( --t-text-muted );
		font-weight    : 600;
	}

	.t-value {
		font-size   : 1.1em;
		font-weight : 700;
		color       : var( --t-text-main );
	}

	.t-perforation {
		display         : flex;
		justify-content : space-between;
		height          : 1em;
		align-items     : center;
		position        : relative;
		z-index         : 2;
	}

	.t-perf-line {
		flex-grow  : 1;
		height     : 0;
		border-top : 2px dashed rgba( 255, 255, 255, 0.25 );
		margin     : 0 1.5em;
	}

	.t-stub {
		padding                    : 1.25em 1.5em;
		background                 : radial-gradient( circle at top left, transparent 1em, var( --t-bg-light ) 1.05em ),
		                             radial-gradient( circle at top right, transparent 1em, var( --t-bg-light ) 1.05em );
		background-size            : 51% 100%;
		background-position        : top left, top right;
		background-repeat          : no-repeat;
		border-bottom-left-radius  : 1em;
		border-bottom-right-radius : 1em;
		display                    : flex;
		justify-content            : space-between;
		align-items                : center;
		position                   : relative;
	}

	.t-qr-container {
		display        : flex;
		flex-direction : column;
		gap            : 0.5em;
		align-items    : center;
	}

	.t-qr-code {
		width           : 100px;
		height          : 100px;
		background      : rgba( 255, 255, 255, 0.05 );
		border-radius   : 12px;
		display         : flex;
		align-items     : center;
		justify-content : center;
		padding         : 4px;
	}

	.t-qr-id {
		font-family    : monospace;
		font-size      : 0.9em;
		font-weight    : 800;
		color          : var( --accent );
		letter-spacing : 0.08em;
		text-align     : center;
		max-width      : 140px;
		word-break     : break-all;
	}

	.t-admit {
		text-align : right;
	}

	.t-admit-text {
		font-size      : 0.85em;
		text-transform : uppercase;
		letter-spacing : 0.1em;
		color          : var( --t-text-muted );
	}

	.t-admit-num {
		font-size   : 2.5em;
		font-weight : 900;
		line-height : 1;
		color       : var( --accent );
		text-shadow : 0 0 15px var( --shadow-glow );
	}
</style>
