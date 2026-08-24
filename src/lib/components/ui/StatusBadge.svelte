<script lang="ts">
	interface Props {
		status : string;
		label? : string;
		class? : string;
	}

	let { status, label = '', class : extraClass = '' }: Props = $props();

	const statusConfig: Record<string, { cls : string; text : string }> = {
		COMPLETED   : { cls : 'status-completed', text : 'Completado' },
		PENDING     : { cls : 'status-pending', text : 'Pendiente' },
		CANCELLED   : { cls : 'status-cancelled', text : 'Cancelado' },
		IN_PROGRESS : { cls : 'status-in-progress', text : 'En Progreso' },
		FINISHED    : { cls : 'status-finished', text : 'Finalizado' },
		DRAFT       : { cls : 'status-draft', text : 'Borrador' },
		AVAILABLE   : { cls : 'status-completed', text : 'Disponible' },
		OUT_OF_STOCK: { cls : 'status-cancelled', text : 'Agotado' },
		PAUSED      : { cls : 'status-pending', text : 'Pausado' }
	};

	const cfg = $derived( statusConfig[ status ] || { cls : 'status-draft', text : status } );
</script>

<span
	class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
	       bg-(--status-bg) text-(--status-text) {cfg.cls} {extraClass}"
>
	{label || cfg.text}
</span>
