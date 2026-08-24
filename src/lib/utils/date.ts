export function isEventExpired( expiresAt: string | null | undefined ): boolean {
	if ( !expiresAt ) {
		return false;
	}

	const now   = new Date();
	const year  = now.getFullYear();
	const month = String( now.getMonth() + 1 ).padStart( 2, '0' );
	const day   = String( now.getDate() ).padStart( 2, '0' );
	const today = `${ year }-${ month }-${ day }`;

	return today > expiresAt;
}

export function formatDate( dateStr: string ): string {
	if ( !dateStr ) return '—';
	return new Date( dateStr ).toLocaleDateString( 'es-CL', {
		day   : 'numeric',
		month : 'short',
		year  : 'numeric'
	} );
}

export function formatDateTime( dateStr: string ): string {
	if ( !dateStr ) return '—';
	return new Date( dateStr ).toLocaleDateString( 'es-CL', {
		day    : '2-digit',
		month  : 'short',
		year   : 'numeric',
		hour   : '2-digit',
		minute : '2-digit'
	} );
}
