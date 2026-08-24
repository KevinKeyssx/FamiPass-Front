import { fail, redirect }                 from '@sveltejs/kit';
import type { Actions }                        from './$types.js';
import { getFamilyByCode }                     from '$lib/server/supabase/services/families.service.js';
import { getMemberByRut }                      from '$lib/server/supabase/services/familyMembers.service.js';

export const actions: Actions = {
	linkByCode: async ( { request, cookies } ) => {
		const formData = await request.formData();
		const rawCode  = formData.get( 'code' ) as string;

		if ( !rawCode || isNaN( Number( rawCode ) ) ) {
			return fail( 400, { error : 'Ingresa un código numérico válido.' } );
		}

		const code = Number( rawCode );

		try {
			const family = await getFamilyByCode( code );

			if ( !family ) {
				return fail( 404, { error : `No se encontró ninguna familia con el código ${ code }.` } );
			}

			cookies.set( 'famipass_family_id', family.id, {
				path     : '/',
				maxAge   : 60 * 60 * 24 * 365,
				httpOnly : false,
				sameSite : 'lax'
			} );

			throw redirect( 302, '/family' );
		} catch ( err : any ) {
			if ( err.status === 302 ) throw err;
			return fail( 400, { error : err.message } );
		}
	},

	linkByRut: async ( { request, cookies } ) => {
		const formData = await request.formData();
		const rawRut   = ( formData.get( 'rut' ) as string )?.trim();

		if ( !rawRut ) {
			return fail( 400, { error : 'Ingresa un RUT para buscar.' } );
		}

		try {
			const member = await getMemberByRut( rawRut );

			if ( !member || !member.family_id ) {
				return fail( 404, { error : `No se encontró ninguna familia asociada al RUT ${ rawRut }.` } );
			}

			cookies.set( 'famipass_family_id', member.family_id, {
				path     : '/',
				maxAge   : 60 * 60 * 24 * 365,
				httpOnly : false,
				sameSite : 'lax'
			} );

			throw redirect( 302, '/family' );
		} catch ( err : any ) {
			if ( err.status === 302 ) throw err;
			return fail( 400, { error : err.message } );
		}
	}
};
