import { fail } from '@sveltejs/kit';

import {
    getFamilyTickets,
	getAvailableEventsForFamily,
	linkFamilyToEvent
}                                            from '$lib/server/supabase/services/events.service.js';
import { getFamilyById, getFamilyForUser }  from '$lib/server/supabase/services/families.service.js';
import type { PageServerLoad, Actions }     from './$types.js';


export const load: PageServerLoad = async ( { locals, url, cookies } ) => {
	const paramFamilyId = url.searchParams.get( 'familyId' );

	let family = null;

	try {
		if ( paramFamilyId ) {
			family = await getFamilyById( paramFamilyId );
		} else if ( locals.user ) {
			family = await getFamilyForUser( locals.user.id, locals.user.email );
		}

		// Si no tiene familia vinculada, limpiar cualquier cookie residual antigua
		if ( !family ) {
			cookies.delete( 'famipass_family_id', { path : '/' } );
			return {
				family          : null,
				tickets         : [],
				availableEvents : []
			};
		}

		const tickets         = await getFamilyTickets( family.id );
		const availableEvents = await getAvailableEventsForFamily( family.id );

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
	joinEvent : async ( { request, locals } ) => {
		if ( !locals.user ) {
			return fail( 401, { error : 'Debes iniciar sesión para inscribir a tu familia en un evento.' } );
		}

		const family = await getFamilyForUser( locals.user.id, locals.user.email );

		if ( !family ) {
			return fail( 400, { error : 'No se encontró una familia activa vinculada a tu cuenta.' } );
		}

		const formData = await request.formData();
		const eventId  = ( formData.get( 'event_id' ) as string )?.trim();

		if ( !eventId ) {
			return fail( 400, { error : 'Debes seleccionar un evento válido.' } );
		}

		try {
			await linkFamilyToEvent( family.id, eventId );
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
