export function validateRut( rut: string ): boolean {
	if ( !rut || typeof rut !== 'string' ) {
		return false;
	}

	const cleanRut = rut.replace( /[^0-9kK]/g, '' );

	if ( cleanRut.length < 7 || cleanRut.length > 9 ) {
		return false;
	}

	const body = cleanRut.slice( 0, -1 );
	const dv   = cleanRut.slice( -1 ).toLowerCase();

	if ( !/^\d+$/.test( body ) ) {
		return false;
	}

	let sum        = 0;
	let multiplier = 2;

	for ( let i = body.length - 1; i >= 0; i-- ) {
		sum += Number( body[ i ] ) * multiplier;
		multiplier = multiplier === 7 ? 2 : multiplier + 1;
	}

	const dvr        = 11 - ( sum % 11 );
	let expectedDv = '';

	if ( dvr === 11 ) {
		expectedDv = '0';
	} else if ( dvr === 10 ) {
		expectedDv = 'k';
	} else {
		expectedDv = String( dvr );
	}

	return dv === expectedDv;
}

export function formatRut( rut: string ): string {
	if ( !rut ) {
		return '';
	}

	const clean = rut.replace( /[^0-9kK]/g, '' );

	if ( clean.length < 2 ) {
		return rut;
	}

	const body = clean.slice( 0, -1 );
	const dv   = clean.slice( -1 ).toUpperCase();

	if ( !/^\d+$/.test( body ) ) {
		return clean;
	}

	const formattedBody = new Intl.NumberFormat( 'es-CL' ).format( Number( body ) );

	return `${ formattedBody }-${ dv }`;
}

export function validatePhone( phone: string ): boolean {
	if ( !phone ) {
		return false;
	}

	const cleanPhone = phone.replace( /\D/g, '' );
	let numberOnly   = cleanPhone;

	if ( cleanPhone.startsWith( '56' ) && cleanPhone.length === 11 ) {
		numberOnly = cleanPhone.slice( 2 );
	}

	return /^[9]\d{8}$/.test( numberOnly );
}

export function formatPhone( phone: string ): string {
	if ( !phone ) {
		return '';
	}

	const cleanPhone = phone.replace( /\D/g, '' );
	let numberOnly   = cleanPhone;

	if ( cleanPhone.startsWith( '56' ) && cleanPhone.length === 11 ) {
		numberOnly = cleanPhone.slice( 2 );
	}

	return `+56${ numberOnly }`;
}
