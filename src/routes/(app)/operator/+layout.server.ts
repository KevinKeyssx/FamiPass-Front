import { redirect }        from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { getUserRole }         from '$lib/server/supabase/services/users.service.js';
import type { UserRole }        from '$lib/types/index.js';

export const load: LayoutServerLoad = async ( { locals } ) => {
	if ( !locals.user || !locals.user.email ) {
		throw redirect( 302, '/login' );
	}

	const role = ( await getUserRole( locals.user.email ) ) as UserRole;

	if ( ![ 'SUPER_ADMIN', 'ADMIN', 'STAFF' ].includes( role ) ) {
		throw redirect( 302, '/family?error=unauthorized' );
	}

	return {
		role
	};
};
