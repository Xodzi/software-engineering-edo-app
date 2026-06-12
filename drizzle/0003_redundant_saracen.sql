ALTER TABLE `document_versions` ADD `content_hash` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `document_versions` ADD `history_hash` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `documents` ADD `version_history_hash` text;
