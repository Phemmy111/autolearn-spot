-- Check if the user exists in enrollments table
SELECT clerk_user_id, email, first_name, last_name, full_name, profile_picture 
FROM enrollments 
WHERE clerk_user_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';
