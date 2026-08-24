import { supabaseServer } from '../supabase.js';

import type { EventConfig, FamilyEvent } from '$lib/types/index.js';


export async function getEvents(): Promise<EventConfig[]> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.select( '*' )
		.order( 'event_date', { ascending : true } );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as EventConfig[];
}

export async function getActiveEvents(): Promise<EventConfig[]> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.select( '*' )
		.in( 'status', [ 'IN_PROGRESS', 'DRAFT' ] )
		.order( 'event_date', { ascending : true } );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as EventConfig[];
}

export async function getAvailableEventsForFamily( familyId : string ): Promise<EventConfig[]> {
	const { data: events, error: eventsError } = await supabaseServer
		.from( 'events' )
		.select( '*' )
		.in( 'status', [ 'IN_PROGRESS', 'DRAFT' ] )
		.order( 'event_date', { ascending : true } );

	if ( eventsError ) {
		throw new Error( eventsError.message );
	}

	const { data: existingFamilyEvents, error: feError } = await supabaseServer
		.from( 'family_events' )
		.select( 'event_id' )
		.eq( 'family_id', familyId );

	if ( feError ) {
		throw new Error( feError.message );
	}

	const registeredEventIds = new Set( ( existingFamilyEvents || [] ).map( ( fe ) => fe.event_id ) );
	const now = new Date();

	const availableEvents = ( ( events as EventConfig[] ) || [] ).filter( ( event ) => {
		if ( registeredEventIds.has( event.id ) ) {
			return false;
		}

		if ( event.registration_deadline ) {
			const deadline = new Date( event.registration_deadline );
			if ( !isNaN( deadline.getTime() ) && now > deadline ) {
				return false;
			}
		}

		if ( event.expires_at ) {
			const expiration = new Date( event.expires_at );
			if ( !isNaN( expiration.getTime() ) && now > expiration ) {
				return false;
			}
		}

		return true;
	} );

	return availableEvents;
}

export async function getEventById( id : string ): Promise<any | null> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.select( `
			*,
			family_events (
				*,
				family:families ( *, members:family_members ( * ) ),
				orders (
					*,
					items:order_items ( *, product:products ( * ) )
				)
			)
		` )
		.eq( 'id', id )
		.single();

	if ( error ) {
		if ( error.code === 'PGRST116' ) {
			return null;
		}
		throw new Error( error.message );
	}

	return data;
}

export async function getFamilyEventByQrHash( qrHash : string ): Promise<FamilyEvent | null> {
	const cleanHash = qrHash.trim().toUpperCase();

	const { data, error } = await supabaseServer
		.from( 'family_events' )
		.select( `
			*,
			family:families (
				*,
				members:family_members ( * )
			),
			event:events (
				*
			),
			orders (
				*,
				scanned_by_user:users ( * ),
				items:order_items (
					*,
					product:products ( * )
				)
			)
		` )
		.or( `qr_code_hash.eq.${ cleanHash },short_code.eq.${ cleanHash }` )
		.single();

	if ( error ) {
		if ( error.code === 'PGRST116' ) {
			return null;
		}
		throw new Error( error.message );
	}

	return data as FamilyEvent;
}

export async function getFamilyTickets( familyId : string ): Promise<FamilyEvent[]> {
	const { data, error } = await supabaseServer
		.from( 'family_events' )
		.select( `
			*,
			family:families (
				*,
				members:family_members ( * )
			),
			event:events (
				*
			),
			orders (
				*,
				scanned_by_user:users ( * ),
				items:order_items (
					*,
					product:products ( * )
				)
			)
		` )
		.eq( 'family_id', familyId )
		.order( 'created_at', { ascending : false } );

	if ( error ) {
		throw new Error( error.message );
	}

	return ( data || [] ) as FamilyEvent[];
}

export async function linkFamilyToEvent( familyId : string, eventId : string ): Promise<FamilyEvent> {
	const { data: event, error: eventError } = await supabaseServer
		.from( 'events' )
		.select( '*' )
		.eq( 'id', eventId )
		.single();

	if ( eventError || !event ) {
		throw new Error( 'El evento seleccionado no existe.' );
	}

	if ( event.status !== 'IN_PROGRESS' && event.status !== 'DRAFT' ) {
		throw new Error( 'El evento no está disponible para inscripciones.' );
	}

	const now = new Date();
	if ( event.registration_deadline ) {
		const deadline = new Date( event.registration_deadline );
		if ( !isNaN( deadline.getTime() ) && now > deadline ) {
			throw new Error( 'El plazo de inscripción para este evento ya ha finalizado.' );
		}
	}

	if ( event.expires_at ) {
		const expiration = new Date( event.expires_at );
		if ( !isNaN( expiration.getTime() ) && now > expiration ) {
			throw new Error( 'Este evento ya ha expirado.' );
		}
	}

	const { data: existingRegistration } = await supabaseServer
		.from( 'family_events' )
		.select( 'id' )
		.eq( 'family_id', familyId )
		.eq( 'event_id', eventId )
		.single();

	if ( existingRegistration ) {
		throw new Error( 'La familia ya se encuentra inscrita en este evento.' );
	}

	const { data: members, error: membersError } = await supabaseServer
		.from( 'family_members' )
		.select( '*' )
		.eq( 'family_id', familyId );

	if ( membersError ) {
		throw new Error( 'Error al consultar los miembros de la familia.' );
	}

	const memberList   = members || [];
	const totalMembers = memberList.length;
	const friendsCount = memberList.filter( ( m ) => m.organization === 'FRIENDS' ).length;

	if ( totalMembers === 0 ) {
		throw new Error( 'Debes registrar al menos un integrante en tu familia antes de solicitar un ticket.' );
	}

	if ( event.max_family_members !== null && event.max_family_members !== undefined && totalMembers > event.max_family_members ) {
		throw new Error( `La familia supera el límite máximo permitido para este evento (${ event.max_family_members } integrantes). Tienes ${ totalMembers } registrados.` );
	}

	if ( event.max_guests_per_family !== null && event.max_guests_per_family !== undefined && friendsCount > event.max_guests_per_family ) {
		throw new Error( `La familia supera el límite de amigos/invitados permitido para este evento (${ event.max_guests_per_family } invitados). Tienes ${ friendsCount } registrados.` );
	}

	const { data: newFamilyEvent, error: insertError } = await supabaseServer
		.from( 'family_events' )
		.insert( {
			family_id    : familyId,
			event_id     : eventId,
		})
		.select( `
			*,
			family:families (
				*,
				members:family_members ( * )
			),
			event:events (
				*
			)
		` )
		.single();

	if ( insertError ) {
		throw new Error( insertError.message );
	}

	return newFamilyEvent as FamilyEvent;
}
