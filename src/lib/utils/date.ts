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

export function formatEventDate( dateStr: string | null | undefined, includeTime: boolean = false ): string {
	if ( !dateStr ) return '—';

	const isMidnight = dateStr.includes( 'T00:00:00' ) || !dateStr.includes( 'T' );

	if ( isMidnight ) {
		const cleanDate            = dateStr.split( 'T' )[ 0 ];
		const [ year, month, day ] = cleanDate.split( '-' ).map( Number );
		const d                    = new Date( year, month - 1, day, 12, 0, 0 );

		return d.toLocaleDateString( 'es-CL', {
			day   : 'numeric',
			month : 'short',
			year  : 'numeric'
		} );
	}

	const d = new Date( dateStr );
	if ( isNaN( d.getTime() ) ) return dateStr;

	const datePart = d.toLocaleDateString( 'es-CL', {
		day   : 'numeric',
		month : 'short',
		year  : 'numeric'
	} );

	if ( includeTime ) {
		const hours   = String( d.getHours() ).padStart( 2, '0' );
		const minutes = String( d.getMinutes() ).padStart( 2, '0' );
		return `${ datePart }, ${ hours }:${ minutes } hrs`;
	}

	return datePart;
}
