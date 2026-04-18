-- Multi-disk storage support upgrade
-- Migrates from single storage field to flexible JSON array of disks

-- Drop existing foreign key constraints and dependent tables temporarily
-- (handled by Prisma migrations automatically)

-- Rename old columns to preserve data
ALTER TABLE `custom_configs` 
CHANGE COLUMN `storageGb` `storageGb_deprecated` INT DEFAULT 160;

ALTER TABLE `custom_configs`
CHANGE COLUMN `storageType` `storageType_deprecated` VARCHAR(191) DEFAULT 'nvme';

-- Add new disks JSON column
ALTER TABLE `custom_configs`
ADD COLUMN `disks` JSON NOT NULL DEFAULT '[{"type":"nvme","sizeGb":160,"label":"Disk 1"}]';

-- Migrate data from old columns to new format (if any existing data)
UPDATE `custom_configs` 
SET `disks` = JSON_ARRAY(JSON_OBJECT(
  'type', COALESCE(`storageType_deprecated`, 'nvme'),
  'sizeGb', COALESCE(`storageGb_deprecated`, 160),
  'label', 'Disk 1'
))
WHERE `storageGb_deprecated` IS NOT NULL;

-- Drop old columns
ALTER TABLE `custom_configs`
DROP COLUMN `storageGb_deprecated`,
DROP COLUMN `storageType_deprecated`;

-- Update products table
ALTER TABLE `products`
ADD COLUMN `disks` JSON NOT NULL DEFAULT '[{"type":"nvme","sizeGb":160}]';

-- Migrate existing product storage to new format
UPDATE `products`
SET `disks` = JSON_ARRAY(JSON_OBJECT(
  'type', COALESCE(`storageType`, 'nvme'),
  'sizeGb', COALESCE(`storageGb`, 160)
))
WHERE `storageGb` IS NOT NULL;
