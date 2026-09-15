<script lang="ts">
	import {
		ChevronDown,
		Check,
		CircleAlert,
		Calendar,
		Clock,
		Hourglass,
		CalendarPlus
	}                         from '@lucide/svelte';
	import { Select }         from 'bits-ui';
	import { formatEventDate } from '$lib/utils/date.js';
	import type { EventConfig } from '$lib/types/index.js';

	interface Props {
		id?          : string;
		label?       : string;
		value        : string;
		events       : EventConfig[];
		placeholder? : string;
		error?       : string | null;
		required?    : boolean;
		disabled?    : boolean;
	}

	let {
		id          = '',
		label       = '',
		value       = $bindable( '' ),
		events      = [],
		placeholder = 'Selecciona un evento para obtener tu ticket...',
		error       = null,
		required    = false,
		disabled    = false
	}: Props = $props();

	const selectedEvent = $derived(
		events.find( ( ev ) => ev.id === value ) || null
	);
</script>

<Select.Root type="single" bind:value={value} {disabled} {required}>
	<div class="flex flex-col gap-1.5 w-full">
		{#if label}
			<label
				for={id || undefined}
				class="text-sm font-medium text-text-primary select-none cursor-pointer"
			>
				{label}
				{#if required}
					<span class="text-accent">*</span>
				{/if}
			</label>
		{/if}

		<div class="relative w-full">
			<Select.Trigger
				id={id || undefined}
				class="w-full transition-all duration-300 flex items-center justify-between text-left border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group
                    bg-bg-surface-2 text-text-primary px-4 py-2 rounded-xl text-sm min-h-[52px]
                    focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
                    {error
                        ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
                        : 'border-border hover:border-accent/40'}"
			>
				{#if selectedEvent}
					<div class="flex flex-col gap-1 py-0.5 pr-2 overflow-hidden flex-1">
						<span class="font-bold text-sm text-(--text-primary) truncate">
							{selectedEvent.event_name}
						</span>

						<div class="flex flex-wrap items-center gap-1.5 text-[10px]">
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-calypso-500/10 text-calypso-600 dark:text-calypso-400 font-medium border border-calypso-500/20">
								<Calendar size={10} class="shrink-0" />
								<span>Evento: <strong>{formatEventDate( selectedEvent.event_date )}</strong></span>
							</span>

							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
								<Clock size={10} class="shrink-0" />
								<span>Inscripción: <strong>{formatEventDate( selectedEvent.registration_deadline, true )}</strong></span>
							</span>

							{#if selectedEvent.expires_at}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-300 font-medium border border-slate-500/20">
									<Hourglass size={10} class="shrink-0" />
									<span>Vence: <strong>{formatEventDate( selectedEvent.expires_at )}</strong></span>
								</span>
							{/if}
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-2 text-(--text-muted) py-1">
						<CalendarPlus size={16} class="shrink-0 text-(--accent)" />
						<span class="truncate">{placeholder}</span>
					</div>
				{/if}

				<ChevronDown
					size={16}
					class="text-text-muted group-focus:text-accent group-hover:text-accent transition-colors shrink-0 ml-2"
				/>
			</Select.Trigger>

			<Select.Portal>
				<Select.Content
					class="z-50 rounded-2xl border border-border bg-bg-surface p-2 shadow-2xl animate-in fade-in duration-200 w-(--bits-select-anchor-width) min-w-[320px] max-h-80 overflow-y-auto space-y-1.5"
					sideOffset={4}
				>
					{#each events as ev}
						<Select.Item
							value={ev.id}
							label={ev.event_name}
							class="flex flex-col gap-2 p-3 rounded-xl transition-all cursor-pointer select-none text-text-primary hover:bg-bg-surface-2 border border-transparent hover:border-border data-selected:bg-accent-muted/40 data-selected:border-accent/30"
						>
							<div class="flex items-center justify-between w-full">
								<span class="font-bold text-sm text-(--text-primary)">
									{ev.event_name}
								</span>

								{#if value === ev.id}
									<span class="p-1 rounded-md bg-(--accent)/15 text-(--accent)">
										<Check size={14} class="shrink-0" />
									</span>
								{/if}
							</div>

							<!-- Chips con las 3 fechas formateadas -->
							<div class="flex flex-wrap items-center gap-1.5 text-[11px]">
								<!-- 1. Fecha del Evento -->
								<div
									class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-calypso-500/10 text-calypso-600 dark:text-calypso-400 border border-calypso-500/20"
									title="Fecha de realización del evento"
								>
									<Calendar size={11} class="shrink-0" />
									<span>Evento: <strong>{formatEventDate( ev.event_date )}</strong></span>
								</div>

								<!-- 2. Límite de Inscripción -->
								<div
									class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
									title="Límite para inscribir tu grupo familiar"
								>
									<Clock size={11} class="shrink-0" />
									<span>Inscripción: <strong>{formatEventDate( ev.registration_deadline, true )}</strong></span>
								</div>

								<!-- 3. Fecha de Expiración / Vencimiento -->
								{#if ev.expires_at}
									<div
										class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20"
										title="Fecha de caducidad del evento"
									>
										<Hourglass size={11} class="shrink-0" />
										<span>Vence: <strong>{formatEventDate( ev.expires_at )}</strong></span>
									</div>
								{/if}
							</div>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Portal>
		</div>

		{#if error}
			<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
				<CircleAlert size={14} class="shrink-0 text-red-500" />
				<span>{error}</span>
			</div>
		{/if}
	</div>
</Select.Root>
