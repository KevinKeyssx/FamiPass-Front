<script lang="ts">
	import {
        Users,
        ShoppingCart,
        User as UserIcon,
        UserPen,
        Trash2,
        Shield,
        Eye,
        UserPlus,
        Search,
        RotateCcw 
    } from '@lucide/svelte';

    import type {
        FamilyMember,
        CommunityOrganization,
        FamilyMemberRole
    }                           from '$lib/types/index.js';
	import { getOrgLabel }      from '$lib/constants/organization.js';
	import FamilyMemberRowForm  from './FamilyMemberRowForm.svelte';
	import { formatRut }        from '$lib/utils/validation.js';


    interface Props {
		members            : FamilyMember[];
		totalMembersCount? : number;
		currentUserId?     : string;
		currentUserEmail?  : string;
		currentUserRole?   : FamilyMemberRole;
		hasActiveFilters?  : boolean;
		onResetFilters?    : () => void;
		onEdit             : ( member : FamilyMember ) => void;
		onDelete           : ( member : FamilyMember ) => void;
		onAdd              : ( data : {
			full_name         : string;
			rut               : string;
			email?            : string;
			phone             : string;
			organization      : CommunityOrganization;
			is_representative : boolean;
			role              : FamilyMemberRole;
		} ) => Promise<boolean>;
		isSaving?          : boolean;
		saveError?         : string | null;
	}


    let {
		members,
		currentUserId,
		currentUserEmail,
		currentUserRole = 'ADMIN',
		hasActiveFilters = false,
		onResetFilters,
		onEdit,
		onDelete,
		onAdd,
		isSaving = false,
		saveError = null
	}: Props = $props();
</script>

<div class="card overflow-hidden">
	{#if members.length === 0}
		{#if hasActiveFilters}
			<div class="flex flex-col items-center py-10 text-(--text-muted) bg-(--bg-surface)/40 border-b border-(--border) space-y-2">
				<Search size={32} class="opacity-30" />
				<p class="text-sm font-semibold text-(--text-primary)">No se encontraron miembros</p>
				<p class="text-xs text-(--text-muted)">Ningún integrante coincide con los filtros aplicados.</p>
				{#if onResetFilters}
					<button
						type="button"
						onclick={onResetFilters}
						class="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--bg-surface-2) text-(--accent) border border-(--border) hover:bg-(--bg-surface) cursor-pointer select-none"
					>
						<RotateCcw size={12} />
						<span>Restablecer Filtros</span>
					</button>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col items-center py-12 text-(--text-muted) bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2)">
				<Users size={40} class="mb-3 opacity-20" />
				<p class="text-sm font-medium">Esta familia no cuenta con miembros registrados aún.</p>
			</div>
		{/if}
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-(--border) bg-(--bg-surface-2) select-none">
					<th class="text-left px-3 py-3 font-semibold text-(--text-secondary) w-1/5">Nombre</th>
					<th class="text-left px-3 py-3 font-semibold text-(--text-secondary) w-1/8">RUT</th>
					<th class="text-left px-3 py-3 font-semibold text-(--text-secondary) w-1/6">Correo</th>
					<th class="text-left px-3 py-3 font-semibold text-(--text-secondary) w-1/8">Teléfono</th>
					<th class="text-left px-3 py-3 font-semibold text-(--text-secondary) w-1/8">Organización</th>
					<th class="text-center px-3 py-3 font-semibold text-(--text-secondary) w-1/8" title="Rol del miembro en el grupo">Rol</th>
					<th class="text-center px-3 py-3 font-semibold text-(--text-secondary) w-1/12" title="Autorizado para retirar pedidos">Retirar</th>
					{#if currentUserRole === 'ADMIN'}
						<th class="text-right px-3 py-3 font-semibold text-(--text-secondary) w-1/12">Acciones</th>
					{/if}
				</tr>
			</thead>
			<tbody class="divide-y divide-(--border)">
				{#each members as m}
					{@const isCurrentUser = Boolean( ( currentUserId && m.user_id && m.user_id === currentUserId ) || ( currentUserEmail && m.email && m.email.toLowerCase() === currentUserEmail.toLowerCase() ) )}
					<tr class="transition-colors {isCurrentUser ? 'bg-emerald-500/8 hover:bg-emerald-500/12' : 'hover:bg-(--bg-surface-2)/40'}">
						<td class="px-3 py-3 text-(--text-primary) font-semibold">
							<div class="flex items-center gap-2">
								{#if m.role === 'ADMIN'}
									<Shield size={15} class="text-(--accent) shrink-0" />
								{:else if m.role === 'AGGREGATOR'}
									<UserPlus size={15} class="text-emerald-400 shrink-0" />
								{:else}
									<UserIcon size={15} class="text-(--text-muted) shrink-0" />
								{/if}
								<span>{m.full_name}</span>
								{#if isCurrentUser}
									<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 select-none">
										Yo
									</span>
								{/if}
							</div>
						</td>

						<td class="px-3 py-3 text-(--text-secondary) font-mono text-xs">
							{formatRut( m.rut )}
						</td>

						<td class="px-3 py-3 text-(--text-secondary) text-xs">
							{m.email || '—'}
						</td>

						<td class="px-3 py-3 text-(--text-secondary) text-xs">
							{m.phone || '—'}
						</td>

						<td class="px-3 py-3 text-(--text-secondary) text-xs">
							{getOrgLabel( m.organization )}
						</td>

						<td class="px-3 py-3 text-center">
							{#if m.role === 'ADMIN'}
								<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-(--accent-muted) text-(--accent)">
									<Shield size={11} />
									<span>Admin</span>
								</span>
							{:else if m.role === 'AGGREGATOR'}
								<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
									<UserPlus size={11} />
									<span>Agregador</span>
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-(--bg-surface-2) text-(--text-muted) border border-(--border)">
									<Eye size={11} />
									<span>Lector</span>
								</span>
							{/if}
						</td>

						<td class="px-3 py-3 text-center">
							{#if m.is_representative}
								<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-(--accent-muted) text-(--accent)" title="Autorizado para retirar pedidos">
									<ShoppingCart size={13} />
								</span>
							{:else}
								<span class="text-(--text-muted) text-xs">—</span>
							{/if}
						</td>

						{#if currentUserRole === 'ADMIN'}
							<td class="px-3 py-3 text-right">
								<div class="flex items-center justify-end gap-1.5">
									<button
										type="button"
										onclick={() => onEdit( m )}
										class="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-muted) transition-all duration-300 cursor-pointer"
										title="Editar miembro"
									>
										<UserPen size={15} />
									</button>

									<button
										type="button"
										onclick={() => onDelete( m )}
										class="p-1.5 rounded-lg text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
										title="Eliminar miembro"
									>
										<Trash2 size={15} />
									</button>
								</div>
							</td>
						{/if}
					</tr>
				{/each}

				<!-- Formulario en línea para agregar un nuevo miembro (para ADMIN y AGGREGATOR) -->
				{#if currentUserRole === 'ADMIN' || currentUserRole === 'AGGREGATOR'}
					<FamilyMemberRowForm currentUserRole={currentUserRole} onSubmit={onAdd} isSaving={isSaving} />
				{/if}

				{#if saveError}
					<tr class="bg-red-500/5 select-none">
						<td colspan={currentUserRole === 'ADMIN' ? 8 : 7} class="px-4 py-3 text-xs text-red-500 text-right font-semibold">
							{saveError}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
