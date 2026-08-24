import { redirect }        from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getUserRole }         from '$lib/server/supabase/services/users.service.js';

export const load: PageServerLoad = async ( { locals } ) => {
	if ( !locals.user || !locals.user.email ) {
		throw redirect( 302, '/login' );
	}

	const role = await getUserRole( locals.user.email );

	if ( role && [ 'SUPER_ADMIN', 'ADMIN', 'STAFF' ].includes( role ) ) {
		throw redirect( 302, '/operator/scan' );
	}

	throw redirect( 302, '/family' );
};
