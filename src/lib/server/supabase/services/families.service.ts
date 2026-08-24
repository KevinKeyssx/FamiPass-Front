import { supabaseServer } from '../supabase.js';

import type { Family } from '$lib/types/index.js';

export async function getFamilyById( id : string ): Promise<Family | null> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.select( '*, members:family_members(*)' )
		.eq( 'id', id )
		.single();

	if ( error ) {
		if ( error.code === 'PGRST116' ) {
			return null;
		}
		throw new Error( error.message );
	}

	const family = data as any;
	family.members_count = family.members ? family.members.length : 0;

	return family as Family;
}

export async function getFamilyByCode( code : number ): Promise<Family | null> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.select( '*, members:family_members(*)' )
		.eq( 'code', code )
		.single();

	if ( error ) {
		if ( error.code === 'PGRST116' ) {
			return null;
		}
		throw new Error( error.message );
	}

	const family = data as any;
	family.members_count = family.members ? family.members.length : 0;

	return family as Family;
}

export async function createFamily(
	family : Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'>
): Promise<Family> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.insert( [ family ] )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Family;
}

export async function updateFamily(
	id     : string,
	family : Partial<Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'>>
): Promise<Family> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.update( family )
		.eq( 'id', id )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Family;
}

export async function deleteFamily( id : string ): Promise<void> {
	const { error } = await supabaseServer
		.from( 'families' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}
