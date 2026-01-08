-- Update User Passwords with Hashed Values
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- Update admin password (admin123)
UPDATE users
SET password_hash = '$2b$10$UPP1w5leNC7jp1XoLiincu/lFtQMneAgeO.Kuhtp8uM5le60hTGVu'
WHERE email = 'admin@carwash.com';

-- Update staff password (staff123)
UPDATE users
SET password_hash = '$2b$10$FvZWfvYdzowkvQVXqOzs7enRq91JKcaLgd2wap3EV28mJ4RWSgisG'
WHERE email = 'staff@carwash.com';

-- Update customer password (customer123)
UPDATE users
SET password_hash = '$2b$10$2NHl1HKNSNNkGqkcvLHbyellhyz1EBHUyM.iyjS/IFB8ngqCrRIgC'
WHERE email = 'customer@test.com';

-- Verify the updates
SELECT id, email, role, first_name, last_name, is_active, is_verified
FROM users
WHERE email IN ('admin@carwash.com', 'staff@carwash.com', 'customer@test.com');
