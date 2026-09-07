import type { LayoutServerLoad }       from './$types.js';
import { getUserByEmail, getUserRole } from '$lib/server/supabase/services/users.service.js';
import type { UserRole }               from '$lib/types/index.js';

export const load: LayoutServerLoad = async ( { locals } ) => {
	let user = null;
	let role : UserRole = 'MEMBER';

	if ( locals.user && locals.user.email ) {
		role = ( await getUserRole( locals.user.email )) || ( 'MEMBER' as UserRole );

        const dbUser = await getUserByEmail( locals.user.email );

		user = {
			id        : locals.user.id,
			name      : locals.user.name ?? dbUser?.user_name ?? locals.user.email.split( '@' )[ 0 ],
			user_name : dbUser?.user_name ?? locals.user.name,
			email     : locals.user.email,
			image     : ( locals.user as any ).image ?? null
		};
	}

	return {
		user,
		role,
		session : locals.session
	};
};
