import type { EventConfig } from './event.js';

export interface Product {
	id           : string;
	name         : string;
	description? : string | null;
	image_url?   : string | null;
	is_active    : boolean;
	created_at?  : string;
	updated_at?  : string;
}

export type EventProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'PAUSED' | 'DISCONTINUED';

export interface EventProduct {
	id          : string;
	event_id    : string;
	product_id  : string;
	quantity    : number;
	created_at? : string;
	updated_at? : string;
	status      : EventProductStatus;
	product?    : Product;
	event?      : EventConfig;
}
