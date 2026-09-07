import { redirect } from '@sveltejs/kit';

import {
    getUserByEmail,
    getUserRole
}                                   from '$lib/server/supabase/services/users.service.js';
import type { LayoutServerLoad }    from './$types.js';
import type { UserRole }            from '$lib/types/index.js';


export const load: LayoutServerLoad = async ( { locals } ) => {
	if ( !locals.user || !locals.user.email ) {
		throw redirect( 302, '/login' );
	}

	const role   = ( await getUserRole( locals.user.email ) ) || ( 'MEMBER' as UserRole );
	const dbUser = await getUserByEmail( locals.user.email );

	return {
		user : {
			id        : locals.user.id,
			name      : locals.user.name ?? dbUser?.user_name ?? locals.user.email.split( '@' )[ 0 ],
			user_name : dbUser?.user_name ?? locals.user.name,
			email     : locals.user.email,
			image     : ( locals.user as any ).image ?? null
		},
		role : role
	};
};
