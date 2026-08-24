import { getRequestEvent } from '$app/server';

import { betterAuth }       from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { ENV }              from '$lib/server/env.server.js';

export const auth = betterAuth( {
	secret          : ENV.BETTER_AUTH.SECRET,
	baseURL         : ENV.BETTER_AUTH.BASE_URL,
	plugins         : [ sveltekitCookies( getRequestEvent ) ],
	socialProviders : {
		google : {
			clientId     : ENV.GOOGLE.CLIENT_ID,
			clientSecret : ENV.GOOGLE.CLIENT_SECRET
		}
	}
} );
