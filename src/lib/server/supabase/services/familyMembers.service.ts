import { supabaseServer } from '../supabase.js';

import type { FamilyMember } from '$lib/types/index.js';

export async function getFamilyMembers( familyId : string ): Promise<FamilyMember[]> {
	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.select( '*' )
		.eq( 'family_id', familyId )
		.order( 'full_name', { ascending: true } );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember[];
}

export async function getFamilyMemberById( id : string ): Promise<FamilyMember> {
	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.select( '*' )
		.eq( 'id', id )
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember;
}

export async function getMemberByRut( rut : string ): Promise<FamilyMember | null> {
	const cleanRut = rut.trim().toLowerCase();

	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.select( '*, family:families(*)' )
		.ilike( 'rut', cleanRut )
		.limit( 1 );

	if ( error ) {
		throw new Error( error.message );
	}

	return data && data.length > 0 ? ( data[ 0 ] as FamilyMember ) : null;
}

export async function createFamilyMember(
	member : Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'family'>
): Promise<FamilyMember> {
	// Validar que el RUT no pertenezca a otra familia
	const existingMember = await getMemberByRut( member.rut );

	if ( existingMember ) {
		const familyName = existingMember.family?.family_name || 'otra familia';
		throw new Error( `El RUT ${ member.rut } ya se encuentra registrado en la familia "${ familyName }".` );
	}

	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.insert( [ member ] )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember;
}

export async function updateFamilyMember(
	id     : string,
	member : Partial<Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'family'>>
): Promise<FamilyMember> {
	if ( member.rut ) {
		const existingMember = await getMemberByRut( member.rut );
		if ( existingMember && existingMember.id !== id ) {
			const familyName = existingMember.family?.family_name || 'otra familia';
			throw new Error( `El RUT ${ member.rut } ya se encuentra registrado en la familia "${ familyName }".` );
		}
	}

	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.update( member )
		.eq( 'id', id )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember;
}

export async function deleteFamilyMember( id : string ): Promise<void> {
	const { error } = await supabaseServer
		.from( 'family_members' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}
