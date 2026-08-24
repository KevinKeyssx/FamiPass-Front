<script lang="ts">
	import { invalidateAll }                                     from '$app/navigation';
	import { deserialize }                                       from '$app/forms';
	import { page }                                              from '$app/state';
	import Button                                                from '$lib/components/ui/Button.svelte';
	import ButtonBack                                            from '$lib/components/ui/ButtonBack.svelte';
	import InputText                                             from '$lib/components/ui/InputText.svelte';
	import Modal                                                 from '$lib/components/ui/Modal.svelte';
	import ViewSwitcher                                          from '$lib/components/shared/ViewSwitcher.svelte';
	import FamilyMemberTable                                     from './components/FamilyMemberTable.svelte';
	import FamilyMemberCard                                      from './components/FamilyMemberCard.svelte';
	import FamilyMemberForm                                      from './components/FamilyMemberForm.svelte';
	import type { Family, FamilyMember, CommunityOrganization }   from '$lib/types/index.js';
	import { Users }                                             from '@lucide/svelte';

	interface Props {
		data : {
			family  : Family | null;
			members : FamilyMember[];
		};
	}

	let { data }: Props = $props();

	const currentView = $derived( page.url.searchParams.get( 'view' ) || 'table' );

	let familyName     = $state( '' );
	let isSavingFamily = $state( false );
	let familyError    = $state<string | null>( null );
	let familySuccess  = $state( false );

	// Member states
	let isSavingMember = $state( false );
	let saveError      = $state<string | null>( null );

	// Edit modal state
	let showEditModal  = $state( false );
	let selectedMember = $state<FamilyMember | null>( null );

	// Delete modal state
	let deleteModalOpen  = $state( false );
	let memberToDelete   = $state<FamilyMember | null>( null );
	let isDeletingMember = $state( false );
	let deleteError      = $state<string | null>( null );

	$effect( () => {
		if ( data.family?.family_name ) {
			familyName = data.family.family_name;
		}
	} );

	function openEditModal( member : FamilyMember ): void {
		saveError      = null;
		selectedMember = member;
		showEditModal  = true;
	}

	function openDeleteModal( member : FamilyMember ): void {
		deleteError     = null;
		memberToDelete  = member;
		deleteModalOpen = true;
	}

	async function handleSaveFamily( e : SubmitEvent ): Promise<void> {
		e.preventDefault();
		isSavingFamily = true;
		familyError    = null;
		familySuccess  = false;

		const formData = new FormData();
		formData.append( 'family_name', familyName );

		try {
			const res = await fetch( '?/saveFamily', {
				method : 'POST',
				body   : formData
			} );
			const result = deserialize( await res.text() );

			if ( result.type === 'success' ) {
				familySuccess = true;
				await invalidateAll();
				setTimeout( () => { familySuccess = false; }, 3000 );
			} else {
				familyError = ( result as any ).data?.error || 'Error al guardar la familia.';
			}
		} catch ( err : any ) {
			familyError = err.message;
		} finally {
			isSavingFamily = false;
		}
	}

	async function handleAddOrUpdateMember( memberData : {
		full_name         : string;
		rut               : string;
		phone             : string;
		organization      : CommunityOrganization;
		is_representative : boolean;
	} ): Promise<boolean> {
		isSavingMember = true;
		saveError      = null;

		const formData = new FormData();
		if ( selectedMember ) {
			formData.append( 'member_id', selectedMember.id );
		}
		formData.append( 'full_name', memberData.full_name );
		formData.append( 'rut', memberData.rut );
		formData.append( 'phone', memberData.phone );
		formData.append( 'organization', memberData.organization );
		formData.append( 'is_representative', String( memberData.is_representative ) );

		try {
			const res = await fetch( '?/saveMember', {
				method : 'POST',
				body   : formData
			} );
			const result = deserialize( await res.text() );

			if ( result.type === 'success' ) {
				showEditModal  = false;
				selectedMember = null;
				await invalidateAll();
				return true;
			} else {
				saveError = ( result as any ).data?.error || 'Error al guardar el integrante.';
				return false;
			}
		} catch ( err : any ) {
			saveError = err.message;
			return false;
		} finally {
			isSavingMember = false;
		}
	}

	async function handleConfirmDelete(): Promise<void> {
		if ( !memberToDelete ) return;
		isDeletingMember = true;
		deleteError      = null;

		const formData = new FormData();
		formData.append( 'member_id', memberToDelete.id );

		try {
			const res = await fetch( '?/deleteMember', {
				method : 'POST',
				body   : formData
			} );
			const result = deserialize( await res.text() );

			if ( result.type === 'success' ) {
				deleteModalOpen = false;
				memberToDelete  = null;
				await invalidateAll();
			} else {
				deleteError = ( result as any ).data?.error || 'Error al eliminar el integrante.';
			}
		} catch ( err : any ) {
			deleteError = err.message;
		} finally {
			isDeletingMember = false;
		}
	}
</script>

<svelte:head>
	<title>Administrar Familia — FamiPass</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3 relative z-10">
			<ButtonBack href="/family" />
			<div>
				<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
					Administrar Familia
				</h1>
				<p class="text-xs text-(--text-secondary)">
					Configura los datos del grupo y agrega a los integrantes directamente en la tabla
				</p>
			</div>
		</div>

		{#if data.family}
			<div class="relative z-10 shrink-0">
				<ViewSwitcher />
			</div>
		{/if}
	</div>

	<!-- Family Name Section -->
	<div class="card p-6 space-y-4">
		<h2 class="text-sm font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
			<Users size={16} class="text-(--accent)" />
			<span>Nombre de la Familia</span>
		</h2>

		<form onsubmit={handleSaveFamily} class="flex flex-col sm:flex-row gap-3 items-end">
			<div class="flex-1 w-full">
				<InputText
					id="family_name"
					label="Apellido o Nombre Familiar"
					placeholder="Ej: González Pérez"
					bind:value={familyName}
					required
				/>
			</div>

			<Button type="submit" variant="primary" loading={isSavingFamily} class="w-full sm:w-auto">
				{data.family ? 'Guardar Cambios' : 'Crear Familia'}
			</Button>
		</form>

		{#if familySuccess}
			<p class="text-xs font-semibold text-green-500 animate-in fade-in">
				¡Datos de la familia actualizados correctamente!
			</p>
		{/if}

		{#if familyError}
			<p class="text-xs font-semibold text-red-500 animate-in fade-in">
				{familyError}
			</p>
		{/if}
	</div>

	<!-- Members Section (Inline Table / Cards matching famipass-admin) -->
	{#if data.family}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-lg font-bold text-(--text-primary)">
						Miembros de la Familia
					</h2>
					<p class="text-xs text-(--text-muted)">
						{data.members.length} {data.members.length === 1 ? 'miembro registrado' : 'miembros registrados'}
					</p>
				</div>
			</div>

			{#if currentView === 'table'}
				<FamilyMemberTable
					members={data.members}
					onEdit={openEditModal}
					onDelete={openDeleteModal}
					onAdd={handleAddOrUpdateMember}
					isSaving={isSavingMember}
					saveError={saveError}
				/>
			{:else}
				<FamilyMemberCard
					members={data.members}
					onEdit={openEditModal}
					onDelete={openDeleteModal}
					onAdd={handleAddOrUpdateMember}
					isSaving={isSavingMember}
					saveError={saveError}
				/>
			{/if}
		</div>
	{/if}
</div>

<!-- Modal para Editar Miembro -->
<Modal
	open={showEditModal}
	onClose={() => { showEditModal = false; selectedMember = null; }}
	title="Editar Miembro Familiar"
	size="lg"
>
	<FamilyMemberForm
		member={selectedMember}
		onSubmit={handleAddOrUpdateMember}
		onCancel={() => { showEditModal = false; selectedMember = null; }}
		submitLabel="Guardar Cambios"
		loading={isSavingMember}
	/>

	{#if saveError}
		<p class="mt-3 text-red-500 text-xs font-semibold">{saveError}</p>
	{/if}
</Modal>

<!-- Modal Confirm Delete Member -->
<Modal
	open={deleteModalOpen}
	title="Eliminar Miembro"
	onClose={() => { deleteModalOpen = false; memberToDelete = null; }}
	onConfirm={handleConfirmDelete}
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={isDeletingMember}
	size="md"
>
	<p class="text-sm">
		¿Estás seguro de que deseas eliminar a <strong class="text-(--text-primary)">{memberToDelete?.full_name}</strong> de la familia?
	</p>
	<p class="text-xs text-(--text-muted) mt-2">
		Esta acción removerá al miembro permanentemente del grupo familiar.
	</p>
	{#if deleteError}
		<p class="text-xs text-red-500 mt-3 font-semibold">
			{deleteError}
		</p>
	{/if}
</Modal>
