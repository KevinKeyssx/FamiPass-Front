<script lang="ts">
	import { page }        from '$app/stores';
	import { theme }       from '$lib/stores/theme.svelte.js';
	import { Sun, Moon }   from '@lucide/svelte';
	import { authClient }  from '$lib/auth/auth-client.js';

	let loading  = $state( false );
	let errorMsg = $state<string | null>( null );

	const errorParam = $derived( $page.url.searchParams.get( 'error' ) );
	const errorMap   : Record<string, string> = {
		unauthorized : 'No tienes permisos de Operador para acceder a esa sección.'
	};

	async function handleGoogleLogin(): Promise<void> {
		loading  = true;
		errorMsg = null;
		try {
			await authClient.signIn.social( {
				provider    : 'google',
				callbackURL : '/'
			} );
		} catch {
			errorMsg = 'Error al iniciar sesión. Intenta de nuevo.';
			loading  = false;
		}
	}
</script>

<svelte:head>
	<title>Iniciar Sesión — FamiPass</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen p-4 bg-(--bg-base) relative overflow-hidden">
	<!-- Decorative blobs -->
	<div class="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl bg-(--accent) pointer-events-none"></div>
	<div class="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full opacity-15 blur-3xl bg-(--accent) pointer-events-none"></div>

	<!-- Theme toggle -->
	<button
		type="button"
		onclick={() => theme.toggle()}
		class="absolute top-4 right-4 p-2.5 rounded-xl text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-all duration-200 border border-(--border) cursor-pointer select-none"
		aria-label={theme.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
	>
		{#if theme.isDark}
			<Sun size={20} />
		{:else}
			<Moon size={20} />
		{/if}
	</button>

	<!-- Card -->
	<div class="w-full max-w-md p-8 sm:p-10 card relative z-10">
		<!-- Logo & Title -->
		<div class="flex flex-col items-center mb-8 text-center">
			<div class="w-16 h-16 rounded-2xl bg-(--accent) flex items-center justify-center mb-4 shadow-(--shadow-glow)">
				<span class="text-(--accent-text) font-black text-3xl font-mono">F</span>
			</div>
			<h1 class="text-2xl font-extrabold text-(--text-primary) tracking-tight">
				FamiPass
			</h1>
			<p class="text-(--text-secondary) mt-1.5 text-sm">
				Gestión de familiares y entrega de raciones
			</p>
		</div>

		<!-- Error from URL param -->
		{#if errorParam && errorMap[ errorParam ]}
			<div class="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
				{errorMap[ errorParam ]}
			</div>
		{/if}

		<!-- Error from state -->
		{#if errorMsg}
			<div class="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
				{errorMsg}
			</div>
		{/if}

		<!-- Google login button -->
		<button
			type="button"
			onclick={handleGoogleLogin}
			disabled={loading}
			class="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium text-sm
                bg-(--bg-surface-2) border border-(--border) text-(--text-primary)
                hover:border-(--accent) hover:shadow-(--shadow-md) transition-all duration-200
                active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
		>
			{#if loading}
				<span class="w-5 h-5 border-2 border-(--accent) border-t-transparent rounded-full animate-spin"></span>
				<span>Conectando...</span>
			{:else}
				<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				<span>Continuar con Google</span>
			{/if}
		</button>

		<p class="mt-6 text-center text-xs text-(--text-muted) leading-relaxed">
			Al iniciar sesión, podrás crear o gestionar a tus familiares, así como escanear códigos de entrega si eres operador.
		</p>
	</div>
</div>
