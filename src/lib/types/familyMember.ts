import type { Family } from './family.js';
import type { User }   from './user.js';

export type CommunityOrganization =
	| 'CUORUM'
	| 'SOC_SOC'
	| 'HOMBRES_JOVENES'
	| 'MUJERES_JOVENES'
	| 'PRIMARIA'
	| 'FRIENDS'
	| 'NINGUNA';

export type FamilyMemberRole = 'VIEWER' | 'AGGREGATOR' | 'ADMIN';

export interface FamilyMember {
	id                : string;
	family_id         : string;
	user_id?          : string | null;
	full_name         : string;
	rut               : string;
	email?            : string | null;
	phone?            : string | null;
	organization      : CommunityOrganization;
	is_representative : boolean;
	role              : FamilyMemberRole;
	created_at?       : string;
	updated_at?       : string;
	family?           : Family;
	user?             : User;
}
