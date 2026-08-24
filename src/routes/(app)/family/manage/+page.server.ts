import { fail, redirect }                                   from '@sveltejs/kit';
import type { PageServerLoad, Actions }                        from './$types.js';
import { getFamilyById, createFamily, updateFamily }           from '$lib/server/supabase/services/families.service.js';
import {
	getFamilyMembers,
	createFamilyMember,
	updateFamilyMember,
	deleteFamilyMember
}                                                              from '$lib/server/supabase/services/familyMembers.service.js';
import { validateRut, formatRut, validatePhone, formatPhone }   from '$lib/utils/validation.js';
import type { CommunityOrganization, Family, FamilyMember }     from '$lib/types/index.js';

export const load: PageServerLoad = async ( { cookies } ) => {
	const activeFamilyId = cookies.get( 'famipass_family_id' );

	let family  : Family | null = null;
	let members : FamilyMember[] = [];

	if ( activeFamilyId ) {
		try {
			family = await getFamilyById( activeFamilyId );
			if ( family ) {
				members = await getFamilyMembers( activeFamilyId );
			}
		} catch ( err ) {
			console.error( 'Error loading family data:', err );
		}
	}

	return {
		family,
		members
	};
};

export const actions: Actions = {
	saveFamily : async ( { request, cookies } ) => {
		const activeFamilyId = cookies.get( 'famipass_family_id' );
		const formData = await request.formData();
		const familyName = ( formData.get( 'family_name' ) as string )?.trim();

		if ( !familyName ) {
			return fail( 400, { error : 'El nombre de la familia es obligatorio.' } );
		}

		try {
			if ( activeFamilyId ) {
				await updateFamily( activeFamilyId, {
					family_name : familyName
				} );
				return { success : true };
			} else {
				const randomCode = Math.floor( 10000 + Math.random() * 90000 );
				const newFamily = await createFamily( {
					family_name : familyName,
					code        : randomCode
				} );

				cookies.set( 'famipass_family_id', newFamily.id, {
					path     : '/',
					maxAge   : 60 * 60 * 24 * 365,
					httpOnly : false,
					sameSite : 'lax'
				} );

				return { success : true, familyId : newFamily.id };
			}
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	saveMember : async ( { request, cookies } ) => {
		const activeFamilyId = cookies.get( 'famipass_family_id' );

		if ( !activeFamilyId ) {
			return fail( 400, { error : 'Debes crear primero la familia antes de agregar integrantes.' } );
		}

		const formData = await request.formData();
		const memberId = formData.get( 'member_id' ) as string;
		const fullName = ( formData.get( 'full_name' ) as string )?.trim();
		const rawRut   = ( formData.get( 'rut' ) as string )?.trim();
		const rawPhone = ( formData.get( 'phone' ) as string )?.trim();
		const organization = formData.get( 'organization' ) as CommunityOrganization;
		const isRepresentative = formData.get( 'is_representative' ) === 'true';

		if ( !fullName ) {
			return fail( 400, { error : 'El nombre completo es requerido.' } );
		}

		if ( !rawRut || !validateRut( rawRut ) ) {
			return fail( 400, { error : 'El RUT ingresado no es válido.' } );
		}

		const cleanRut = formatRut( rawRut );

		let cleanPhone : string | null = null;
		if ( rawPhone ) {
			if ( !validatePhone( rawPhone ) ) {
				return fail( 400, { error : 'El formato del teléfono es inválido (ej: 912345678).' } );
			}
			cleanPhone = formatPhone( rawPhone );
		}

		try {
			if ( memberId ) {
				await updateFamilyMember( memberId, {
					full_name         : fullName,
					rut               : cleanRut,
					phone             : cleanPhone,
					organization      : organization || 'NINGUNA',
					is_representative : isRepresentative
				} );
			} else {
				await createFamilyMember( {
					family_id         : activeFamilyId,
					full_name         : fullName,
					rut               : cleanRut,
					phone             : cleanPhone,
					organization      : organization || 'NINGUNA',
					is_representative : isRepresentative
				} );
			}

			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	deleteMember : async ( { request } ) => {
		const formData = await request.formData();
		const memberId = formData.get( 'member_id' ) as string;

		if ( !memberId ) {
			return fail( 400, { error : 'ID de integrante no especificado.' } );
		}

		try {
			await deleteFamilyMember( memberId );
			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	}
};
