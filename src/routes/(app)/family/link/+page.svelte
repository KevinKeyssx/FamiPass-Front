<script lang="ts">
    import { enhance } from '$app/forms';

	import {
        Search,
        ArrowRight,
        Hash,
        UserCheck,
        CircleAlert
    }               from '@lucide/svelte';
    import toast    from 'svelte-french-toast';

    import Button       from '$lib/components/ui/Button.svelte';
	import ButtonBack   from '$lib/components/ui/ButtonBack.svelte';
	import InputText    from '$lib/components/ui/InputText.svelte';
	import PinInput     from '$lib/components/ui/PinInput.svelte';


    interface Props {
		form? : {
			error? : string;
		} | null;
	}


    let { form = null }: Props = $props();


    let codeValue   = $state( '' );
	let rutValue    = $state( '' );
	let activeTab   = $state<'code' | 'rut'>( 'code' );
	let isSearching = $state( false );
	let codeFormRef = $state<HTMLFormElement | null>( null );


    $effect( () => {
		if ( form?.error ) {
			toast.error( form.error, { duration : 4000 } );
		}
	});
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
					Asocia tu cuenta a una familia existente
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

	{#if form?.error}
		<div class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2 animate-in fade-in">
			<CircleAlert size={16} class="shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if activeTab === 'code'}
		<!-- Search by 5-digit code -->
		<div class="card p-6 space-y-6">
			<div class="space-y-1 text-center">
				<h2 class="text-base font-bold text-(--text-primary)">
					Ingresa el Código Familiar
				</h2>
				<p class="text-xs text-(--text-muted)">
					El código de 5 dígitos generado al registrar la familia (ej: 36053).
				</p>
			</div>

			<form
				bind:this={codeFormRef}
				method="POST"
				action="?/linkByCode"
				use:enhance={() => {
					isSearching = true;
					return async ( { result, update } ) => {
						isSearching = false;
						if ( result.type === 'failure' ) {
							const errorMsg = ( result.data as any )?.error || 'No se encontró la familia con ese código.';
							toast.error( errorMsg, { duration : 4500 } );
						}
						await update();
					};
				}}
				class="space-y-6"
			>
				<input type="hidden" name="code" value={codeValue} />

				<PinInput
					bind:value={codeValue}
					length={5}
					pattern="^[0-9]+$"
					disabled={isSearching}
					onComplete={() => {
						if ( codeFormRef ) codeFormRef.requestSubmit();
					}}
				/>

				<Button
					type="submit"
					variant="primary"
					size="lg"
					class="w-full"
					loading={isSearching}
					disabled={codeValue.length !== 5 || isSearching}
				>
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
					return async ( { result, update } ) => {
						isSearching = false;
						if ( result.type === 'failure' ) {
							const errorMsg = ( result.data as any )?.error || 'No se encontró ninguna familia asociada a ese RUT.';
							toast.error( errorMsg, { duration : 4500 } );
						}
						await update();
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

				<Button
					type="submit"
					variant="primary"
					size="lg"
					class="w-full"
					loading={isSearching}
					disabled={!rutValue.trim() || isSearching}
				>
					<span>Buscar y Vincular</span>
					<Search size={18} />
				</Button>
			</form>
		</div>
	{/if}
</div>
