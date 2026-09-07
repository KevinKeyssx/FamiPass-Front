import { fail } from '@sveltejs/kit';

import {
    getFamilyMembers,
	createFamilyMember,
	updateFamilyMember,
	deleteFamilyMember
}                                           from '$lib/server/supabase/services/familyMembers.service.js';
import {
    getFamilyById,
    createFamily,
    updateFamily,
    getFamilyForUser,
    getFamilyByName
}                                           from '$lib/server/supabase/services/families.service.js';
import type {
    CommunityOrganization,
    Family,
    FamilyMember,
    FamilyMemberRole
}                                           from '$lib/types/index.js';
import {
    validateRut,
    formatRut,
    validatePhone,
    formatPhone
}                                           from '$lib/utils/validation.js';
import { getUserByEmail, ensureUserExists } from '$lib/server/supabase/services/users.service.js';
import type { PageServerLoad, Actions }     from './$types.js';


export const load: PageServerLoad = async ( { locals, url } ) => {
	const paramFamilyId = url.searchParams.get( 'familyId' );

	let family  : Family | null  = null;
	let members : FamilyMember[] = [];

	if ( paramFamilyId ) {
		family = await getFamilyById( paramFamilyId );
	} else if ( locals.user ) {
		family = await getFamilyForUser( locals.user.id, locals.user.email );
	}

	let currentUserRole : FamilyMemberRole = 'ADMIN';

	if ( family ) {
		try {
			members = await getFamilyMembers( family.id );
		} catch ( err ) {
			console.error( 'Error loading family members:', err );
		}

		if ( locals.user ) {
			const currentMember = members.find( ( m ) =>
				( m.user_id && m.user_id === locals.user?.id ) ||
				( locals.user?.email && m.email && m.email.toLowerCase() === locals.user.email.toLowerCase() )
			);

			if ( currentMember ) {
				currentUserRole = currentMember.role || ( currentMember.is_representative ? 'ADMIN' : 'VIEWER' );
			} else {
				currentUserRole = members.length === 0 ? 'ADMIN' : 'VIEWER';
			}
		}
	}

	return {
		family,
		members,
		currentUserRole,
		currentUser : locals.user ? {
			id    : locals.user.id,
			name  : locals.user.name || locals.user.email?.split( '@' )[ 0 ] || 'Usuario',
			email : locals.user.email || ''
		} : null
	};
};

export const actions: Actions = {
	saveFamily : async ( { request, locals } ) => {
		if ( !locals.user ) {
			return fail( 401, { error : 'Debes iniciar sesión.' } );
		}

		const sessionUser = locals.user;
		const formData    = await request.formData();
		const familyName  = ( formData.get( 'family_name' ) as string )?.trim();

		if ( !familyName ) {
			return fail( 400, { error : 'El nombre de la familia es obligatorio.' } );
		}

		try {
			const activeFamily = await getFamilyForUser( sessionUser.id, sessionUser.email );

			if ( activeFamily ) {
				await updateFamily( activeFamily.id, {
					family_name : familyName
				} );
				return { success : true, familyId : activeFamily.id };
			} else {
				// 1. Revisar si la familia ya existe por nombre
				let targetFamily = await getFamilyByName( familyName );

				if ( !targetFamily ) {
					const randomCode = Math.floor( 10000 + Math.random() * 90000 );
					targetFamily = await createFamily( {
						family_name : familyName,
						code        : randomCode
					} );
				}

				// 2. Resolver usuario en DB
				let dbUserId = sessionUser.id;
				if ( sessionUser.email ) {
					const dbUser = await ensureUserExists( {
						email : sessionUser.email,
						name  : sessionUser.name
					} );
					if ( dbUser?.id ) {
						dbUserId = dbUser.id;
					}
				}

				// 3. Revisar si ya tiene un miembro registrado en esta familia
				const existingMembers = await getFamilyMembers( targetFamily.id );
				const userMember = existingMembers.find( ( m ) =>
					( m.user_id && m.user_id === dbUserId ) ||
					( sessionUser.email && m.email && m.email.toLowerCase() === sessionUser.email.toLowerCase() )
				);

				if ( userMember ) {
					await updateFamilyMember( userMember.id, {
						role              : 'ADMIN',
						is_representative : true,
						user_id           : dbUserId
					} );
				} else {
					const tempRutNumber = Math.floor( 10000000 + Math.random() * 90000000 );
					await createFamilyMember( {
						family_id         : targetFamily.id,
						full_name         : sessionUser.name || sessionUser.email?.split( '@' )[ 0 ] || 'Representante',
						rut               : `TEMP-${ tempRutNumber }-K`,
						email             : sessionUser.email || null,
						phone             : null,
						organization      : 'NINGUNA',
						is_representative : true,
						role              : 'ADMIN',
						user_id           : dbUserId
					} );
				}

				return { success : true, familyId : targetFamily.id };
			}
		} catch ( err : any ) {
			if ( err.message?.includes( 'duplicate key' ) || err.message?.includes( 'unique constraint' ) ) {
				return fail( 400, { error : `Ya existe una familia registrada con el nombre "${ familyName }". Por favor ingresa un nombre diferente.` } );
			}
			return fail( 400, { error : err.message } );
		}
	},

	saveMember : async ( { request, locals } ) => {
		if ( !locals.user ) {
			return fail( 401, { error : 'Debes iniciar sesión.' } );
		}

		const sessionUser      = locals.user;
		const formData         = await request.formData();
		const familyIdFromForm = ( formData.get( 'family_id' ) as string )?.trim();

		let activeFamily = await getFamilyForUser( sessionUser.id, sessionUser.email );
		if ( !activeFamily && familyIdFromForm ) {
			activeFamily = await getFamilyById( familyIdFromForm );
		}

		if ( !activeFamily ) {
			return fail( 400, { error : 'Debes crear primero la familia antes de agregar integrantes.' } );
		}

		// Determinar rol del usuario actual en la familia
		const members = await getFamilyMembers( activeFamily.id );
		const currentMember = members.find( ( m ) =>
			( m.user_id && m.user_id === sessionUser.id ) ||
			( sessionUser.email && m.email && m.email.toLowerCase() === sessionUser.email.toLowerCase() )
		);
		const currentUserRole : FamilyMemberRole = currentMember?.role || ( ( members.length === 0 || currentMember?.is_representative ) ? 'ADMIN' : 'VIEWER' );

		const memberId = formData.get( 'member_id' ) as string;

		// Validación de permisos por rol
		if ( memberId && currentUserRole !== 'ADMIN' ) {
			return fail( 403, { error : 'No tienes permisos para editar miembros. Solo un Administrador puede modificar integrantes.' } );
		}

		if ( !memberId && currentUserRole !== 'ADMIN' && currentUserRole !== 'AGGREGATOR' ) {
			return fail( 403, { error : 'No tienes permisos para agregar nuevos miembros a la familia.' } );
		}

		const fullName         = ( formData.get( 'full_name' ) as string )?.trim();
		const rawRut           = ( formData.get( 'rut' ) as string )?.trim();
		const rawEmail         = ( formData.get( 'email' ) as string )?.trim().toLowerCase();
		const rawPhone         = ( formData.get( 'phone' ) as string )?.trim();
		const organization     = formData.get( 'organization' ) as CommunityOrganization;
		const isRepresentative = formData.get( 'is_representative' ) === 'true';
		const rawRole          = ( formData.get( 'role' ) as string )?.trim() as FamilyMemberRole;

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

		const cleanEmail = rawEmail || null;

		// Asignación de rol del miembro (solo ADMIN puede asignar rol distinto a VIEWER)
		const memberRole : FamilyMemberRole = ( currentUserRole === 'ADMIN' && ( rawRole === 'ADMIN' || rawRole === 'AGGREGATOR' || rawRole === 'VIEWER' ) )
			? rawRole
			: ( isRepresentative ? 'ADMIN' : 'VIEWER' );

		// Determinar si podemos asociar un user_id a este integrante
		let targetUserId : string | null = null;
		if ( cleanEmail ) {
			if ( sessionUser.email && cleanEmail.toLowerCase() === sessionUser.email.toLowerCase() ) {
				targetUserId = sessionUser.id;
			} else {
				try {
					const matchedUser = await getUserByEmail( cleanEmail );
					if ( matchedUser ) {
						targetUserId = matchedUser.id;
					}
				} catch ( err ) {
					console.error( 'Error finding user by email:', err );
				}
			}
		}

		try {
			if ( memberId ) {
				await updateFamilyMember( memberId, {
					full_name         : fullName,
					rut               : cleanRut,
					email             : cleanEmail,
					phone             : cleanPhone,
					organization      : organization || 'NINGUNA',
					is_representative : isRepresentative,
					role              : memberRole,
					...( targetUserId ? { user_id : targetUserId } : {} )
				} );
			} else {
				await createFamilyMember( {
					family_id         : activeFamily.id,
					full_name         : fullName,
					rut               : cleanRut,
					email             : cleanEmail,
					phone             : cleanPhone,
					organization      : organization || 'NINGUNA',
					is_representative : isRepresentative,
					role              : memberRole,
					user_id           : targetUserId
				} );
			}

			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	deleteMember : async ( { request, locals } ) => {
		if ( !locals.user ) {
			return fail( 401, { error : 'Debes iniciar sesión.' } );
		}

		const sessionUser  = locals.user;
		const activeFamily = await getFamilyForUser( sessionUser.id, sessionUser.email );
		if ( !activeFamily ) {
			return fail( 400, { error : 'No se encontró la familia activa.' } );
		}

		const members = await getFamilyMembers( activeFamily.id );
		const currentMember = members.find( ( m ) =>
			( m.user_id && m.user_id === sessionUser.id ) ||
			( sessionUser.email && m.email && m.email.toLowerCase() === sessionUser.email.toLowerCase() )
		);
		const currentUserRole : FamilyMemberRole = currentMember?.role || ( ( members.length === 0 || currentMember?.is_representative ) ? 'ADMIN' : 'VIEWER' );

		if ( currentUserRole !== 'ADMIN' ) {
			return fail( 403, { error : 'No tienes permisos para eliminar miembros. Solo un Administrador puede hacerlo.' } );
		}

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
