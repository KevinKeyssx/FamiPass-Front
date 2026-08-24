import { fail, redirect }        from '@sveltejs/kit';
import type { Actions }               from './$types.js';
import { getFamilyEventByQrHash }     from '$lib/server/supabase/services/events.service.js';

export const actions: Actions = {
	validateHash : async ( { request } ) => {
		const formData = await request.formData();
		const hash     = ( formData.get( 'hash' ) as string )?.trim();

		if ( !hash ) {
			return fail( 400, { error : 'No se proporcionó ningún código QR.' } );
		}

		try {
			const familyEvent = await getFamilyEventByQrHash( hash );

			if ( !familyEvent ) {
				return fail( 404, { error : `No se encontró ningún ticket con el código QR "${ hash }".` } );
			}

			throw redirect( 302, `/operator/orders/${ familyEvent.event_id }/${ familyEvent.id }` );
		} catch ( err : any ) {
			if ( err.status === 302 ) throw err;
			return fail( 400, { error : err.message } );
		}
	}
};
