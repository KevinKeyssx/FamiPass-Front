<script lang="ts">
	import { invalidateAll }    from '$app/navigation';
	import { deserialize }      from '$app/forms';
	import { page }             from '$app/state';

	import {
        Users,
        UserPlus,
        Shield,
        Eye,
        RotateCcw
    }               from '@lucide/svelte';
    import toast    from 'svelte-french-toast';

	import type {
        Family,
        FamilyMember,
        CommunityOrganization,
        FamilyMemberRole
    }                           from '$lib/types/index.js';
    import Button               from '$lib/components/ui/Button.svelte';
	import ButtonBack           from '$lib/components/ui/ButtonBack.svelte';
	import InputText            from '$lib/components/ui/InputText.svelte';
	import Select               from '$lib/components/ui/Select.svelte';
	import Modal                from '$lib/components/ui/Modal.svelte';
	import ViewSwitcher         from '$lib/components/shared/ViewSwitcher.svelte';
	import FamilyMemberTable    from './components/FamilyMemberTable.svelte';
	import FamilyMemberCard     from './components/FamilyMemberCard.svelte';
	import FamilyMemberForm     from './components/FamilyMemberForm.svelte';
	import { orgOptions }       from '$lib/constants/organization.js';


    interface Props {
		data : {
			family          : Family | null;
			members         : FamilyMember[];
			currentUserRole : FamilyMemberRole;
			currentUser     : {
				id    : string;
				name  : string;
				email : string;
			} | null;
		};
	}


    let { data }: Props = $props();


    const currentView = $derived( page.url.searchParams.get( 'view' ) || 'card' );


    let familyName     = $state( '' );
	let isSavingFamily = $state( false );
	let familyError    = $state<string | null>( null );
	let familySuccess  = $state( false );

	// Member states
	let isSavingMember = $state( false );
	let saveError      = $state<string | null>( null );

	// Filter states
	let searchQuery          = $state( '' );
	let filterOrg            = $state( 'ALL' );
	let filterRole           = $state( 'ALL' );
	let filterRepresentative = $state( 'ALL' );

	const orgFilterOptions = [
		{
			value : 'ALL',
			label : 'Todas las organizaciones'
		},
		...orgOptions
	];

	const roleFilterOptions = [
		{
			value : 'ALL',
			label : 'Todos los roles'
		},
		{
			value : 'ADMIN',
			label : 'Admin'
		},
		{
			value : 'AGGREGATOR',
			label : 'Agregador'
		},
		{
			value : 'VIEWER',
			label : 'Lector'
		}
	];

	const representativeFilterOptions = [
		{
			value : 'ALL',
			label : 'Retiro: Todos'
		},
		{
			value : 'YES',
			label : 'Autorizados para retirar'
		},
		{
			value : 'NO',
			label : 'No autorizados'
		}
	];

	const hasActiveFilters = $derived(
		searchQuery.trim() !== '' || filterOrg !== 'ALL' || filterRole !== 'ALL' || filterRepresentative !== 'ALL'
	);

	function resetFilters(): void {
		searchQuery          = '';
		filterOrg            = 'ALL';
		filterRole           = 'ALL';
		filterRepresentative = 'ALL';
	}

	const filteredMembers = $derived.by( () => {
		let list = data.members || [];

		const query = searchQuery.trim().toLowerCase();
		if ( query ) {
			list = list.filter( ( m ) => {
				const name  = m.full_name?.toLowerCase() || '';
				const rut   = m.rut?.toLowerCase() || '';
				const email = m.email?.toLowerCase() || '';
				const phone = m.phone?.toLowerCase() || '';
				return name.includes( query ) || rut.includes( query ) || email.includes( query ) || phone.includes( query );
			} );
		}

		if ( filterOrg !== 'ALL' ) {
			list = list.filter( ( m ) => m.organization === filterOrg );
		}

		if ( filterRole !== 'ALL' ) {
			list = list.filter( ( m ) => m.role === filterRole );
		}

		if ( filterRepresentative === 'YES' ) {
			list = list.filter( ( m ) => m.is_representative );
		} else if ( filterRepresentative === 'NO' ) {
			list = list.filter( ( m ) => !m.is_representative );
		}

		return list;
	} );

	// Edit / Create modal state
	let showMemberModal = $state( false );
	let selectedMember  = $state<Partial<FamilyMember> | null>( null );

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

	function openCreateModal(): void {
		saveError       = null;
		selectedMember  = {
			full_name         : '',
			email             : '',
			phone             : '',
			organization      : 'NINGUNA',
			is_representative : data.members.length === 0,
			role              : 'VIEWER'
		};
		showMemberModal = true;
	}

	function openEditModal( member : FamilyMember ): void {
		saveError       = null;
		selectedMember  = member;
		showMemberModal = true;
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
		email?            : string;
		phone             : string;
		organization      : CommunityOrganization;
		is_representative : boolean;
		role              : FamilyMemberRole;
	} ): Promise<boolean> {
		isSavingMember = true;
		saveError      = null;

		const isEditing = !!selectedMember?.id;
		const formData  = new FormData();
		if ( selectedMember?.id ) {
			formData.append( 'member_id', selectedMember.id );
		}
		formData.append( 'full_name', memberData.full_name );
		formData.append( 'rut', memberData.rut );
		if ( memberData.email ) {
			formData.append( 'email', memberData.email );
		}
		formData.append( 'phone', memberData.phone );
		formData.append( 'organization', memberData.organization );
		formData.append( 'is_representative', String( memberData.is_representative ) );
		formData.append( 'role', memberData.role );

		try {
			const res = await fetch( '?/saveMember', {
				method : 'POST',
				body   : formData
			} );
			const result = deserialize( await res.text() );

			if ( result.type === 'success' ) {
				showMemberModal = false;
				selectedMember  = null;
				await invalidateAll();

				if ( isEditing ) {
					toast.success( `Se modificó a "${ memberData.full_name }" correctamente.` );
				} else {
					toast.success( `Se agregó a "${ memberData.full_name }" correctamente.` );
				}

				return true;
			} else {
				saveError = ( result as any ).data?.error || 'Error al guardar el integrante.';
				toast.error( saveError );
				return false;
			}
		} catch ( err : any ) {
			saveError = err.message;
			toast.error( saveError );
			return false;
		} finally {
			isSavingMember = false;
		}
	}

	async function handleConfirmDelete(): Promise<void> {
		if ( !memberToDelete ) return;
		isDeletingMember = true;
		deleteError      = null;

		const deletedName = memberToDelete.full_name;
		const formData    = new FormData();
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
				toast.success( `Se eliminó a "${ deletedName }" correctamente.` );
			} else {
				deleteError = ( result as any ).data?.error || 'Error al eliminar el integrante.';
				toast.error( deleteError );
			}
		} catch ( err : any ) {
			deleteError = err.message;
			toast.error( deleteError );
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
					Configura los datos del grupo y gestiona a los integrantes
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
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
				<Users size={16} class="text-(--accent)" />
				<span>Nombre de la Familia</span>
			</h2>

			{#if data.family}
				{#if data.currentUserRole === 'ADMIN'}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-(--accent-muted) text-(--accent) select-none">
						<Shield size={13} />
						<span>Rol Administrador</span>
					</span>
				{:else if data.currentUserRole === 'AGGREGATOR'}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 select-none">
						<UserPlus size={13} />
						<span>Rol Agregador</span>
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-(--bg-surface-2) text-(--text-muted) border border-(--border) select-none">
						<Eye size={13} />
						<span>Modo Solo Lectura</span>
					</span>
				{/if}
			{/if}
		</div>

		<form onsubmit={handleSaveFamily} class="flex flex-col sm:flex-row gap-3 items-end">
			<div class="flex-1 w-full">
				<InputText
					id="family_name"
					label="Apellido o Nombre Familiar"
					placeholder="Ej: González Pérez"
					bind:value={familyName}
					disabled={data.family !== null && data.currentUserRole !== 'ADMIN'}
					required
				/>
			</div>

			{#if !data.family || data.currentUserRole === 'ADMIN'}
				<Button type="submit" variant="primary" loading={isSavingFamily} class="w-full sm:w-auto">
					{data.family ? 'Guardar Cambios' : 'Crear Familia'}
				</Button>
			{/if}
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

	<!-- Members Section (Inline Table / Cards) -->
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

				{#if data.currentUserRole === 'ADMIN' || data.currentUserRole === 'AGGREGATOR'}
					<Button variant="primary" size="sm" onclick={openCreateModal}>
						<UserPlus size={14} />
						<span>Agregar Miembro</span>
					</Button>
				{/if}
			</div>

			<!-- Barra de Búsqueda y Filtros -->
			{#if data.members.length > 0}
				<div class="card p-4 space-y-3 bg-(--bg-surface)/70 border border-(--border)/60">
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
						<!-- Búsqueda General -->
						<div class="w-full">
							<InputText
								id="member-search"
								label="Buscar Miembro"
								placeholder="Nombre, RUT, correo, teléfono..."
								bind:value={searchQuery}
								size="small"
							/>
						</div>

						<!-- Filtro Organización -->
						<div class="w-full">
							<Select
								id="filter-org"
								label="Organización"
								options={orgFilterOptions}
								bind:value={filterOrg}
								size="small"
							/>
						</div>

						<!-- Filtro Rol -->
						<div class="w-full">
							<Select
								id="filter-role"
								label="Rol en Grupo"
								options={roleFilterOptions}
								bind:value={filterRole}
								size="small"
							/>
						</div>

						<!-- Filtro Retiro -->
						<div class="w-full">
							<Select
								id="filter-rep"
								label="Retiro de Pedidos"
								options={representativeFilterOptions}
								bind:value={filterRepresentative}
								size="small"
							/>
						</div>
					</div>

					{#if hasActiveFilters}
						<div class="flex items-center justify-between pt-2 border-t border-(--border)/30 text-xs text-(--text-muted)">
							<span>
								Mostrando {filteredMembers.length} de {data.members.length} {data.members.length === 1 ? 'miembro' : 'miembros'}
							</span>
							<button
								type="button"
								onclick={resetFilters}
								class="inline-flex items-center gap-1 text-xs font-semibold text-(--accent) hover:underline cursor-pointer select-none"
							>
								<RotateCcw size={12} />
								<span>Restablecer Filtros</span>
							</button>
						</div>
					{/if}
				</div>
			{/if}

			{#if currentView === 'table'}
				<FamilyMemberTable
					members={filteredMembers}
					totalMembersCount={data.members.length}
					currentUserId={data.currentUser?.id}
					currentUserEmail={data.currentUser?.email}
					currentUserRole={data.currentUserRole}
					hasActiveFilters={hasActiveFilters}
					onResetFilters={resetFilters}
					onEdit={openEditModal}
					onDelete={openDeleteModal}
					onAdd={handleAddOrUpdateMember}
					isSaving={isSavingMember}
					saveError={saveError}
				/>
			{:else}
				<FamilyMemberCard
					members={filteredMembers}
					totalMembersCount={data.members.length}
					currentUserId={data.currentUser?.id}
					currentUserEmail={data.currentUser?.email}
					currentUserRole={data.currentUserRole}
					hasActiveFilters={hasActiveFilters}
					onResetFilters={resetFilters}
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

<!-- Modal para Crear / Editar Miembro -->
<Modal
	open={showMemberModal}
	onClose={() => { showMemberModal = false; selectedMember = null; }}
	title={selectedMember?.id ? 'Editar Miembro Familiar' : 'Agregar Nuevo Miembro'}
	size="lg"
>
	<FamilyMemberForm
		member={selectedMember}
		currentUserRole={data.currentUserRole}
		onSubmit={handleAddOrUpdateMember}
		onCancel={() => { showMemberModal = false; selectedMember = null; }}
		submitLabel={selectedMember?.id ? 'Guardar Cambios' : 'Agregar Miembro'}
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
