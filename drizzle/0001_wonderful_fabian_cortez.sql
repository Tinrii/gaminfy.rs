ALTER TABLE `categories` ADD `description_en` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `locale` varchar(2) DEFAULT 'sr' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `name_en` varchar(200);--> statement-breakpoint
ALTER TABLE `products` ADD `description_en` text;--> statement-breakpoint
ALTER TABLE `products` ADD `instructions_en` text;