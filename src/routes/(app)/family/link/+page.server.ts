import { fail, redirect } from '@sveltejs/kit';

import {
    getMemberByRut,
    linkUserToFamilyMember,
    getFamilyMembers,
    isValidUuid
}                                       from '$lib/server/supabase/services/familyMembers.service.js';
import type { PageServerLoad, Actions } from './$types.js';
import { getFamilyByCode }              from '$lib/server/supabase/services/families.service.js';
import { ensureUserExists }             from '$lib/server/supabase/services/users.service.js';
import { supabaseServer }               from '$lib/server/supabase/supabase.js';


export const load: PageServerLoad = async () => {
	// Deshabilitado temporalmente hasta que se implemente la validación de solicitudes por correo con el admin
	throw redirect( 302, '/family' );
};


export const actions: Actions = {
	linkByCode : async ( { request, locals } ) => {
		const formData = await request.formData();
		const rawCode  = formData.get( 'code' ) as string;

		if ( !rawCode || isNaN( Number( rawCode ) ) ) {
			return fail( 400, { error : 'Ingresa un código numérico válido de 5 dígitos.' } );
		}

		const code = Number( rawCode );

		try {
			const family = await getFamilyByCode( code );

			if ( !family ) {
				return fail( 404, { error : `No se encontró ninguna familia con el código ${ code }.` } );
			}

			// Si el usuario está autenticado, vincular su cuenta a la familia
			if ( locals.user ) {
				let dbUserId = locals.user.id;
				if ( ( !dbUserId || !isValidUuid( dbUserId ) ) && locals.user.email ) {
					const dbUser = await ensureUserExists( {
						email : locals.user.email,
						name  : locals.user.name
					} );
					if ( dbUser?.id ) {
						dbUserId = dbUser.id;
					}
				}

				if ( dbUserId && isValidUuid( dbUserId ) ) {
					// 1. Desvincular al usuario de cualquier otra familia previa
					await supabaseServer
						.from( 'family_members' )
						.update( { user_id : null } )
						.eq( 'user_id', dbUserId );

					const members = await getFamilyMembers( family.id );
					let targetMember = null;

					if ( locals.user.email ) {
						const userEmail = locals.user.email.toLowerCase();
						targetMember = members.find( ( m ) => m.email && m.email.toLowerCase() === userEmail ) || null;
					}

					// Si no hay un miembro con su email, asociar al representante
					if ( !targetMember ) {
						targetMember = members.find( ( m ) => m.is_representative ) || null;
					}

					// Si no, cualquier miembro existente
					if ( !targetMember && members.length > 0 ) {
						targetMember = members[ 0 ];
					}

					if ( targetMember ) {
						await linkUserToFamilyMember( targetMember.id, dbUserId );
						if ( !targetMember.email && locals.user.email ) {
							await supabaseServer
								.from( 'family_members' )
								.update( { email : locals.user.email } )
								.eq( 'id', targetMember.id );
						}
					} else {
						// Si la familia no tiene integrantes, crear el primero vinculado al usuario
						const randomRutNumber = Math.floor( 10000000 + Math.random() * 90000000 );
						await supabaseServer
							.from( 'family_members' )
							.insert( [ {
								family_id         : family.id,
								full_name         : locals.user.name || locals.user.email?.split( '@' )[ 0 ] || 'Representante',
								rut               : `${ randomRutNumber }-K`,
								email             : locals.user.email || null,
								phone             : null,
								organization      : 'NINGUNA',
								is_representative : true,
								user_id           : dbUserId
							} ] );
					}
				}
			}

			throw redirect( 302, '/family' );
		} catch ( err : any ) {
			if ( err.status === 302 ) throw err;
			return fail( 400, { error : err.message } );
		}
	},

	linkByRut : async ( { request, locals } ) => {
		const formData = await request.formData();
		const rawRut   = ( formData.get( 'rut' ) as string )?.trim();

		if ( !rawRut ) {
			return fail( 400, { error : 'Ingresa un RUT para buscar.' } );
		}

		try {
			const member = await getMemberByRut( rawRut );

			if ( !member || !member.family_id ) {
				return fail( 404, { error : `No se encontró ninguna familia asociada al RUT ${ rawRut }.` } );
			}

			if ( locals.user ) {
				let dbUserId = locals.user.id;
				if ( ( !dbUserId || !isValidUuid( dbUserId ) ) && locals.user.email ) {
					const dbUser = await ensureUserExists( {
						email : locals.user.email,
						name  : locals.user.name
					} );
					if ( dbUser?.id ) {
						dbUserId = dbUser.id;
					}
				}

				if ( dbUserId && isValidUuid( dbUserId ) ) {
					// Desvincular de otras familias previas
					await supabaseServer
						.from( 'family_members' )
						.update( { user_id : null } )
						.eq( 'user_id', dbUserId );

					await linkUserToFamilyMember( member.id, dbUserId );

					if ( !member.email && locals.user.email ) {
						await supabaseServer
							.from( 'family_members' )
							.update( { email : locals.user.email } )
							.eq( 'id', member.id );
					}
				}
			}

			throw redirect( 302, '/family' );
		} catch ( err : any ) {
			if ( err.status === 302 ) throw err;
			return fail( 400, { error : err.message } );
		}
	}
};
