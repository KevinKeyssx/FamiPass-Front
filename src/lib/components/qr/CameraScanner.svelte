<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

    import { Html5Qrcode, Html5QrcodeSupportedFormats }          from 'html5-qrcode';
	import { Camera, Flashlight, RefreshCw, QrCode, ArrowRight } from '@lucide/svelte';

    import PinInput from '$lib/components/ui/PinInput.svelte';
	import Button   from '$lib/components/ui/Button.svelte';


    interface Props {
		onScan   : ( code : string ) => Promise<boolean | void> | boolean | void;
		loading? : boolean;
	}

	let {
		onScan,
		loading = false
	}: Props = $props();

	let html5QrCode      : Html5Qrcode | null = null;
	let isScanning       = $state( false );
	let scannerError     = $state<string | null>( null );
	let manualCode       = $state( '' );
	let cameras          = $state<Array<{ id : string; label : string }>>( [] );
	let selectedCameraId = $state<string | null>( null );
	let torchActive      = $state( false );
	let hasTorch         = $state( false );
	let lastScannedCode  = $state<string | null>( null );

	const ALPHANUMERIC_PATTERN = '^[2-9A-HJ-NP-Z2-9a-hj-np-z]+$';

	$effect( () => {
		if ( manualCode.length < 6 ) {
			lastScannedCode = null;
		}
	} );

	async function startScanner( cameraId? : string ): Promise<void> {
		scannerError = null;

		try {
			if ( !html5QrCode ) {
				html5QrCode = new Html5Qrcode( 'qr-scanner-viewport', {
					formatsToSupport : [ Html5QrcodeSupportedFormats.QR_CODE ],
					verbose          : false
				} );
			}

			if ( html5QrCode.isScanning ) {
				await html5QrCode.stop();
			}

			const config = {
				fps         : 15,
				qrbox       : { width : 250, height : 250 },
				aspectRatio : 1.0
			};

			const targetCamera = cameraId || ( cameras.length > 0 ? cameras[ 0 ].id : { facingMode : 'environment' } );

			await html5QrCode.start(
				targetCamera,
				config,
				( decodedText : string ) => {
					handleSuccessfulScan( decodedText );
				},
				( _errorMessage : string ) => {
					// scan failure happens every frame no QR is detected
				}
			);

			isScanning = true;

			// Check for torch capabilities
			try {
				const capabilities = ( html5QrCode as any ).getRunningTrackCapabilities?.();
				hasTorch = Boolean( capabilities?.torch );
			} catch {
				hasTorch = false;
			}
		} catch ( err : any ) {
			console.error( 'Camera start error:', err );
			scannerError = 'No se pudo acceder a la cámara. Verifica los permisos o ingresa el código manualmente.';
			isScanning = false;
		}
	}

	async function stopScanner(): Promise<void> {
		if ( html5QrCode && html5QrCode.isScanning ) {
			try {
				await html5QrCode.stop();
			} catch ( err ) {
				console.error( 'Error stopping camera:', err );
			}
		}
		isScanning = false;
	}

	async function switchCamera(): Promise<void> {
		if ( cameras.length < 2 ) return;
		const currentIndex = cameras.findIndex( ( c ) => c.id === selectedCameraId );
		const nextIndex = ( currentIndex + 1 ) % cameras.length;
		selectedCameraId = cameras[ nextIndex ].id;
		await startScanner( selectedCameraId );
	}

	async function toggleTorch(): Promise<void> {
		if ( !html5QrCode || !hasTorch ) return;
		try {
			torchActive = !torchActive;
			await ( html5QrCode as any ).applyVideoConstraints( {
				advanced : [ { torch : torchActive } ]
			} );
		} catch ( err ) {
			console.error( 'Torch error:', err );
		}
	}

	function handleSuccessfulScan( text : string ): void {
		let code = text.trim().toUpperCase();
		if ( code.includes( '/SCAN/' ) ) {
			code = code.split( '/SCAN/' ).pop() || code;
		}
		if ( !code || code === lastScannedCode ) return;
		lastScannedCode = code;

		const result = onScan( code );
		if ( result && typeof ( result as Promise<any> ).then === 'function' ) {
			( result as Promise<any> ).then( ( success : any ) => {
				if ( success === false ) {
					manualCode      = '';
					lastScannedCode = null;
				}
			} );
		} else if ( result === false ) {
			manualCode      = '';
			lastScannedCode = null;
		}
	}

	function handleManualSubmit(): void {
		if ( manualCode.trim().length !== 6 || loading ) return;
		lastScannedCode = null;
		handleSuccessfulScan( manualCode );
	}

	onMount( async () => {
		try {
			const devices = await Html5Qrcode.getCameras();
			if ( devices && devices.length > 0 ) {
				cameras = devices.map( ( d ) => ( { id : d.id, label : d.label || `Cámara ${ d.id.slice( 0, 5 ) }` } ) );
				const backCam = devices.find( ( d ) => d.label.toLowerCase().includes( 'back' ) || d.label.toLowerCase().includes( 'trasera' ) );
				selectedCameraId = backCam ? backCam.id : devices[ 0 ].id;
			}
			await startScanner( selectedCameraId || undefined );
		} catch ( err : any ) {
			console.warn( 'No cameras detected or permission denied:', err );
			scannerError = 'No se detectó cámara o se denegaron los permisos. Puedes ingresar el código manualmente.';
		}
	} );

	onDestroy( () => {
		stopScanner();
		html5QrCode = null;
	} );
</script>

<div class="w-full max-w-md mx-auto space-y-6">
	<!-- Scanner Viewport Card -->
	<div class="relative overflow-hidden rounded-3xl border border-(--border) bg-black shadow-(--shadow-lg)">
		<div id="qr-scanner-viewport" class="w-full min-h-[300px] flex items-center justify-center bg-black"></div>

		<!-- Target Box Overlay -->
		{#if isScanning}
			<div class="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
				<div class="w-64 h-64 border-2 border-(--accent) rounded-2xl relative shadow-[0_0_25px_rgba(0,180,216,0.3)] animate-pulse">
					<div class="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-(--accent) -mt-1 -ml-1 rounded-tl-lg"></div>
					<div class="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-(--accent) -mt-1 -mr-1 rounded-tr-lg"></div>
					<div class="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-(--accent) -mb-1 -ml-1 rounded-bl-lg"></div>
					<div class="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-(--accent) -mb-1 -mr-1 rounded-br-lg"></div>
				</div>
			</div>
		{/if}

		<!-- Floating Controls -->
		<div class="absolute top-4 right-4 flex items-center gap-2 z-20">
			{#if hasTorch}
				<button
					type="button"
					onclick={toggleTorch}
					class="p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer {torchActive ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50' : 'bg-black/60 text-white hover:bg-black/80'}"
					aria-label="Encender linterna"
					title="Linterna"
				>
					<Flashlight size={18} />
				</button>
			{/if}

			{#if cameras.length > 1}
				<button
					type="button"
					onclick={switchCamera}
					class="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all cursor-pointer"
					aria-label="Cambiar cámara"
					title="Cambiar Cámara"
				>
					<RefreshCw size={18} />
				</button>
			{/if}
		</div>

		<!-- Status banner -->
		<div class="p-3 bg-black/80 backdrop-blur-sm border-t border-white/10 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
			<Camera size={14} class="text-(--accent) animate-pulse" />
			<span>Apunta la cámara al código QR del ticket familiar</span>
		</div>
	</div>

	{#if scannerError}
		<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
			<p class="font-bold mb-1">Aviso de Cámara:</p>
			<p>{scannerError}</p>
		</div>
	{/if}

	<!-- Manual Entry Card with PinInput -->
	<div class="card p-6 space-y-5">
		<div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-(--text-muted) select-none">
			<QrCode size={14} class="text-(--accent)" />
			<span>Ingreso Manual de Código PIN (6 caracteres)</span>
		</div>

		<div class="flex flex-col gap-4">
			<PinInput
				bind:value={manualCode}
				length={6}
				pattern={ALPHANUMERIC_PATTERN}
				disabled={loading}
				onComplete={( val ) => {
					handleSuccessfulScan( val.toUpperCase() );
				}}
			/>

			<Button
				type="button"
				variant="primary"
				size="md"
				disabled={manualCode.length !== 6 || loading}
				{loading}
				onclick={handleManualSubmit}
				class="w-full"
			>
				<span>Validar PIN</span>
				<ArrowRight size={16} />
			</Button>
		</div>
	</div>
</div>

<style>
	:global(#qr-scanner-viewport video) {
		object-fit    : cover !important;
		border-radius : 1.5rem;
		width         : 100% !important;
		max-height    : 340px !important;
	}
	:global(#qr-scanner-viewport img) {
		display : none !important;
	}
</style>
