const THEME_KEY = 'famipass-theme';
type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
	if ( typeof window === 'undefined' ) return 'light';
	const stored = localStorage.getItem( THEME_KEY ) as Theme | null;
	return stored ?? 'light';
}

function applyTheme( theme: Theme ): void {
	if ( typeof document === 'undefined' ) return;
	const html = document.documentElement;
	html.classList.remove( 'light', 'dark' );
	html.classList.add( theme );
}

function createThemeStore() {
	let current = $state<Theme>( 'light' );

	function init(): void {
		current = getInitialTheme();
		applyTheme( current );
	}

	function toggle(): void {
		current = current === 'light' ? 'dark' : 'light';
		applyTheme( current );
		localStorage.setItem( THEME_KEY, current );
	}

	function set( theme: Theme ): void {
		current = theme;
		applyTheme( current );
		localStorage.setItem( THEME_KEY, current );
	}

	return {
		get current() { return current; },
		get isDark()  { return current === 'dark'; },
		init,
		toggle,
		set
	};
}

export const theme = createThemeStore();
