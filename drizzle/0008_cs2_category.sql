-- CS2 skins: a category with its own golden page (/cs2). Weekly offers are its products,
-- added in Admin; the subcategories are the page's filters.
INSERT IGNORE INTO `categories` (`slug`, `name`, `name_en`, `description`, `description_en`, `image_url`, `thumb_url`, `sort_order`) VALUES
	('cs2', 'CS2 skinovi', 'CS2 Skins', 'Nedeljne ponude CS2 skinova i otkup skinova.', 'Weekly CS2 skin deals and skin buyback.', '/games/cs2.webp', '/games/cs2-thumb.webp', 17);--> statement-breakpoint
INSERT IGNORE INTO `subcategories` (`category_id`, `slug`, `name`, `name_en`, `sort_order`)
SELECT c.`id`, s.`slug`, s.`name`, s.`name_en`, s.`sort_order`
FROM `categories` c
JOIN (
	SELECT 'knives' AS `slug`, 'Noževi' AS `name`, 'Knives' AS `name_en`, 0 AS `sort_order`
	UNION ALL SELECT 'gloves', 'Rukavice', 'Gloves', 1
	UNION ALL SELECT 'ak-47', 'AK-47', NULL, 2
	UNION ALL SELECT 'awp', 'AWP', NULL, 3
	UNION ALL SELECT 'm4a1-s', 'M4A1-S', NULL, 4
	UNION ALL SELECT 'pistols', 'Pištolji', 'Pistols', 5
) s
WHERE c.`slug` = 'cs2';
