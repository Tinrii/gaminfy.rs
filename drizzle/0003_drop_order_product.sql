ALTER TABLE `orders` DROP FOREIGN KEY `orders_product_id_products_id_fk`;
--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `product_id`;