CREATE TABLE `coupons` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`type` enum('fixed','percent') NOT NULL,
	`value` int NOT NULL,
	`min_subtotal_minor` int,
	`max_uses` int,
	`used_count` int NOT NULL DEFAULT 0,
	`expires_at` datetime,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`order_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`product_name` varchar(200) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price_minor` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_codes` DROP INDEX `product_codes_order_id_unique`;--> statement-breakpoint
ALTER TABLE `orders` ADD `subtotal_minor` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `discount_minor` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `coupon_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `orders` ADD `coupon_code` varchar(40);--> statement-breakpoint
ALTER TABLE `product_codes` ADD `order_item_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `product_codes_item_idx` ON `product_codes` (`order_item_id`);--> statement-breakpoint
INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `quantity`, `unit_price_minor`, `created_at`, `updated_at`)
SELECT o.`id`, o.`product_id`, p.`name`, 1, o.`amount_minor`, o.`created_at`, o.`updated_at`
FROM `orders` o JOIN `products` p ON p.`id` = o.`product_id`;--> statement-breakpoint
UPDATE `orders` SET `subtotal_minor` = `amount_minor`;--> statement-breakpoint
UPDATE `product_codes` pc JOIN `order_items` oi ON oi.`order_id` = pc.`order_id` SET pc.`order_item_id` = oi.`id` WHERE pc.`order_id` IS NOT NULL;
