import { supabaseServer } from '../supabase.js';

import type { Order, OrderStatus, OrderItem, EventProduct } from '$lib/types/index.js';

export async function getOrdersByFamilyEventId( familyEventId : string ): Promise<Order[]> {
	const { data, error } = await supabaseServer
		.from( 'orders' )
		.select( `
			*,
			scanned_by_user:users ( * ),
			items:order_items (
				*,
				product:products ( * )
			)
		` )
		.eq( 'family_event_id', familyEventId )
		.order( 'created_at', { ascending: false } );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Order[];
}

export async function getRecentOrders( limit : number = 20 ): Promise<Order[]> {
	const { data, error } = await supabaseServer
		.from( 'orders' )
		.select( `
			*,
			event:events ( * ),
			family_event:family_events (
				*,
				family:families ( * )
			),
			scanned_by_user:users ( * ),
			items:order_items (
				*,
				product:products ( * )
			)
		` )
		.order( 'created_at', { ascending: false } )
		.limit( limit );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Order[];
}

export async function updateOrderStatus( orderId : string, status : OrderStatus ): Promise<Order> {
	const { data, error } = await supabaseServer
		.from( 'orders' )
		.update( { status } )
		.eq( 'id', orderId )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Order;
}

export async function deleteOrder( orderId : string ): Promise<void> {
	const { error } = await supabaseServer
		.from( 'orders' )
		.delete()
		.eq( 'id', orderId );

	if ( error ) {
		throw new Error( error.message );
	}
}

export async function createOrder(
	order : Omit<Order, 'id' | 'created_at'>,
	items : Array<Omit<OrderItem, 'id' | 'order_id'>>
): Promise<Order> {
	const { data: newOrder, error: orderError } = await supabaseServer
		.from( 'orders' )
		.insert( order )
		.select()
		.single();

	if ( orderError ) {
		throw new Error( orderError.message );
	}

	if ( items.length > 0 ) {
		const itemsToInsert = items.map( ( item ) => ( {
			...item,
			order_id : newOrder.id
		} ) );

		const { error: itemsError } = await supabaseServer
			.from( 'order_items' )
			.insert( itemsToInsert );

		if ( itemsError ) {
			await supabaseServer
				.from( 'orders' )
				.delete()
				.eq( 'id', newOrder.id );

			throw new Error( itemsError.message );
		}
	}

	return newOrder as Order;
}

export async function getEventProducts( eventId : string ): Promise<EventProduct[]> {
	const { data, error } = await supabaseServer
		.from( 'event_products' )
		.select( `
			*,
			product:products ( * )
		` )
		.eq( 'event_id', eventId );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as EventProduct[];
}
