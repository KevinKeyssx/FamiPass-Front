import { z } from 'zod';

import {
	SUPABASE_URL,
	SUPABASE_ANON_KEY,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	BETTER_AUTH_BASE_URL,
	BETTER_AUTH_SECRET
} from '$env/static/private';

const envSchema = z.object( {
	SUPABASE_URL         : z.string().min( 1 ),
	SUPABASE_ANON_KEY    : z.string().min( 1 ),
	GOOGLE_CLIENT_ID     : z.string().min( 1 ),
	GOOGLE_CLIENT_SECRET : z.string().min( 1 ),
	BETTER_AUTH_BASE_URL : z.string().min( 1 ),
	BETTER_AUTH_SECRET   : z.string().min( 1 )
} );

const parsedEnv = envSchema.safeParse( {
	SUPABASE_URL,
	SUPABASE_ANON_KEY,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	BETTER_AUTH_BASE_URL,
	BETTER_AUTH_SECRET
} );

if ( !parsedEnv.success ) {
	console.error( '❌ Invalid environment variables:' );
	throw new Error( 'Invalid environment variables' );
}

export const ENV = {
	SUPABASE : {
		URL : parsedEnv.data.SUPABASE_URL,
		KEY : parsedEnv.data.SUPABASE_ANON_KEY
	},

	GOOGLE : {
		CLIENT_ID     : parsedEnv.data.GOOGLE_CLIENT_ID,
		CLIENT_SECRET : parsedEnv.data.GOOGLE_CLIENT_SECRET
	},

	BETTER_AUTH : {
		BASE_URL : parsedEnv.data.BETTER_AUTH_BASE_URL,
		SECRET   : parsedEnv.data.BETTER_AUTH_SECRET
	}
};
