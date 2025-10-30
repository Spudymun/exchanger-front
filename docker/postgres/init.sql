-- ✅ PostgreSQL Initialization Script (Universal for Dev & Production)
-- This script sets up the database schema for session management
-- Environment-specific behavior controlled via environment variables

-- Connect to the target database (uses POSTGRES_DB from environment)
-- No need for explicit database creation - handled by postgres image

-- Create users table for session management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    session_id VARCHAR(255),
    
    -- Validation constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT non_empty_password CHECK (hashed_password IS NULL OR length(hashed_password) > 10)
);

-- Create sessions table for Redis fallback/audit
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Production-ready columns (safe for dev too)
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(revoked) WHERE revoked = false;

-- Create a function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions 
    WHERE expires_at < NOW() 
       OR revoked = true;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup operation (visible in postgres logs)
    RAISE NOTICE 'Cleaned up % expired/revoked sessions', deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session activity tracking
CREATE TRIGGER session_activity_trigger
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Create a view for active sessions
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    s.id,
    s.user_id,
    u.email,
    s.created_at,
    s.last_activity,
    s.ip_address,
    s.user_agent,
    EXTRACT(EPOCH FROM (s.expires_at - NOW())) AS seconds_until_expiry
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW() 
  AND s.revoked = false;

-- Create development test user (for testing purposes only)
INSERT INTO users (email, hashed_password, is_verified, role) 
VALUES (
    'dev@exchanger.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewukePXG.3B/z3zu', -- password: "devpassword123"
    true,
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Log initialization
INSERT INTO sessions (id, user_id, data, expires_at, ip_address, user_agent)
SELECT 
    'dev-session-' || gen_random_uuid()::text,
    u.id,
    '{"initialized": true, "env": "development"}',
    NOW() + INTERVAL '1 day',
    '127.0.0.1'::inet,
    'Development Environment'
FROM users u 
WHERE u.email = 'dev@exchanger.local'
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE users IS 'User accounts for the exchanger application';
COMMENT ON TABLE sessions IS 'User sessions with metadata and audit trail';
COMMENT ON VIEW active_sessions IS 'Currently active user sessions';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired and revoked sessions from the database';

-- Grant permissions for application user (uses POSTGRES_USER from environment)
-- Note: This assumes POSTGRES_USER is set (default: exchanger_user)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user) THEN
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON users TO %I', current_user);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO %I', current_user);
        EXECUTE format('GRANT SELECT ON active_sessions TO %I', current_user);
        EXECUTE format('GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO %I', current_user);
    END IF;
END $$;
