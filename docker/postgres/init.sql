-- ✅ PostgreSQL Initialization Script for Development
-- This script sets up the database schema for session management

-- Create development database if not exists
SELECT 'CREATE DATABASE exchanger_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'exchanger_db')\gexec

-- Connect to the target database
\c exchanger_db;

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
    
    -- Indexes for performance
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create sessions table for Redis fallback/audit
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Create a function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

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
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired sessions from the database';

-- Grant permissions for application user
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO exchanger_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO exchanger_user;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO exchanger_user;
