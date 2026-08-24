import type { PageServerLoad, Actions } from './$types.js';
import { getFamilyById }                  from '$lib/server/supabase/services/families.service.js';
import {
	getFamilyTickets,
	getAvailableEventsForFamily,
	linkFamilyToEvent
}                                         from '$lib/server/supabase/services/events.service.js';
import { fail }                           from '@sveltejs/kit';

export const load: PageServerLoad = async ( { cookies, url } ) => {
	const paramFamilyId  = url.searchParams.get( 'familyId' );
	const cookieFamilyId = cookies.get( 'famipass_family_id' );
	const activeFamilyId = paramFamilyId || cookieFamilyId;

	if ( !activeFamilyId ) {
		return {
			family          : null,
			tickets         : [],
			availableEvents : []
		};
	}

	try {
		const family = await getFamilyById( activeFamilyId );

		if ( !family ) {
			cookies.delete( 'famipass_family_id', { path : '/' } );
			return {
				family          : null,
				tickets         : [],
				availableEvents : []
			};
		}

		if ( paramFamilyId ) {
			cookies.set( 'famipass_family_id', activeFamilyId, {
				path     : '/',
				maxAge   : 60 * 60 * 24 * 365,
				httpOnly : false,
				sameSite : 'lax'
			} );
		}

		const tickets         = await getFamilyTickets( activeFamilyId );
		const availableEvents = await getAvailableEventsForFamily( activeFamilyId );

		return {
			family,
			tickets,
			availableEvents
		};
	} catch ( err : any ) {
		return {
			family          : null,
			tickets         : [],
			availableEvents : [],
			error           : err.message
		};
	}
};

export const actions: Actions = {
	joinEvent : async ( { request, cookies } ) => {
		const activeFamilyId = cookies.get( 'famipass_family_id' );

		if ( !activeFamilyId ) {
			return fail( 400, { error : 'No se encontró una familia activa vinculada.' } );
		}

		const formData = await request.formData();
		const eventId  = ( formData.get( 'event_id' ) as string )?.trim();

		if ( !eventId ) {
			return fail( 400, { error : 'Debes seleccionar un evento válido.' } );
		}

		try {
			await linkFamilyToEvent( activeFamilyId, eventId );
			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	unlinkFamily : async ( { cookies } ) => {
		cookies.delete( 'famipass_family_id', { path : '/' } );
		return { success : true };
	}
};
