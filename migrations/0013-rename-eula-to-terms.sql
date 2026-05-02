-- Rename eula_accepted_at to terms_accepted_at to match the renamed document
ALTER TABLE user_consents RENAME COLUMN eula_accepted_at TO terms_accepted_at;
