-- HOW TO APPOINT AN ADMIN
-- ------------------------
-- Run this SQL query in your Supabase SQL Editor to make a user an admin.
-- Replace 'PHONE_NUMBER' with the user's mobile number (e.g., '+919963840058').

UPDATE profiles
SET role = 'admin'
WHERE mobile = '+919963840058'; -- <--- REPLACE THIS NUMBER

-- OR, if you know the User ID (UUID):
-- UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';

-- TO CHECK WHO IS ADMIN:
-- SELECT * FROM profiles WHERE role = 'admin';
