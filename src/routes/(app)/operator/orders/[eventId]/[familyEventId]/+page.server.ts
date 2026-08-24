import { error, fail, redirect }        from '@sveltejs/kit';
import type { PageServerLoad, Actions }       from './$types.js';
import {
	getOrdersByFamilyEventId,
	updateOrderStatus,
	deleteOrder,
	createOrder,
	getEventProducts
}                                             from '$lib/server/supabase/services/orders.service.js';
import { getEventById }                       from '$lib/server/supabase/services/events.service.js';
import { isEventExpired }                     from '$lib/utils/date.js';
import { getUserRole, getUserByEmail }        from '$lib/server/supabase/services/users.service.js';
import { auth }                               from '$lib/auth/auth.js';
import type { OrderStatus, OrderItem, UserRole } from '$lib/types/index.js';

export const load: PageServerLoad = async ( event ) => {
	const session = await auth.api.getSession( { headers : event.request.headers } );

	if ( !session ) {
		throw redirect( 302, '/login' );
	}

	const role = ( ( await getUserRole( session.user.email ?? '' ) ) as UserRole ) || 'MEMBER';

	if ( ![ 'SUPER_ADMIN', 'ADMIN', 'STAFF' ].includes( role ) ) {
		throw redirect( 302, '/login?error=unauthorized' );
	}

	const { eventId, familyEventId } = event.params;

	const dbEvent = await getEventById( eventId );

	if ( !dbEvent ) {
		throw error( 404, 'Evento no encontrado' );
	}

	const familyEvent = ( dbEvent.family_events || [] ).find( ( fe : any ) => fe.id === familyEventId );

	if ( !familyEvent ) {
		throw error( 404, 'Asociación familiar no encontrada' );
	}

	try {
		const orders        = await getOrdersByFamilyEventId( familyEventId );
		const eventProducts = await getEventProducts( eventId );

		return {
			event         : dbEvent,
			familyEvent,
			orders,
			eventProducts,
			isSuperAdmin  : role === 'SUPER_ADMIN'
		};
	} catch ( err : any ) {
		return {
			event         : dbEvent,
			familyEvent,
			orders        : [],
			eventProducts : [],
			isSuperAdmin  : role === 'SUPER_ADMIN',
			error         : err.message
		};
	}
};

export const actions: Actions = {
	createOrder : async ( { request, params } ) => {
		const session = await auth.api.getSession( { headers : request.headers } );

		if ( !session ) {
			return fail( 401, { error : 'No autorizado' } );
		}

		const dbEvent = await getEventById( params.eventId );

		if ( !dbEvent ) {
			return fail( 404, { error : 'Evento no encontrado' } );
		}

		if ( dbEvent.expires_at && isEventExpired( dbEvent.expires_at ) ) {
			return fail( 400, { error : 'El evento ha expirado y no se pueden crear órdenes.' } );
		}

		const familyEvent = ( dbEvent.family_events || [] ).find( ( fe : any ) => fe.id === params.familyEventId );

		if ( !familyEvent ) {
			return fail( 404, { error : 'Asociación familiar no encontrada' } );
		}

		const formData = await request.formData();

		// Parse quantities from form data
		const itemsToCreate : Array<Omit<OrderItem, 'id' | 'order_id'>> = [];
		const eventProducts = await getEventProducts( params.eventId );

		// Load existing orders to calculate remaining quota
		const orders = await getOrdersByFamilyEventId( params.familyEventId );
		const activeOrders = orders.filter( ( o ) => o.status !== 'CANCELLED' );

		const members = familyEvent.family?.members || [];
		const totalMembersCount = members.length;

		const adultsCount = dbEvent.detect_by_minors
			? members.filter( ( m : any ) => m.organization !== 'PRIMARIA' ).length
			: totalMembersCount;

		const childrenCount = dbEvent.detect_by_minors
			? members.filter( ( m : any ) => m.organization === 'PRIMARIA' ).length
			: 0;

		// Group claimed items
		const claimedAdult : Record<string, number> = {};
		const claimedChild : Record<string, number> = {};

		for ( const o of activeOrders ) {
			for ( const item of o.items || [] ) {
				if ( item.is_minor_portion ) {
					claimedChild[ item.product_id ] = ( claimedChild[ item.product_id ] || 0 ) + item.quantity_claimed;
				} else {
					claimedAdult[ item.product_id ] = ( claimedAdult[ item.product_id ] || 0 ) + item.quantity_claimed;
				}
			}
		}

		for ( const ep of eventProducts ) {
			if ( [ 'OUT_OF_STOCK', 'PAUSED', 'DISCONTINUED' ].includes( ep.status ) ) {
				continue;
			}

			const qtyAdultRaw = formData.get( `qty_adult_${ ep.product_id }` );
			const qtyAdult    = qtyAdultRaw ? Number( qtyAdultRaw ) : 0;

			const qtyChildRaw = formData.get( `qty_child_${ ep.product_id }` );
			const qtyChild    = qtyChildRaw ? Number( qtyChildRaw ) : 0;

			const maxAdult = adultsCount * ep.quantity;
			const maxChild = childrenCount * ep.quantity;

			const currentClaimedAdult = claimedAdult[ ep.product_id ] || 0;
			const currentClaimedChild = claimedChild[ ep.product_id ] || 0;

			const remainingAdult = maxAdult - currentClaimedAdult;
			const remainingChild = maxChild - currentClaimedChild;

			if ( qtyAdult > 0 ) {
				if ( qtyAdult > remainingAdult ) {
					return fail( 400, { error : `La cantidad solicitada de ${ ep.product?.name } ( Adulto ) supera el límite disponible de ${ remainingAdult }.` } );
				}
				itemsToCreate.push( {
					product_id       : ep.product_id,
					quantity_claimed : qtyAdult,
					is_minor_portion : false
				} );
			}

			if ( qtyChild > 0 && dbEvent.detect_by_minors ) {
				if ( qtyChild > remainingChild ) {
					return fail( 400, { error : `La cantidad solicitada de ${ ep.product?.name } ( Niño ) supera el límite disponible de ${ remainingChild }.` } );
				}
				itemsToCreate.push( {
					product_id       : ep.product_id,
					quantity_claimed : qtyChild,
					is_minor_portion : true
				} );
			}
		}

		if ( itemsToCreate.length === 0 ) {
			return fail( 400, { error : 'Debes ingresar al menos una porción para registrar la orden.' } );
		}

		// Snapshot members
		const familyMembersSnapshot = members.map( ( m : any ) => ( {
			rut               : m.rut,
			full_name         : m.full_name,
			organization      : m.organization,
			is_representative : m.is_representative
		} ) );

		const operatorUser    = await getUserByEmail( session.user.email ?? '' );
		const scannedByUserId = operatorUser?.id ?? null;

		const orderBody = {
			event_id           : params.eventId,
			family_event_id    : params.familyEventId,
			scanned_by_user_id : scannedByUserId,
			status             : 'COMPLETED' as const,
			family_members     : familyMembersSnapshot
		};

		try {
			await createOrder( orderBody, itemsToCreate );
			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	updateStatus : async ( { request, params } ) => {
		const session = await auth.api.getSession( { headers : request.headers } );

		if ( !session ) {
			return fail( 401, { error : 'No autorizado' } );
		}

		const dbEvent = await getEventById( params.eventId );

		if ( !dbEvent ) {
			return fail( 404, { error : 'Evento no encontrado' } );
		}

		if ( dbEvent.expires_at && isEventExpired( dbEvent.expires_at ) ) {
			return fail( 400, { error : 'El evento ha expirado y no se pueden modificar órdenes.' } );
		}

		const formData = await request.formData();
		const orderId  = formData.get( 'orderId' ) as string;
		const status   = formData.get( 'status' ) as OrderStatus;

		if ( !orderId || !status ) {
			return fail( 400, { error : 'Faltan datos de la orden' } );
		}

		try {
			await updateOrderStatus( orderId, status );
			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	deleteOrder : async ( { request, params } ) => {
		const session = await auth.api.getSession( { headers : request.headers } );

		if ( !session ) {
			return fail( 401, { error : 'No autorizado' } );
		}

		const role = ( ( await getUserRole( session.user.email ?? '' ) ) as UserRole ) || 'MEMBER';

		if ( role !== 'SUPER_ADMIN' ) {
			return fail( 403, { error : 'Solo el SUPER_ADMIN puede eliminar órdenes' } );
		}

		const formData = await request.formData();
		const orderId  = formData.get( 'orderId' ) as string;

		if ( !orderId ) {
			return fail( 400, { error : 'Falta el ID de la orden' } );
		}

		try {
			await deleteOrder( orderId );
			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	}
};
