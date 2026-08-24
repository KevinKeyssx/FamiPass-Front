import { auth }       from '$lib/auth/auth.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ( event ) => {
	return auth.handler( event.request );
};

export const POST: RequestHandler = async ( event ) => {
	return auth.handler( event.request );
};
