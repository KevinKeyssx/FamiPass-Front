<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

    import {
        LogOut,
        User as UserIcon,
        Shield,
        QrCode,
        Sun,
        Moon,
        ChevronDown
    }                       from '@lucide/svelte';
	import { DropdownMenu } from 'bits-ui';

    import { authClient }       from '$lib/auth/auth-client.js';
	import ThemeToggle          from '$lib/components/shared/ThemeToggle.svelte';
	import type { UserRole }    from '$lib/types/index.js';
	import { theme }            from '$lib/stores/theme.svelte.js';


    interface Props {
		user : {
			id?        : string;
			name?      : string | null;
			user_name? : string | null;
			email?     : string | null;
			image?     : string | null;
		} | null;
		role : UserRole;
	}


    let { user, role }: Props = $props();


    const isOperator      = $derived( [ 'SUPER_ADMIN', 'ADMIN', 'STAFF' ].includes( role ) );
	const isOperatorRoute = $derived( page.url.pathname.startsWith( '/operator' ) );
	const displayName     = $derived( user?.name || user?.user_name || user?.email?.split( '@' )[ 0 ] || 'Usuario' );
	const initials        = $derived(
		displayName
			.split( ' ' )
			.filter( Boolean )
			.map( ( part ) => part[ 0 ] )
			.slice( 0, 2 )
			.join( '' )
			.toUpperCase() || 'U'
	);


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
					{ isOperator
                        ? ( isOperatorRoute
                            ? 'Portal Operador'
                            : 'Portal Familiar' )
                        : 'Portal Familiar'
                    }
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

			<!-- User Profile Card & Dropdown Menu -->
			{#if user}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="group flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-(--bg-surface-2) hover:bg-(--accent-muted)/50 border border-(--border) hover:border-(--accent)/40 transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-(--accent)">
						<div class="relative">
							{#if user.image}
								<img
									src={user.image}
									alt={displayName}
									class="w-8 h-8 rounded-xl object-cover border border-(--border) shadow-xs group-hover:scale-105 transition-transform"
									referrerpolicy="no-referrer"
								/>
							{:else}
								<div class="w-8 h-8 rounded-xl bg-(--accent) text-(--accent-text) flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
									{initials}
								</div>
							{/if}
							<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-(--bg-surface-2) {isOperator ? 'bg-amber-500' : 'bg-emerald-500'}"></div>
						</div>

						<div class="hidden sm:flex flex-col text-left">
							<span class="text-xs font-bold text-(--text-primary) leading-snug max-w-32 truncate group-hover:text-(--accent) transition-colors" title={displayName}>
								{displayName}
							</span>

							<span class="text-[10px] text-(--text-muted) leading-none truncate max-w-32" title={user.email || ''}>
								{isOperator ? 'Operador' : 'Familiar'}
							</span>
						</div>

						<ChevronDown size={14} class="text-(--text-muted) group-hover:text-(--accent) transition-transform duration-200 group-data-[state=open]:rotate-180" />
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content
							sideOffset={8}
							align="end"
							class="z-50 min-w-64 p-2 rounded-2xl bg-(--bg-surface) border border-(--border) shadow-lg backdrop-blur-xl animate-in fade-in-0 zoom-in-95"
						>
							<!-- Header Card Info en Menú -->
							<div class="p-3 mb-1.5 rounded-xl bg-(--bg-surface-2) border border-(--border)/60 flex items-center gap-3">
								{#if user.image}
									<img
										src             = { user.image }
										alt             = { displayName }
										class           = "w-10 h-10 rounded-xl object-cover border border-(--border) shadow-xs"
										referrerpolicy  = "no-referrer"
									/>
								{:else}
									<div class="w-10 h-10 rounded-xl bg-(--accent) text-(--accent-text) flex items-center justify-center font-extrabold text-sm shadow-xs">
										{ initials }
									</div>
								{/if}

								<div class="flex flex-col min-w-0 flex-1">
									<span class="text-sm font-bold text-(--text-primary) truncate" title={displayName}>
										{ displayName }
									</span>

									{#if user.email}
										<span class="text-xs text-(--text-secondary) font-medium truncate" title={user.email}>
											{user.email}
										</span>
									{/if}

									<div class="mt-1.5 flex items-center gap-1.5">
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border {isOperator ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-(--accent-muted) text-(--accent) border-(--accent)/30'}">
											{#if isOperator}
												<Shield size={10} />
												<span>Operador</span>
											{:else}
												<UserIcon size={10} />
												<span>Familiar</span>
											{/if}
										</span>
									</div>
								</div>
							</div>

							<DropdownMenu.Separator class="h-px bg-(--border) my-1" />

							<!-- Acciones del menú (Opciones móviles/escritorio) -->
							{#if isOperator}
								<DropdownMenu.Item class="sm:hidden outline-none">
									{#if isOperatorRoute}
										<a
											href="/family"
											class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-colors cursor-pointer"
										>
											<UserIcon size={16} />
											<span>Ver como Familiar</span>
										</a>
									{:else}
										<a
											href="/operator/scan"
											class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-(--accent) bg-(--accent)/10 hover:bg-(--accent)/20 transition-colors cursor-pointer"
										>
											<QrCode size={16} />
											<span>Ir al Escáner Operador</span>
										</a>
									{/if}
								</DropdownMenu.Item>
							{/if}

							<!-- Alternar Tema dentro del Dropdown (Especialmente cómodo en móvil) -->
							<DropdownMenu.Item
								onclick={() => theme.toggle()}
								class="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-colors cursor-pointer outline-none"
							>
								<div class="flex items-center gap-2.5">
									{#if theme.isDark}
										<Sun size={16} />
										<span>Modo Claro</span>
									{:else}
										<Moon size={16} />
										<span>Modo Oscuro</span>
									{/if}
								</div>

                                <span class="text-[10px] text-(--text-muted) font-mono">
									{theme.isDark ? 'Dark' : 'Light'}
								</span>
							</DropdownMenu.Item>

							<DropdownMenu.Separator class="h-px bg-(--border) my-1" />

							<!-- Cerrar Sesión -->
							<DropdownMenu.Item
								onclick     = { handleLogout }
								disabled    = { isLoggingOut }
								class       = "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer outline-none disabled:opacity-50"
							>
								<LogOut size={16} />
								<span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			{/if}

			<!-- Role badge (Desktop) -->
			<div class="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border {isOperator ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-(--accent-muted) text-(--accent) border-(--accent)/30'}">
				{#if isOperator}
					<Shield size={12} />
					<span>Operador</span>
				{:else}
					<UserIcon size={12} />
					<span>Familiar</span>
				{/if}
			</div>

			<!-- Theme Toggle (Desktop) -->
			<div class="hidden sm:block">
				<ThemeToggle />
			</div>

			<!-- Logout Button (Desktop) -->
			<button
				type        = "button"
				onclick     = { handleLogout }
				disabled    = { isLoggingOut }
				class       = "hidden sm:flex p-2.5 rounded-xl text-(--text-secondary) hover:text-red-500 hover:bg-red-500/10 border border-(--border) transition-all duration-200 cursor-pointer select-none active:scale-90 disabled:opacity-50"
				title       = "Cerrar Sesión"
				aria-label  = "Cerrar sesión"
			>
				<LogOut size={18} />
			</button>
		</div>
	</div>
</header>

