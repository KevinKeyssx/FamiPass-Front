<script lang="ts">
	import { Shield, Eye, UserPlus} from '@lucide/svelte';

    import type {
        FamilyMember,
        CommunityOrganization,
        FamilyMemberRole 
    }                       from '$lib/types/index.js';
	import {
        validateRut,
        validatePhone,
        formatPhone
    }                       from '$lib/utils/validation.js';
	import { orgOptions }   from '$lib/constants/organization.js';
	import InputText        from '$lib/components/ui/InputText.svelte';
	import Select           from '$lib/components/ui/Select.svelte';
	import Checkbox         from '$lib/components/ui/Checkbox.svelte';
	import Button           from '$lib/components/ui/Button.svelte';


    const roleOptions = [
		{
			value : 'VIEWER',
			label : 'Lector / Visualizador'
		},
		{
			value : 'AGGREGATOR',
			label : 'Agregador de Miembros'
		},
		{
			value : 'ADMIN',
			label : 'Administrador del Grupo'
		}
	];


    const roleDescriptions: Record<FamilyMemberRole, { desc : string; icon : any }> = {
		VIEWER : {
			desc : 'Solo puede visualizar los miembros del grupo familiar y sus tickets asignados.',
			icon : Eye
		},
		AGGREGATOR : {
			desc : 'Puede inscribir y agregar nuevos integrantes a la familia, sin permisos para editar o eliminar existentes.',
			icon : UserPlus
		},
		ADMIN : {
			desc : 'Control total: puede agregar, editar datos y eliminar cualquier integrante de la familia.',
			icon : Shield
		}
	};


    interface Props {
		member?          : Partial<FamilyMember> | null;
		currentUserRole? : FamilyMemberRole;
		onSubmit         : ( data : {
			full_name         : string;
			rut               : string;
			email?            : string;
			phone             : string;
			organization      : CommunityOrganization;
			is_representative : boolean;
			role              : FamilyMemberRole;
		} ) => void;
		onCancel?        : () => void;
		submitLabel?     : string;
		loading?         : boolean;
	}


    let {
		member = null,
		currentUserRole = 'ADMIN',
		onSubmit,
		onCancel = () => {},
		submitLabel = 'Guardar',
		loading = false
	}: Props = $props();


    let full_name         = $state( '' );
	let rut               = $state( '' );
	let email             = $state( '' );
	let phone             = $state( '' );
	let organization      = $state<CommunityOrganization>( 'NINGUNA' );
	let is_representative = $state( false );
	let role              = $state<FamilyMemberRole>( 'VIEWER' );


    $effect( () => {
		if ( member ) {
			full_name         = member.full_name || '';
			rut               = member.rut || '';
			email             = member.email || '';
			phone             = member.phone || '';
			organization      = member.organization || 'NINGUNA';
			is_representative = !!member.is_representative;
			role              = member.role || ( member.is_representative ? 'ADMIN' : 'VIEWER' );
		} else {
			role = 'VIEWER';
		}
	} );


    let errors = $state<Record<string, string | null>>( {
		full_name : null,
		rut       : null,
		email     : null,
		phone     : null
	});


    function handleFormSubmit( e : SubmitEvent ): void {
		e.preventDefault();

		errors = {
			full_name : null,
			rut       : null,
			email     : null,
			phone     : null
		};

		let hasError = false;

		if ( !full_name.trim() ) {
			errors.full_name = 'El nombre completo es requerido.';
			hasError = true;
		}

		if ( !rut.trim() ) {
			errors.rut = 'El RUT es requerido.';
			hasError = true;
		} else if ( !validateRut( rut ) ) {
			errors.rut = 'El RUT ingresado no es válido.';
			hasError = true;
		}

		if ( email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email.trim() ) ) {
			errors.email = 'Ingresa un correo electrónico válido.';
			hasError = true;
		}

		if ( phone.trim() && !validatePhone( phone ) ) {
			errors.phone = 'El teléfono celular debe tener exactamente 9 dígitos.';
			hasError = true;
		}

		if ( hasError ) return;

		onSubmit( {
			full_name         : full_name.trim(),
			rut               : rut.trim(),
			email             : email.trim(),
			phone             : phone.trim() ? formatPhone( phone ) : '',
			organization,
			is_representative,
			role              : is_representative ? 'ADMIN' : role
		} );
	}
</script>

<form onsubmit={handleFormSubmit} class="space-y-4">
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<InputText
			label="Nombre completo"
			id="member-full-name"
			required={true}
			placeholder="Ej: Juan Pérez"
			bind:value={full_name}
			error={errors.full_name}
		/>

		<InputText
			label="RUT"
			id="member-rut"
			required={true}
			placeholder="Ej: 12.345.678-9"
			bind:value={rut}
			error={errors.rut}
		/>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<InputText
			label="Correo electrónico (Opcional)"
			id="member-email"
			type="email"
			placeholder="Ej: juan.perez@ejemplo.com"
			bind:value={email}
			error={errors.email}
		/>

		<InputText
			label="Teléfono de contacto (Opcional)"
			id="member-phone"
			placeholder="Ej: 912345678"
			bind:value={phone}
			error={errors.phone}
		/>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div>
			<Select
				label="Organización comunitaria"
				required={true}
				options={orgOptions}
				bind:value={organization}
			/>
		</div>

		<div>
			<Select
				label="Rol y Permisos del Miembro"
				required={true}
				options={roleOptions}
				disabled={currentUserRole !== 'ADMIN' || is_representative}
				bind:value={role}
			/>
		</div>
	</div>

	<!-- Explicación dinámica del rol seleccionado -->
	<div class="p-3 rounded-xl bg-(--bg-surface-2) border border-(--border)/60 flex items-start gap-2.5 text-xs text-(--text-secondary)">
		{#if role === 'ADMIN' || is_representative}
			<Shield size={16} class="text-(--accent) shrink-0 mt-0.5" />
			<div>
				<strong class="text-(--text-primary)">Administrador:</strong> {roleDescriptions.ADMIN.desc}
			</div>
		{:else if role === 'AGGREGATOR'}
			<UserPlus size={16} class="text-emerald-400 shrink-0 mt-0.5" />
			<div>
				<strong class="text-(--text-primary)">Agregador:</strong> {roleDescriptions.AGGREGATOR.desc}
			</div>
		{:else}
			<Eye size={16} class="text-(--text-muted) shrink-0 mt-0.5" />
			<div>
				<strong class="text-(--text-primary)">Lector:</strong> {roleDescriptions.VIEWER.desc}
			</div>
		{/if}
	</div>

	<div class="pt-2 border-t border-(--border)/40">
		<Checkbox
			label="Autorizado para retirar pedidos de la familia"
			description="Permite que este integrante pueda retirar y canjear los tickets y raciones del grupo familiar en los eventos"
			id="member-is-representative"
			bind:checked={is_representative}
		/>
	</div>

	<div class="flex gap-3 justify-end pt-4">
		<Button type="button" variant="secondary" onclick={onCancel}>
			Cancelar
		</Button>

		<Button type="submit" variant="primary" {loading}>
			{submitLabel}
		</Button>
	</div>
</form>
