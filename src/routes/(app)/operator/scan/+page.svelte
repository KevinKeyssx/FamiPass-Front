<script lang="ts">
	import { goto }          from '$app/navigation';
	import { deserialize }   from '$app/forms';
	import toast             from 'svelte-french-toast';
	import CameraScanner     from '$lib/components/qr/CameraScanner.svelte';
	import { QrCode }        from '@lucide/svelte';

	let isValidating = $state( false );

	async function handleScan( code : string ): Promise<boolean> {
		if ( isValidating ) return false;
		isValidating = true;
		const toastId = toast.loading( 'Validando ticket familiar...' );

		const formData = new FormData();
		formData.append( 'hash', code );

		try {
			const res = await fetch( '?/validateHash', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await res.text() );

			if ( result.type === 'redirect' ) {
				toast.success( '¡Ticket encontrado!', { id : toastId } );
				goto( result.location );
				return true;
			} else if ( result.type === 'failure' ) {
				const errorMsg = ( result.data as any )?.error || 'Código no reconocido.';
				toast.error( errorMsg, { id : toastId, duration : 4000 } );
				isValidating = false;
				return false;
			} else {
				toast.error( 'No se pudo procesar el código.', { id : toastId, duration : 4000 } );
				isValidating = false;
				return false;
			}
		} catch ( err : any ) {
			toast.error( err.message || 'Error de conexión al validar ticket.', { id : toastId, duration : 4000 } );
			isValidating = false;
			return false;
		}
	}
</script>

<svelte:head>
	<title>Escanear QR — Portal Operador</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="space-y-1 relative z-10">
			<div class="flex items-center gap-2">
				<span class="p-1 rounded-lg bg-(--accent-muted) text-(--accent)">
					<QrCode size={18} />
				</span>
				<h1 class="text-2xl font-black text-(--text-primary) tracking-tight">
					Escáner de Tickets
				</h1>
			</div>
			<p class="text-xs text-(--text-secondary)">
				Escanea el código QR de un familiar o digita el PIN para realizar la entrega de raciones
			</p>
		</div>
	</div>

	<!-- Camera Scanner Component with integrated button loading -->
	<CameraScanner onScan={handleScan} loading={isValidating} />
</div>
