import type { CommunityOrganization } from './familyMember.js';
import type { FamilyEvent }           from './family.js';
import type { EventConfig }           from './event.js';
import type { User }                  from './user.js';
import type { Product }               from './product.js';

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface FamilyMemberSnapshot {
	rut               : string;
	full_name         : string;
	organization      : CommunityOrganization;
	is_representative : boolean;
}

export interface OrderItem {
	id               : string;
	order_id         : string;
	product_id       : string;
	quantity_claimed : number;
	is_minor_portion : boolean;
	product?         : Product;
}

export interface Order {
	id                  : string;
	event_id            : string;
	family_event_id     : string;
	scanned_by_user_id? : string | null;
	status              : OrderStatus;
	family_members?     : FamilyMemberSnapshot[] | null;
	created_at          : string;
	event?              : EventConfig;
	family_event?       : FamilyEvent;
	scanned_by_user?    : User;
	items?              : OrderItem[];
}
