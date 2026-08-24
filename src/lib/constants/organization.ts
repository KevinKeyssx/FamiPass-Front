export const orgOptions = [
	{ value : 'NINGUNA',         label : 'Ninguna' },
	{ value : 'CUORUM',          label : 'Cuórum' },
	{ value : 'SOC_SOC',         label : 'Soc. Socorro' },
	{ value : 'HOMBRES_JOVENES', label : 'Hombres Jóvenes' },
	{ value : 'MUJERES_JOVENES', label : 'Mujeres Jóvenes' },
	{ value : 'PRIMARIA',        label : 'Primaria' },
	{ value : 'FRIENDS',         label : 'Amigos' }
];

export function getOrgLabel( org : string ): string {
	switch ( org ) {
		case 'CUORUM':
			return 'Cuórum';
		case 'SOC_SOC':
			return 'Soc. Socorro';
		case 'HOMBRES_JOVENES':
			return 'Hombres Jóvenes';
		case 'MUJERES_JOVENES':
			return 'Mujeres Jóvenes';
		case 'PRIMARIA':
			return 'Primaria';
		case 'FRIENDS':
			return 'Amigos';
		case 'NINGUNA':
		default:
			return 'Ninguna';
	}
}
