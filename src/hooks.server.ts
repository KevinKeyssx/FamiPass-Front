import type { Handle }      from '@sveltejs/kit';

import { auth }             from '$lib/auth/auth.js';
import { ensureUserExists } from '$lib/server/supabase/services/users.service.js';

export const handle: Handle = async ( { event, resolve } ) => {
	try {
		const session = await auth.api.getSession( {
			headers : event.request.headers
		} );

		if ( session ) {
			let dbUserId = session.user.id;

			// Auto-creación y sincronización de usuario en la tabla users con rol MEMBER
			if ( session.user.email ) {
				const dbUser = await ensureUserExists( {
					email : session.user.email,
					name  : session.user.name
				} );
				if ( dbUser?.id ) {
					dbUserId = dbUser.id;
				}
			}

			event.locals.user = {
				...session.user,
				id : dbUserId
			};
			event.locals.session = session.session;
		} else {
			event.locals.user    = null;
			event.locals.session = null;
		}
	} catch ( err ) {
		console.error( 'Error in hooks.server auth:', err );
		event.locals.user    = null;
		event.locals.session = null;
	}

	return resolve( event );
};
