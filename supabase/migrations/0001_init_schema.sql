-- 0001_init_schema.sql
-- To-Do List App — Complete Database Schema

-- User profiles
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname      TEXT NOT NULL DEFAULT '匿名用户',
  avatar_url    TEXT,
  bubble_color  TEXT NOT NULL DEFAULT '#A8D8EA',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Shared lists (one group has one shared list)
CREATE TABLE shared_lists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL DEFAULT '我们的清单',
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Members of each shared list
CREATE TABLE list_members (
  list_id       UUID NOT NULL REFERENCES shared_lists(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

-- Items in the shared list
CREATE TABLE shared_list_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       UUID NOT NULL REFERENCES shared_lists(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  content       TEXT NOT NULL,
  is_done       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Personal to-do items (private per user)
CREATE TABLE personal_list_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_done       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Daily quotes (one per day, fetched by cron from Hitokoto)
CREATE TABLE daily_quotes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_date    DATE NOT NULL UNIQUE,
  hitokoto      TEXT NOT NULL,
  from_name     TEXT,
  from_who      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Message board messages
CREATE TABLE board_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       UUID NOT NULL REFERENCES shared_lists(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  content       TEXT NOT NULL,
  bubble_color  TEXT NOT NULL DEFAULT '#A8D8EA',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Invite tokens
CREATE TABLE invite_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  list_id       UUID NOT NULL REFERENCES shared_lists(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  max_uses      INTEGER DEFAULT 50,
  used_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shared_list_items_list_id ON shared_list_items(list_id);
CREATE INDEX idx_personal_list_items_user_id ON personal_list_items(user_id);
CREATE INDEX idx_board_messages_list_id ON board_messages(list_id);
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_daily_quotes_date ON daily_quotes(quote_date);
CREATE INDEX idx_list_members_user_id ON list_members(user_id);
