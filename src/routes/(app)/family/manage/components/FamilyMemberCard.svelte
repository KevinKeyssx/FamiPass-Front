<script lang="ts">
	import {
        Users,
        ShoppingCart,
        UserPen,
        Trash2,
        Phone,
        Landmark,
        CreditCard,
        Mail,
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
		totalMembersCount,
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

<div class="space-y-6">
	<!-- Grid de Tarjetas -->
	{#if members.length === 0}
		{#if hasActiveFilters}
			<div class="card flex flex-col items-center py-10 text-(--text-muted) bg-(--bg-surface)/40 border border-(--border)/60 rounded-2xl space-y-2">
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
			<div class="card flex flex-col items-center py-12 text-(--text-muted) bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 rounded-2xl">
				<Users size={40} class="mb-3 opacity-20" />
				<p class="text-sm font-medium">Esta familia no cuenta con miembros registrados aún.</p>
			</div>
		{/if}
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each members as m}
				{@const isCurrentUser = Boolean( ( currentUserId && m.user_id && m.user_id === currentUserId ) || ( currentUserEmail && m.email && m.email.toLowerCase() === currentUserEmail.toLowerCase() ) )}
				<div class="card p-4 flex flex-col justify-between gap-3 bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border transition-all duration-300 rounded-2xl relative overflow-hidden group {isCurrentUser ? 'border-emerald-500/40 shadow-sm shadow-emerald-500/5' : 'border-(--border)/60 hover:border-(--accent)'}">
					<!-- Header: Nombre y Acciones -->
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2.5 truncate">
							<div class="w-8 h-8 rounded-xl bg-(--bg-surface-2) border border-(--border) flex items-center justify-center shrink-0">
								{#if m.role === 'ADMIN'}
									<Shield size={15} class="text-(--accent)" />
								{:else if m.role === 'AGGREGATOR'}
									<UserPlus size={15} class="text-emerald-400" />
								{:else}
									<Eye size={15} class="text-(--text-muted)" />
								{/if}
							</div>
							<div class="truncate">
								<h3 class="font-bold text-sm text-(--text-primary) truncate" title={m.full_name}>
									{m.full_name}
								</h3>
								<div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
									{#if isCurrentUser}
										<span class="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md select-none">
											Yo
										</span>
									{/if}
									{#if m.is_representative}
										<span class="inline-flex items-center gap-1 text-[10px] font-bold text-(--accent) bg-(--accent-muted) px-1.5 py-0.5 rounded-md select-none" title="Autorizado para retirar pedidos">
											<ShoppingCart size={11} />
											<span>Retirar</span>
										</span>
									{/if}
									{#if m.role === 'ADMIN'}
										<span class="inline-flex items-center text-[10px] font-semibold text-(--accent) bg-(--accent-muted)/60 px-1.5 py-0.5 rounded-md select-none">
											Admin
										</span>
									{:else if m.role === 'AGGREGATOR'}
										<span class="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md select-none">
											Agregador
										</span>
									{:else}
										<span class="inline-flex items-center text-[10px] font-semibold text-(--text-muted) bg-(--bg-surface-2) border border-(--border) px-1.5 py-0.5 rounded-md select-none">
											Lector
										</span>
									{/if}
								</div>
							</div>
						</div>

						{#if currentUserRole === 'ADMIN'}
							<div class="flex items-center gap-1 shrink-0">
								<button
									type="button"
									onclick={() => onEdit( m )}
									class="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-muted) transition-all duration-200 cursor-pointer"
									title="Editar miembro"
								>
									<UserPen size={14} />
								</button>

								<button
									type="button"
									onclick={() => onDelete( m )}
									class="p-1.5 rounded-lg text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
									title="Eliminar miembro"
								>
									<Trash2 size={14} />
								</button>
							</div>
						{/if}
					</div>

					<!-- Body: Detalles -->
					<div class="space-y-2 text-xs border-t border-(--border)/40 pt-2.5">
						<div class="flex items-center gap-2 text-(--text-secondary)">
							<CreditCard size={13} class="text-(--text-muted) shrink-0" />
							<span class="font-semibold w-12 text-(--text-muted)">RUT:</span>
							<span class="font-mono text-(--text-primary)">{formatRut( m.rut )}</span>
						</div>

						{#if m.email}
							<div class="flex items-center gap-2 text-(--text-secondary)">
								<Mail size={13} class="text-(--text-muted) shrink-0" />
								<span class="font-semibold w-12 text-(--text-muted)">Email:</span>
								<span class="text-(--text-primary) truncate" title={m.email}>{m.email}</span>
							</div>
						{/if}

						<div class="flex items-center gap-2 text-(--text-secondary)">
							<Phone size={13} class="text-(--text-muted) shrink-0" />
							<span class="font-semibold w-12 text-(--text-muted)">Teléfono:</span>
							<span class="text-(--text-primary)">{m.phone || '—'}</span>
						</div>

						<div class="flex items-center gap-2 text-(--text-secondary)">
							<Landmark size={13} class="text-(--text-muted) shrink-0" />
							<span class="font-semibold w-12 text-(--text-muted)">Org:</span>
							<span class="text-(--text-primary) truncate" title={getOrgLabel( m.organization )}>
								{getOrgLabel( m.organization )}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Formulario en línea al final de la página (para ADMIN y AGGREGATOR) -->
	{#if currentUserRole === 'ADMIN' || currentUserRole === 'AGGREGATOR'}
		<div class="card p-5 bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 rounded-2xl">
			<h3 class="text-sm font-bold text-(--text-primary) mb-3 flex items-center gap-2 select-none">
				<Users size={16} class="text-(--accent)" />
				<span>Agregar Nuevo Miembro a la Familia</span>
			</h3>

			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-(--border) bg-(--bg-surface-2)/50 select-none">
							<th class="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/5">Nombre</th>
							<th class="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/8">RUT</th>
							<th class="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/6">Correo</th>
							<th class="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/8">Teléfono</th>
							<th class="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/8">Organización</th>
							<th class="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/8">Rol</th>
							<th class="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/12" title="Autorizado para retirar pedidos">Retirar</th>
							<th class="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/12">Acciones</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-(--border)">
						<FamilyMemberRowForm currentUserRole={currentUserRole} onSubmit={onAdd} isSaving={isSaving} />

						{#if saveError}
							<tr class="bg-red-500/5 select-none">
								<td colspan="8" class="px-4 py-2 text-xs text-red-500 text-right font-semibold">
									{saveError}
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
