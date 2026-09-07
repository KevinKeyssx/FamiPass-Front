<script lang="ts">
    import { Check, X, Plus, Loader } from '@lucide/svelte';

    import type {
        CommunityOrganization,
        FamilyMemberRole
    }                       from '$lib/types/index.js';
    import {
		validateRut,
		validatePhone,
		formatPhone
	}                       from '$lib/utils/validation.js';
	import { orgOptions }   from '$lib/constants/organization.js';
	import InputText         from '$lib/components/ui/InputText.svelte';
	import Select            from '$lib/components/ui/Select.svelte';
	import { Checkbox }      from 'bits-ui';


    const roleOptions = [
		{
			value : 'VIEWER',
			label : 'Lector'
		},
		{
			value : 'AGGREGATOR',
			label : 'Agregador'
		},
		{
			value : 'ADMIN',
			label : 'Admin'
		}
	];


    interface Props {
		currentUserRole? : FamilyMemberRole;
		onSubmit         : ( data : {
			full_name         : string;
			rut               : string;
			email?            : string;
			phone             : string;
			organization      : CommunityOrganization;
			is_representative : boolean;
			role              : FamilyMemberRole;
		} ) => Promise<boolean>;
		isSaving?        : boolean;
	}


    let {
		currentUserRole = 'ADMIN',
		onSubmit,
		isSaving = false
	}: Props = $props();

	let full_name         = $state( '' );
	let rut               = $state( '' );
	let email             = $state( '' );
	let phone             = $state( '' );
	let organization      = $state<CommunityOrganization>( 'NINGUNA' );
	let role              = $state<FamilyMemberRole>( 'VIEWER' );
	let is_representative = $state( false );

	let errors = $state<Record<string, string | null>>( {
		full_name : null,
		rut       : null,
		email     : null,
		phone     : null
	});


    async function handleSubmit( e : SubmitEvent ): Promise<void> {
		e.preventDefault();

		errors = {
			full_name : null,
			rut       : null,
			email     : null,
			phone     : null
		};

		let hasError = false;

		if ( !full_name.trim() ) {
			errors.full_name = 'Requerido';
			hasError = true;
		}

		if ( !rut.trim() ) {
			errors.rut = 'Requerido';
			hasError = true;
		} else if ( !validateRut( rut ) ) {
			errors.rut = 'Inválido';
			hasError = true;
		}

		if ( email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email.trim() ) ) {
			errors.email = 'Inválido';
			hasError = true;
		}

		if ( phone.trim() && !validatePhone( phone ) ) {
			errors.phone = '9 dígitos';
			hasError = true;
		}

		if ( hasError ) return;

		const success = await onSubmit( {
			full_name         : full_name.trim(),
			rut               : rut.trim(),
			email             : email.trim() || undefined,
			phone             : phone.trim() ? formatPhone( phone ) : '',
			organization      : organization,
			is_representative : is_representative,
			role              : is_representative ? 'ADMIN' : role
		} );

		if ( success ) {
			handleClear();
		}
	}

	function handleClear(): void {
		full_name         = '';
		rut               = '';
		email             = '';
		phone             = '';
		organization      = 'NINGUNA';
		role              = 'VIEWER';
		is_representative = false;
		errors            = {
			full_name : null,
			rut       : null,
			email     : null,
			phone     : null
		};
	}
</script>

<tr class="bg-(--bg-surface-2)/30 hover:bg-(--bg-surface-2)/50 transition-colors">
	<td class="px-3 py-2.5 text-(--text-primary) font-semibold">
		<InputText
			placeholder="Ej: Juan Pérez"
			bind:value={full_name}
			error={errors.full_name}
			disabled={isSaving}
			size="small"
		/>
	</td>

	<td class="px-3 py-2.5 text-(--text-secondary) font-mono">
		<InputText
			placeholder="12.345.678-9"
			bind:value={rut}
			error={errors.rut}
			disabled={isSaving}
			size="small"
		/>
	</td>

	<td class="px-3 py-2.5 text-(--text-secondary)">
		<InputText
			type="email"
			placeholder="correo@ejemplo.com"
			bind:value={email}
			error={errors.email}
			disabled={isSaving}
			size="small"
		/>
	</td>

	<td class="px-3 py-2.5 text-(--text-secondary)">
		<InputText
			placeholder="912345678"
			bind:value={phone}
			error={errors.phone}
			disabled={isSaving}
			size="small"
		/>
	</td>

	<td class="px-3 py-2.5 text-(--text-secondary)">
		<Select
			options={orgOptions}
			bind:value={organization}
			disabled={isSaving}
			size="small"
		/>
	</td>

	<td class="px-3 py-2.5 text-center">
		<Select
			options={roleOptions}
			bind:value={role}
			disabled={isSaving || currentUserRole !== 'ADMIN' || is_representative}
			size="small"
		/>
	</td>

	<td class="px-3 py-2.5 text-center">
		<div class="flex items-center justify-center" title="Autorizado para retirar pedidos">
			<Checkbox.Root
				bind:checked={is_representative}
				disabled={isSaving}
				id="member-is-representative-inline"
				class="w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer
				       {is_representative
				           ? 'bg-(--accent) border-(--accent) text-(--accent-text)'
				           : 'bg-(--bg-surface) border-(--border) hover:border-(--accent)/40'}"
			>
				{#snippet children( { checked } )}
					{#if checked}
						<div class="animate-in zoom-in duration-200 text-(--accent-text)">
							<Check size={14} strokeWidth={3} />
						</div>
					{/if}
				{/snippet}
			</Checkbox.Root>
		</div>
	</td>

	<td class="px-3 py-2.5 text-right">
		<div class="flex items-center justify-end gap-1.5">
			<button
				type="button"
				onclick={handleClear}
				class="p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-surface-2) transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
				title="Limpiar campos"
				disabled={isSaving}
			>
				<X size={15} />
			</button>

			<button
				type="button"
				onclick={( e : MouseEvent ) => {
					if ( isSaving ) return;
					const form = ( e.target as HTMLElement ).closest( 'tr' )?.querySelector( 'form' );
					if ( form ) form.requestSubmit();
				}}
				class="p-2 rounded-xl bg-(--accent) text-(--accent-text) hover:opacity-90 transition-all duration-300 shadow-sm hover:shadow-md
                    {isSaving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-95'}"
				title="Agregar miembro"
				disabled={isSaving}
			>
				{#if isSaving}
					<Loader size={16} class="animate-spin text-(--accent-text)" />
				{:else}
					<Plus size={16} />
				{/if}
			</button>
		</div>
		<!-- Formulario invisible para soportar envío estándar con tecla Enter -->
		<form onsubmit={handleSubmit} class="hidden"></form>
	</td>
</tr>
