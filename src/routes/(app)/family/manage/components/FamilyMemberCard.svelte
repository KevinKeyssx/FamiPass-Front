<script lang="ts">
	import { Users, Crown, User as UserIcon, Edit2, Trash2, Phone, Landmark, CreditCard } from '@lucide/svelte';
	import type { FamilyMember, CommunityOrganization }                                    from '$lib/types/index.js';
	import { getOrgLabel }                                                                from '$lib/constants/organization.js';
	import FamilyMemberRowForm                                                            from './FamilyMemberRowForm.svelte';
	import { formatRut }                                                                  from '$lib/utils/validation.js';

	interface Props {
		members    : FamilyMember[];
		onEdit     : ( member : FamilyMember ) => void;
		onDelete   : ( member : FamilyMember ) => void;
		onAdd      : ( data : {
			full_name         : string;
			rut               : string;
			phone             : string;
			organization      : CommunityOrganization;
			is_representative : boolean;
		} ) => Promise<boolean>;
		isSaving?  : boolean;
		saveError? : string | null;
	}

	let {
		members,
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
		<div class="card flex flex-col items-center py-12 text-(--text-muted) bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 rounded-2xl">
			<Users size={40} class="mb-3 opacity-20" />
			<p class="text-sm font-medium">Esta familia no cuenta con miembros registrados aún.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each members as m}
				<div class="card p-4 flex flex-col justify-between gap-3 bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 hover:border-(--accent) transition-all duration-300 rounded-2xl relative overflow-hidden group">
					<!-- Header: Nombre y Acciones -->
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2.5 truncate">
							<div class="w-8 h-8 rounded-xl bg-(--bg-surface-2) border border-(--border) flex items-center justify-center shrink-0">
								{#if m.is_representative}
									<Crown size={15} class="text-(--accent)" />
								{:else}
									<UserIcon size={15} class="text-(--text-muted)" />
								{/if}
							</div>
							<div class="truncate">
								<h3 class="font-bold text-sm text-(--text-primary) truncate" title={m.full_name}>
									{m.full_name}
								</h3>
								{#if m.is_representative}
									<span class="inline-flex items-center text-[10px] font-bold text-(--accent) bg-(--accent-muted) px-1.5 py-0.5 rounded-md select-none">
										Representante
									</span>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-1 shrink-0">
							<button
								type="button"
								onclick={() => onEdit( m )}
								class="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-muted) transition-all duration-200 cursor-pointer"
								title="Editar miembro"
							>
								<Edit2 size={14} />
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
					</div>

					<!-- Body: Detalles -->
					<div class="space-y-2 text-xs border-t border-(--border)/40 pt-2.5">
						<div class="flex items-center gap-2 text-(--text-secondary)">
							<CreditCard size={13} class="text-(--text-muted) shrink-0" />
							<span class="font-semibold w-12 text-(--text-muted)">RUT:</span>
							<span class="font-mono text-(--text-primary)">{formatRut( m.rut )}</span>
						</div>

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

	<!-- Formulario en línea al final de la página (estilo Fila de Tabla) -->
	<div class="card p-5 bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 rounded-2xl">
		<h3 class="text-sm font-bold text-(--text-primary) mb-3 flex items-center gap-2 select-none">
			<Users size={16} class="text-(--accent)" />
			<span>Agregar Nuevo Miembro a la Familia</span>
		</h3>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-(--border) bg-(--bg-surface-2)/50 select-none">
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/4">Nombre</th>
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/5">RUT</th>
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/6">Teléfono</th>
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/5">Organización</th>
						<th class="text-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/12">Representante</th>
						<th class="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)/80 w-1/10">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-(--border)">
					<FamilyMemberRowForm onSubmit={onAdd} isSaving={isSaving} />

					{#if saveError}
						<tr class="bg-red-500/5 select-none">
							<td colspan="6" class="px-4 py-2 text-xs text-red-500 text-right font-semibold">
								{saveError}
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
