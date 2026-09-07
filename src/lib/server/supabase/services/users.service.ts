import { supabaseServer } from '../supabase.js';

import type { User, UserRole } from '$lib/types/index.js';

export async function getUserRole(
	email : string
): Promise<UserRole | null> {
	const { data } = await supabaseServer
		.from( 'users' )
		.select( 'role' )
		.eq( 'email', email )
		.single();

	return ( data?.role as UserRole ) ?? null;
}

export async function getUserByEmail(
	email : string
): Promise<User | null> {
	const cleanEmail = email.trim().toLowerCase();

	const { data, error } = await supabaseServer
		.from( 'users' )
		.select( '*' )
		.ilike( 'email', cleanEmail )
		.limit( 1 );

	if ( error ) {
		throw new Error( error.message );
	}

	return data && data.length > 0 ? ( data[ 0 ] as User ) : null;
}

export async function getUserById( id : string ): Promise<User> {
	const { data, error } = await supabaseServer
		.from( 'users' )
		.select( '*' )
		.eq( 'id', id )
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as User;
}

export async function createUser(
	user : Omit<User, 'id' | 'created_at' | 'updated_at'>
): Promise<User> {
	const { data, error } = await supabaseServer
		.from( 'users' )
		.insert( [ user ] )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as User;
}

export async function ensureUserExists(
	authUser : { email : string; name? : string | null }
): Promise<User> {
	const existing = await getUserByEmail( authUser.email );

	if ( existing ) {
		return existing;
	}

	const newUser : Omit<User, 'id' | 'created_at' | 'updated_at'> = {
		email     : authUser.email,
		user_name : authUser.name || authUser.email.split( '@' )[ 0 ] || 'Usuario',
		phone     : null,
		role      : 'MEMBER',
		is_active : true
	};

	return await createUser( newUser );
}
