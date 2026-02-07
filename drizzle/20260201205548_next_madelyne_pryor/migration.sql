CREATE TABLE `user_dictionaries` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`public` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_dictionary_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`dictionary_id` text NOT NULL,
	`noun` text NOT NULL,
	`article` text NOT NULL,
	`alternative_articles` text,
	`translation` text,
	`translation_ru` text,
	`translation_en` text,
	`translation_uk` text,
	`example_sentence` text,
	`level` text,
	`topic` text,
	`audio_url` text,
	CONSTRAINT `fk_user_dictionary_words_dictionary_id_user_dictionaries_id_fk` FOREIGN KEY (`dictionary_id`) REFERENCES `user_dictionaries`(`id`) ON DELETE CASCADE
);
