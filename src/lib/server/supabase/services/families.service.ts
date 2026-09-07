import { supabaseServer } from '../supabase.js';
import {
	getFamilyMemberByUserId,
	getFamilyMemberByEmail,
	linkUserToFamilyMember,
	isValidUuid
} from './familyMembers.service.js';
import { getUserByEmail } from './users.service.js';

import type { Family } from '$lib/types/index.js';

export async function getFamilyForUser(
	userId? : string | null,
	email?  : string | null
): Promise<Family | null> {
	let dbUserId = userId;

	// Si userId no es un UUID válido, resolver el id real de Postgres por email
	if ( ( !dbUserId || !isValidUuid( dbUserId ) ) && email ) {
		try {
			const dbUser = await getUserByEmail( email );
			if ( dbUser?.id ) {
				dbUserId = dbUser.id;
			}
		} catch ( err ) {
			console.error( 'Error resolving user by email in getFamilyForUser:', err );
		}
	}

	let member = null;

	// 1. Buscar si ya está vinculado directamente por user_id
	if ( dbUserId && isValidUuid( dbUserId ) ) {
		member = await getFamilyMemberByUserId( dbUserId );
	}

	// 2. Si no está vinculado por user_id, buscar por email para auto-vincular
	if ( !member && email ) {
		member = await getFamilyMemberByEmail( email );
		if ( member && dbUserId && isValidUuid( dbUserId ) ) {
			try {
				await linkUserToFamilyMember( member.id, dbUserId );
			} catch ( linkErr ) {
				console.error( 'Error auto-linking user to family member:', linkErr );
			}
		}
	}

	if ( !member || !member.family_id ) {
		return null;
	}

	return await getFamilyById( member.family_id );
}

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

export async function getFamilyByName( familyName : string ): Promise<Family | null> {
	const cleanName = familyName.trim();
	const { data, error } = await supabaseServer
		.from( 'families' )
		.select( '*, members:family_members(*)' )
		.ilike( 'family_name', cleanName )
		.limit( 1 );

	if ( error ) {
		throw new Error( error.message );
	}

	if ( !data || data.length === 0 ) {
		return null;
	}

	const family = data[ 0 ] as any;
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
