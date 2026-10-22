ALTER TABLE `categories` ADD `name_en` varchar(120);--> statement-breakpoint
-- Client's new offer layout: group categories with subcategory menus, plus Rocket League.
-- Brawl Stars, PUBG, Spotify, Canva Pro and Adobe CC move into the new groups and their
-- old categories are hidden (not deleted). Moved products keep their slugs (URLs) and old cover.
INSERT IGNORE INTO `categories` (`slug`, `name`, `name_en`, `description`, `description_en`, `image_url`, `thumb_url`) VALUES
	('mobile-games', 'Mobile Games', NULL, 'Gemovi, passovi i UC za Brawl Stars, Clash of Clans i PUBG.', 'Gems, passes and UC for Brawl Stars, Clash of Clans and PUBG.', '/games/mobile-games.webp', '/games/mobile-games-thumb.webp'),
	('rocket-league', 'Rocket League', NULL, 'Rocket League Credits — isporuka u roku od 15 minuta.', 'Rocket League Credits — delivered within 15 minutes.', '/games/rocket-league.webp', '/games/rocket-league-thumb.webp'),
	('digital-subscriptions', 'Digitalne pretplate', 'Digital Subscriptions', 'Spotify, YouTube Premium, Canva Pro i Adobe Creative Cloud.', 'Spotify, YouTube Premium, Canva Pro and Adobe Creative Cloud.', '/games/digital-subscriptions.webp', '/games/digital-subscriptions-thumb.webp');--> statement-breakpoint
UPDATE `categories` SET `sort_order` = CASE `slug`
	WHEN 'fortnite' THEN 0 WHEN 'mobile-games' THEN 1 WHEN 'roblox' THEN 2 WHEN 'gta-v' THEN 3 WHEN 'valorant' THEN 4
	WHEN 'rocket-league' THEN 5 WHEN 'minecraft' THEN 6 WHEN 'digital-subscriptions' THEN 7 WHEN 'steam' THEN 8
	WHEN 'playstation' THEN 9 WHEN 'clash-royale' THEN 10 WHEN 'ea-fc-26' THEN 11 WHEN 'brawl-stars' THEN 12
	WHEN 'pubg' THEN 13 WHEN 'spotify' THEN 14 WHEN 'adobe-creative-cloud' THEN 15 WHEN 'canva-pro' THEN 16
	ELSE `sort_order` END;--> statement-breakpoint
INSERT IGNORE INTO `subcategories` (`category_id`, `slug`, `name`, `name_en`, `image_url`, `sort_order`)
SELECT c.`id`, s.`slug`, s.`name`, s.`name_en`, CONCAT('/games/', c.`slug`, '-sub-', s.`slug`, '.webp'), s.`sort_order`
FROM `categories` c
JOIN (
	SELECT 'mobile-games' AS `category`, 'brawl-stars' AS `slug`, 'Brawl Stars' AS `name`, NULL AS `name_en`, 0 AS `sort_order`
	UNION ALL SELECT 'mobile-games', 'clash-of-clans', 'Clash of Clans', NULL, 1
	UNION ALL SELECT 'mobile-games', 'pubg', 'PUBG', NULL, 2
	UNION ALL SELECT 'steam', 'wallet', 'Steam Wallet', NULL, 0
	UNION ALL SELECT 'steam', 'games', 'Steam igre', 'Steam Games', 1
	UNION ALL SELECT 'digital-subscriptions', 'spotify', 'Spotify', NULL, 0
	UNION ALL SELECT 'digital-subscriptions', 'youtube-premium', 'YouTube Premium', NULL, 1
	UNION ALL SELECT 'digital-subscriptions', 'canva-pro', 'Canva Pro', NULL, 2
	UNION ALL SELECT 'digital-subscriptions', 'adobe-creative-cloud', 'Adobe Creative Cloud', NULL, 3
	UNION ALL SELECT 'playstation', 'gift-cards', 'PlayStation poklon kartice', 'PlayStation Gift Cards', 0
	UNION ALL SELECT 'playstation', 'games', 'PlayStation igre', 'PlayStation Games', 1
	UNION ALL SELECT 'playstation', 'plus', 'PlayStation Plus', NULL, 2
) s ON s.`category` = c.`slug`;--> statement-breakpoint
UPDATE `products` p
JOIN `categories` old ON old.`id` = p.`category_id`
SET p.`image_url` = old.`image_url`
WHERE p.`image_url` IS NULL AND old.`slug` IN ('brawl-stars', 'pubg', 'spotify', 'canva-pro', 'adobe-creative-cloud');--> statement-breakpoint
UPDATE `products` p
JOIN `categories` old ON old.`id` = p.`category_id`
JOIN `categories` grp ON grp.`slug` = IF(old.`slug` IN ('brawl-stars', 'pubg'), 'mobile-games', 'digital-subscriptions')
JOIN `subcategories` s ON s.`category_id` = grp.`id` AND s.`slug` = old.`slug`
SET p.`category_id` = grp.`id`, p.`subcategory_id` = s.`id`
WHERE old.`slug` IN ('brawl-stars', 'pubg', 'spotify', 'canva-pro', 'adobe-creative-cloud');--> statement-breakpoint
UPDATE `categories` SET `is_active` = false
WHERE `slug` IN ('brawl-stars', 'pubg', 'spotify', 'canva-pro', 'adobe-creative-cloud');--> statement-breakpoint
UPDATE `products` p
JOIN `subcategories` s ON s.`category_id` = p.`category_id`
SET p.`subcategory_id` = s.`id`
WHERE p.`subcategory_id` IS NULL AND (
	(s.`slug` = 'wallet' AND p.`slug` LIKE 'steam-steam-wallet-%')
	OR (s.`slug` = 'gift-cards' AND p.`slug` LIKE 'playstation-psn-gift-card-%')
);--> statement-breakpoint
INSERT IGNORE INTO `products` (`category_id`, `slug`, `name`, `name_en`, `description`, `description_en`, `instructions`, `instructions_en`, `price_minor`, `currency`, `delivery_type`, `required_contact_fields`, `sort_order`)
SELECT c.`id`, x.`slug`, x.`name`, x.`name_en`,
	CONCAT(x.`name`, ' za Rocket League — isporuka u roku od 15 minuta, doživotna garancija.'),
	CONCAT(x.`name_en`, ' for Rocket League — delivered within 15 minutes, lifetime warranty.'),
	'Nakon plaćanja javi nam kako da te kontaktiramo. Naš tim će te kontaktirati da dopuni Credits na tvoj Rocket League nalog. Isporuka u roku od 15 minuta.',
	'After payment, tell us the best way to reach you. Our team will contact you to load the Credits onto your Rocket League account. Delivery within 15 minutes.',
	x.`price_minor`, 'RSD', 'manual', 'discord,email,instagram', x.`sort_order`
FROM `categories` c
JOIN (
	SELECT 'rocket-league-500-credits' AS `slug`, '500 Credits' AS `name`, '500 Credits' AS `name_en`, 50000 AS `price_minor`, 0 AS `sort_order`
	UNION ALL SELECT 'rocket-league-1-100-credits', '1.100 Credits', '1,100 Credits', 100000, 1
	UNION ALL SELECT 'rocket-league-3-000-credits', '3.000 Credits', '3,000 Credits', 210000, 2
	UNION ALL SELECT 'rocket-league-6-500-credits', '6.500 Credits', '6,500 Credits', 400000, 3
) x
WHERE c.`slug` = 'rocket-league';
