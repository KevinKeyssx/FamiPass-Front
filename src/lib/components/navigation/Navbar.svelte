<script lang="ts">
	import { goto }                                     from '$app/navigation';
	import { page }                                     from '$app/stores';
	import { authClient }                               from '$lib/auth/auth-client.js';
	import ThemeToggle                                  from '$lib/components/shared/ThemeToggle.svelte';
	import type { UserRole }                            from '$lib/types/index.js';
	import { LogOut, User as UserIcon, Shield, QrCode } from '@lucide/svelte';

	interface Props {
		user : {
			id?    : string;
			name?  : string | null;
			email? : string | null;
		} | null;
		role : UserRole;
	}

	let { user, role }: Props = $props();

	const isOperator = $derived( [ 'SUPER_ADMIN', 'ADMIN', 'STAFF' ].includes( role ) );
	const isOperatorRoute = $derived( $page.url.pathname.startsWith( '/operator' ) );

	let isLoggingOut = $state( false );

	async function handleLogout(): Promise<void> {
		isLoggingOut = true;
		try {
			await authClient.signOut();
			goto( '/login' );
		} catch ( err ) {
			console.error( 'Logout error:', err );
			window.location.href = '/login';
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<header class="sticky top-0 z-40 w-full glass border-b border-(--border)">
	<div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
		<!-- Brand Logo -->
		<a href="/" class="flex items-center gap-2.5 group select-none">
			<div class="w-10 h-10 rounded-xl bg-(--accent) flex items-center justify-center shadow-(--shadow-glow) transition-transform group-hover:scale-105">
				<span class="text-(--accent-text) font-black text-xl font-mono">F</span>
			</div>
			<div class="flex flex-col">
				<span class="font-extrabold text-base tracking-tight text-(--text-primary)">
					FamiPass
				</span>
				<span class="text-[10px] text-(--text-muted) font-medium">
					{isOperator ? ( isOperatorRoute ? 'Portal Operador' : 'Portal Familiar' ) : 'Portal Familiar'}
				</span>
			</div>
		</a>

		<!-- Actions -->
		<div class="flex items-center gap-2 sm:gap-3">
			<!-- Operator View Switcher (Desktop/Tablet) -->
			{#if isOperator}
				{#if isOperatorRoute}
					<a
						href="/family"
						class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) border border-(--border) transition-all duration-200"
					>
						<UserIcon size={14} />
						<span>Ver como Familiar</span>
					</a>
				{:else}
					<a
						href="/operator/scan"
						class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-(--accent)/10 text-(--accent) hover:bg-(--accent)/20 border border-(--accent)/30 transition-all duration-200"
					>
						<QrCode size={14} />
						<span>Ir al Escáner Operador</span>
					</a>
				{/if}
			{/if}

			<!-- Role badge -->
			<div class="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border {isOperator ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-(--accent-muted) text-(--accent) border-(--accent)/30'}">
				{#if isOperator}
					<Shield size={12} />
					<span>Operador</span>
				{:else}
					<UserIcon size={12} />
					<span>Familiar</span>
				{/if}
			</div>

			<!-- Theme Toggle -->
			<ThemeToggle />

			<!-- Logout Button -->
			<button
				type="button"
				onclick={handleLogout}
				disabled={isLoggingOut}
				class="p-2.5 rounded-xl text-(--text-secondary) hover:text-red-500 hover:bg-red-500/10 border border-(--border) transition-all duration-200 cursor-pointer select-none active:scale-90 disabled:opacity-50"
				title="Cerrar Sesión"
				aria-label="Cerrar sesión"
			>
				<LogOut size={18} />
			</button>
		</div>
	</div>
</header>
