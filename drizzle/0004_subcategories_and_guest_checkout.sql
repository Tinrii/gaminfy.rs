CREATE TABLE `subcategories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`category_id` bigint unsigned NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`name_en` varchar(120),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `subcategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `subcategories_category_slug_unique` UNIQUE(`category_id`,`slug`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `user_id` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `guest_email` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `access_token` varchar(64);--> statement-breakpoint
ALTER TABLE `products` ADD `subcategory_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_subcategory_id_subcategories_id_fk` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO `subcategories` (`category_id`, `slug`, `name`, `name_en`, `sort_order`)
SELECT c.`id`, s.`slug`, s.`name`, s.`name_en`, s.`sort_order`
FROM `categories` c
JOIN (
	SELECT 'v-bucks' AS `slug`, 'Fortnite Vbucksi' AS `name`, 'Fortnite V-Bucks' AS `name_en`, 0 AS `sort_order`
	UNION ALL SELECT 'packs', 'Fortnite Pekovi', 'Fortnite Packs', 1
	UNION ALL SELECT 'random-accounts', 'Fortnite random nalozi', 'Fortnite Random Accounts', 2
	UNION ALL SELECT 'accounts', 'Fortnite nalozi', 'Fortnite Accounts', 3
) s
WHERE c.`slug` = 'fortnite';--> statement-breakpoint
UPDATE `products` p
JOIN `subcategories` s ON s.`category_id` = p.`category_id`
SET p.`subcategory_id` = s.`id`
WHERE p.`subcategory_id` IS NULL AND (
	(s.`slug` = 'v-bucks' AND p.`slug` LIKE 'fortnite-%-v-bucks')
	OR (s.`slug` = 'random-accounts' AND p.`slug` LIKE 'fortnite-%-skins-account')
	OR (s.`slug` = 'accounts' AND p.`slug` LIKE 'fortnite-full-season-%')
);
