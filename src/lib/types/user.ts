export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'MEMBER';

export interface User {
	id          : string;
	email       : string;
	user_name?  : string | null;
	phone?      : string | null;
	role        : UserRole;
	is_active   : boolean;
	created_at? : string;
	updated_at? : string;
}
