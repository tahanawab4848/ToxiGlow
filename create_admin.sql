-- Create admin account for system analytics
INSERT INTO user (email, name, role) 
VALUES ('admin@pathoglow.com', 'System Administrator', 'admin');

-- To run this:
-- 1. Install sqlite3 command line tool
-- 2. Run: sqlite3 backend/pathoglow.db < create_admin.sql
-- 3. Login with admin@pathoglow.com (any password)
-- 4. Click "📊 Analytics" in navbar