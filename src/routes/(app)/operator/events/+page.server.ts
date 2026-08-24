import type { PageServerLoad } from './$types.js';
import { getEvents }             from '$lib/server/supabase/services/events.service.js';

export const load: PageServerLoad = async () => {
	try {
		const events = await getEvents();
		return {
			events
		};
	} catch ( err : any ) {
		return {
			events : [],
			error  : err.message
		};
	}
};
