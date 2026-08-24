export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'MEMBER';

export interface User {
	id          : string;
	full_name   : string;
	user_name?  : string | null;
	email       : string;
	phone?      : string | null;
	role        : UserRole;
	is_active   : boolean;
	created_at? : string;
	updated_at? : string;
}
