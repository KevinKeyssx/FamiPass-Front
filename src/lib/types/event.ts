export type EventStatus = 'DRAFT' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export interface EventConfig {
	id                         : string;
	event_name                 : string;
	event_date                 : string;
	registration_deadline      : string;
	expires_at?                : string | null;
	detect_by_minors           : boolean;
	status                     : EventStatus;
	max_family_members?        : number | null;
	max_guests_per_family?     : number | null;
	require_guest_verification : boolean;
	created_at?                : string;
	updated_at?                : string;
	family_events?             : any[];
}
