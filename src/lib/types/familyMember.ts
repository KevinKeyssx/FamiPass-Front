import type { Family } from './family.js';

export type CommunityOrganization =
	| 'CUORUM'
	| 'SOC_SOC'
	| 'HOMBRES_JOVENES'
	| 'MUJERES_JOVENES'
	| 'PRIMARIA'
	| 'FRIENDS'
	| 'NINGUNA';

export interface FamilyMember {
	id                  : string;
	family_id           : string;
	full_name           : string;
	rut                 : string;
	phone?              : string | null;
	organization        : CommunityOrganization;
	is_representative   : boolean;
	created_at?         : string;
	updated_at?         : string;
	family?             : Family;
}
