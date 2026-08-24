import type { PageServerLoad } from './$types.js';
import { getRecentOrders }      from '$lib/server/supabase/services/orders.service.js';

export const load: PageServerLoad = async () => {
	try {
		const orders = await getRecentOrders( 30 );
		return {
			orders
		};
	} catch ( err : any ) {
		return {
			orders : [],
			error  : err.message
		};
	}
};
