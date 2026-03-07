-- WARNING: This script is destructive and will remove all BookMySalon data.
-- Usage:
--   mysql -u root -p < bookmysalon-app/sql/reset-schema.sql
-- After running this script, restart the backend to let Hibernate recreate
-- the latest schema from entities (ddl-auto=update).

DROP DATABASE IF EXISTS bookmysalon;
CREATE DATABASE bookmysalon
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
