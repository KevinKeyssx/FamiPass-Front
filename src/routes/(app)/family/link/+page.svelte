<script lang="ts">
	import Button     from '$lib/components/ui/Button.svelte';
	import ButtonBack from '$lib/components/ui/ButtonBack.svelte';
	import InputText  from '$lib/components/ui/InputText.svelte';
	import { Link2, Search, ArrowRight, Hash, UserCheck } from '@lucide/svelte';
	import { enhance } from '$app/forms';

	let codeValue   = $state( '' );
	let rutValue    = $state( '' );
	let activeTab   = $state<'code' | 'rut'>( 'code' );
	let isSearching = $state( false );
</script>

<svelte:head>
	<title>Vincular Familia — FamiPass</title>
</svelte:head>

<div class="max-w-md mx-auto space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3 relative z-10">
			<ButtonBack href="/family" />
			<div>
				<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
					Vincular Familia
				</h1>
				<p class="text-xs text-(--text-secondary)">
					Asocia tu dispositivo a una familia existente
				</p>
			</div>
		</div>
	</div>

	<!-- Method Selector Tabs -->
	<div class="flex p-1 rounded-2xl bg-(--bg-surface-2) border border-(--border)">
		<button
			type="button"
			onclick={() => { activeTab = 'code'; }}
			class="flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer {activeTab === 'code' ? 'bg-(--accent) text-(--accent-text) shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary)'}"
		>
			<Hash size={14} />
			<span>Por Código</span>
		</button>

		<button
			type="button"
			onclick={() => { activeTab = 'rut'; }}
			class="flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer {activeTab === 'rut' ? 'bg-(--accent) text-(--accent-text) shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary)'}"
		>
			<UserCheck size={14} />
			<span>Por RUT Integrante</span>
		</button>
	</div>

	{#if activeTab === 'code'}
		<!-- Search by 5-digit code -->
		<div class="card p-6 space-y-5">
			<div class="space-y-1">
				<h2 class="text-base font-bold text-(--text-primary)">
					Ingresa el Código Familiar
				</h2>
				<p class="text-xs text-(--text-muted)">
					El código de 5 dígitos generado al registrar la familia (ej: 36053).
				</p>
			</div>

			<form
				method="POST"
				action="?/linkByCode"
				use:enhance={() => {
					isSearching = true;
					return async ( { update } ) => {
						await update();
						isSearching = false;
					};
				}}
				class="space-y-4"
			>
				<InputText
					id="code"
					name="code"
					placeholder="Ej: 36053"
					bind:value={codeValue}
					required
				/>

				<Button type="submit" variant="primary" size="lg" class="w-full" loading={isSearching} disabled={!codeValue.trim()}>
					<span>Vincular Familia</span>
					<ArrowRight size={18} />
				</Button>
			</form>
		</div>
	{:else}
		<!-- Search by RUT -->
		<div class="card p-6 space-y-5">
			<div class="space-y-1">
				<h2 class="text-base font-bold text-(--text-primary)">
					Buscar por RUT de un Integrante
				</h2>
				<p class="text-xs text-(--text-muted)">
					Ingresa el RUT de cualquier miembro perteneciente a la familia.
				</p>
			</div>

			<form
				method="POST"
				action="?/linkByRut"
				use:enhance={() => {
					isSearching = true;
					return async ( { update } ) => {
						await update();
						isSearching = false;
					};
				}}
				class="space-y-4"
			>
				<InputText
					id="rut"
					name="rut"
					placeholder="Ej: 12345678-9"
					bind:value={rutValue}
					required
				/>

				<Button type="submit" variant="primary" size="lg" class="w-full" loading={isSearching} disabled={!rutValue.trim()}>
					<span>Buscar y Vincular</span>
					<Search size={18} />
				</Button>
			</form>
		</div>
	{/if}
</div>
