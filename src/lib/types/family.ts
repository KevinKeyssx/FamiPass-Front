import type { FamilyMember } from './familyMember.js';
import type { EventConfig }  from './event.js';
import type { Order }        from './order.js';

export interface Family {
	id             : string;
	family_name    : string;
	code           : number;
	created_at?    : string;
	updated_at?    : string;
	members?       : FamilyMember[];
	members_count? : number;
}

export interface FamilyEvent {
	id           : string;
	family_id    : string;
	event_id     : string;
	qr_code_hash : string;
	short_code?  : string;
	created_at?  : string;
	updated_at?  : string;
	family?      : Family;
	event?       : EventConfig;
	orders?      : Order[];
}
