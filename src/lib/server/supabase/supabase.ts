import { createClient } from '@supabase/supabase-js';

import { ENV }          from '../env.server.js';

export const supabaseServer = createClient(
	ENV.SUPABASE.URL,
	ENV.SUPABASE.KEY,
	{
		auth : {
			persistSession : false
		}
	}
);
