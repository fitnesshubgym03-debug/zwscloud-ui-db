-- Migration: Create unified users table
-- Date: 2024-01-15
-- Description: Creates a unified users table for both regular users and admins

-- Create the users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `hashedPassword` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `emailVerified` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `lastLogin` DATETIME(3) NULL,
  `customerId` VARCHAR(191) NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key` (`email`),
  UNIQUE INDEX `users_customerId_key` (`customerId`),
  INDEX `users_email_idx` (`email`),
  INDEX `users_role_idx` (`role`),
  
  CONSTRAINT `users_customerId_fkey` 
    FOREIGN KEY (`customerId`) 
    REFERENCES `customers`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate existing admin profiles to users table
INSERT INTO `users` (`id`, `email`, `name`, `hashedPassword`, `role`, `createdAt`, `updatedAt`, `lastLogin`)
SELECT 
  `id`, 
  `email`, 
  `displayName`, 
  `hashedPassword`, 
  CASE 
    WHEN `role` = 'admin' THEN 'admin'
    WHEN `role` = 'super_admin' THEN 'super_admin'
    ELSE 'admin'
  END,
  `createdAt`, 
  `updatedAt`, 
  `lastLogin`
FROM `admin_profiles`
ON DUPLICATE KEY UPDATE `email` = `email`;

SELECT 'Migration complete: users table created and admin profiles migrated' AS status;
