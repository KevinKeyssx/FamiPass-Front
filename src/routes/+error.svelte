<script lang="ts">
	import { page }                 from '$app/stores';
	import Navbar                   from '$lib/components/navigation/Navbar.svelte';
	import ThemeToggle              from '$lib/components/shared/ThemeToggle.svelte';
	import Button                   from '$lib/components/ui/Button.svelte';
	import type { UserRole }        from '$lib/types/index.js';
	import { Compass, Home, ArrowLeft } from '@lucide/svelte';

	interface UserData {
		id?        : string;
		name?      : string | null;
		user_name? : string | null;
		email?     : string | null;
		image?     : string | null;
	}

	const status  = $derived( $page.status );
	const message = $derived( $page.error?.message );

	const user = $derived( ( $page.data?.user as UserData | null ) ?? null );
	const role = $derived( ( $page.data?.role as UserRole ) ?? 'MEMBER' );

	function handleGoBack(): void {
		if ( typeof window !== 'undefined' && window.history.length > 1 ) {
			window.history.back();
		} else {
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<title>{status === 404 ? '404 - Página no encontrada' : `Error ${status}`} — FamiPass</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-(--bg-base) text-(--text-primary) relative overflow-hidden select-none">
	<!-- Header de navegación cuando el usuario tiene sesión o barra superior -->
	{#if user}
		<Navbar {user} {role} />
	{:else}
		<header class="sticky top-0 z-40 w-full glass border-b border-(--border)">
			<div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
				<a href="/" class="flex items-center gap-2.5 group select-none">
					<img
						src="/logo/logo_small.avif"
						alt="FamiPass Logo"
						class="w-10 h-10 object-contain transition-transform group-hover:scale-105"
					/>
					<div class="flex flex-col">
						<span class="font-extrabold text-base tracking-tight text-(--text-primary)">
							FamiPass
						</span>
						<span class="text-[10px] text-(--text-muted) font-medium">
							Portal de Acceso
						</span>
					</div>
				</a>

				<div class="flex items-center gap-2">
					<ThemeToggle />
				</div>
			</div>
		</header>
	{/if}

	<!-- Luces y resplandor ambiental de fondo -->
	<div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 sm:w-130 h-96 sm:h-130 rounded-full bg-(--accent) opacity-15 dark:opacity-20 blur-3xl pointer-events-none animate-glow-slow"></div>
	<div class="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-calypso-500 opacity-10 blur-3xl pointer-events-none animate-glow-medium"></div>

	<!-- Contenido principal -->
	<main class="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
		<div class="w-full max-w-lg card p-8 sm:p-12 text-center border border-(--border) relative backdrop-blur-md">
			<!-- Indicador e Ícono -->
			<div class="flex flex-col items-center mb-6">
				<div class="relative flex items-center justify-center mb-4">
					<div class="w-20 h-20 rounded-2xl bg-(--accent)/10 border border-(--accent)/30 flex items-center justify-center text-(--accent) shadow-(--shadow-glow)">
						<Compass size={40} class="animate-pulse" />
					</div>
				</div>

				<!-- 404 Estilizado con gradiente vibrante -->
				<div class="relative">
					<span class="text-7xl sm:text-8xl font-black font-mono tracking-tight bg-linear-to-r from-calypso-400 via-(--accent) to-gold-400 bg-clip-text text-transparent drop-shadow-sm">
						{status || 404}
					</span>
				</div>

				<h1 class="text-2xl sm:text-3xl font-extrabold text-(--text-primary) tracking-tight mt-2">
					{status === 404 ? 'Página no encontrada' : 'Ocurrió un error inesperado'}
				</h1>

				<p class="text-sm sm:text-base text-(--text-secondary) mt-3 max-w-sm">
					{#if status === 404}
						La página que intentas consultar no existe o ha sido movida a otra ubicación.
					{:else}
						{message || 'Ha ocurrido un error al procesar tu solicitud.'}
					{/if}
				</p>
			</div>

			<!-- Acciones de Navegación -->
			<div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 border-t border-(--border)">
				<Button
					variant = "secondary"
					size    = "md"
					class   = "w-full sm:w-auto"
					onclick = { handleGoBack }
				>
					<ArrowLeft size={16} />
					<span>Regresar</span>
				</Button>

				<a href="/" class="w-full sm:w-auto">
					<Button
						variant = "primary"
						size    = "md"
						class   = "w-full sm:w-auto"
					>
						<Home size={16} />
						<span>Ir al inicio</span>
					</Button>
				</a>
			</div>
		</div>
	</main>
</div>
