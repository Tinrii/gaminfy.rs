CREATE TABLE `product_faqs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`question` varchar(255) NOT NULL,
	`question_en` varchar(255),
	`answer` text NOT NULL,
	`answer_en` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_faqs` ADD CONSTRAINT `product_faqs_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `product_faqs_product_idx` ON `product_faqs` (`product_id`);