-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'admin', 'operator', 'support');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "role" "public"."UserRole" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),
    "session_id" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "data" JSONB,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "user_agent" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_session_id_idx" ON "public"."users"("session_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "public"."users"("created_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "public"."sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "public"."sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_created_at_idx" ON "public"."sessions"("created_at");

-- CreateIndex
CREATE INDEX "sessions_revoked_idx" ON "public"."sessions"("revoked");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- DATA RESET FUNCTIONS - Added for database reset operations
-- ============================================================================

-- Function to reset all user data (TRUNCATE with CASCADE)
CREATE OR REPLACE FUNCTION reset_all_data()
RETURNS TABLE(
    operation TEXT,
    table_name TEXT,
    rows_affected BIGINT,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    session_count BIGINT;
    user_count BIGINT;
    reset_timestamp TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get counts before deletion for reporting
    SELECT COUNT(*) INTO session_count FROM sessions;
    SELECT COUNT(*) INTO user_count FROM users;
    
    -- Reset sessions table (this will cascade delete related data)
    TRUNCATE TABLE sessions CASCADE;
    
    -- Reset users table (this will also cascade)
    TRUNCATE TABLE users CASCADE;
    
    -- Return summary of operations
    RETURN QUERY VALUES 
        ('TRUNCATE', 'sessions', session_count, reset_timestamp),
        ('TRUNCATE', 'users', user_count, reset_timestamp);
END;
$$ LANGUAGE plpgsql;

-- Function to reset only session data (keep users)
CREATE OR REPLACE FUNCTION reset_sessions_only()
RETURNS TABLE(
    operation TEXT,
    table_name TEXT,
    rows_affected BIGINT,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    session_count BIGINT;
    reset_timestamp TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get count before deletion
    SELECT COUNT(*) INTO session_count FROM sessions;
    
    -- Clear all session_id references in users table first
    UPDATE users SET session_id = NULL WHERE session_id IS NOT NULL;
    
    -- Reset sessions table
    TRUNCATE TABLE sessions CASCADE;
    
    -- Return summary
    RETURN QUERY VALUES 
        ('UPDATE', 'users.session_id', (SELECT COUNT(*) FROM users), reset_timestamp),
        ('TRUNCATE', 'sessions', session_count, reset_timestamp);
END;
$$ LANGUAGE plpgsql;

-- Function to reset only user data (keep sessions structure but they'll be orphaned)
CREATE OR REPLACE FUNCTION reset_users_only()
RETURNS TABLE(
    operation TEXT,
    table_name TEXT,
    rows_affected BIGINT,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_count BIGINT;
    session_count BIGINT;
    reset_timestamp TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get counts before deletion
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO session_count FROM sessions;
    
    -- Reset users table (CASCADE will clean up related sessions)
    TRUNCATE TABLE users CASCADE;
    
    -- Return summary
    RETURN QUERY VALUES 
        ('TRUNCATE', 'users', user_count, reset_timestamp),
        ('CASCADE_DELETE', 'sessions', session_count, reset_timestamp);
END;
$$ LANGUAGE plpgsql;

-- Function to get reset statistics
CREATE OR REPLACE FUNCTION get_reset_stats()
RETURNS TABLE(
    table_name TEXT,
    current_rows BIGINT,
    table_size TEXT,
    last_reset TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.row_count,
        pg_size_pretty(pg_total_relation_size(t.table_name::regclass))::TEXT as table_size,
        NULL::TIMESTAMP WITH TIME ZONE as last_reset -- TODO: Add tracking table if needed
    FROM (
        SELECT 'users' as table_name, COUNT(*) as row_count FROM users
        UNION ALL
        SELECT 'sessions' as table_name, COUNT(*) as row_count FROM sessions
    ) t;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to application user (if different from current user)
-- Note: This assumes the application user is 'exchanger_user' as per existing setup
DO $$
BEGIN
    -- Grant execute permissions if the user exists
    IF EXISTS (SELECT 1 FROM pg_user WHERE usename = 'exchanger_user') THEN
        GRANT EXECUTE ON FUNCTION reset_all_data() TO exchanger_user;
        GRANT EXECUTE ON FUNCTION reset_sessions_only() TO exchanger_user;
        GRANT EXECUTE ON FUNCTION reset_users_only() TO exchanger_user;
        GRANT EXECUTE ON FUNCTION get_reset_stats() TO exchanger_user;
    END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION reset_all_data() IS 'Resets all user and session data, keeping table structure intact. Returns operation summary.';
COMMENT ON FUNCTION reset_sessions_only() IS 'Resets only session data, preserving user accounts. Clears session_id references.';
COMMENT ON FUNCTION reset_users_only() IS 'Resets only user data, which cascades to delete related sessions.';
COMMENT ON FUNCTION get_reset_stats() IS 'Returns current row counts and table sizes for monitoring.';
