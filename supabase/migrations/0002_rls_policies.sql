-- 0002_rls_policies.sql
-- Row Level Security policies for To-Do List App

-- ====== Profiles ======
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ====== Shared Lists ======
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_lists_select" ON shared_lists
  FOR SELECT TO authenticated
  USING (id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()) OR created_by = auth.uid());

CREATE POLICY "shared_lists_insert" ON shared_lists
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- ====== List Members ======
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_members_select" ON list_members
  FOR SELECT TO authenticated
  USING (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()));

CREATE POLICY "list_members_insert" ON list_members
  FOR INSERT TO authenticated WITH CHECK (true);

-- ====== Shared List Items ======
ALTER TABLE shared_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_items_select" ON shared_list_items
  FOR SELECT TO authenticated
  USING (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()));

CREATE POLICY "shared_items_insert" ON shared_list_items
  FOR INSERT TO authenticated WITH CHECK (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()));

CREATE POLICY "shared_items_update" ON shared_list_items
  FOR UPDATE TO authenticated
  USING (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()));

CREATE POLICY "shared_items_delete" ON shared_list_items
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ====== Personal List Items (strict private) ======
ALTER TABLE personal_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personal_items_owner" ON personal_list_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====== Daily Quotes (public read) ======
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_public_read" ON daily_quotes
  FOR SELECT USING (TRUE);

CREATE POLICY "quotes_insert" ON daily_quotes
  FOR INSERT TO authenticated WITH CHECK (true);

-- ====== Board Messages ======
ALTER TABLE board_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_select" ON board_messages
  FOR SELECT TO authenticated
  USING (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()));

CREATE POLICY "board_insert" ON board_messages
  FOR INSERT TO authenticated WITH CHECK (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()));

-- ====== Invite Tokens ======
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_select" ON invite_tokens
  FOR SELECT TO authenticated
  USING (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()));

CREATE POLICY "invite_insert" ON invite_tokens
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- ====== Helper function for creating initial shared list ======
CREATE OR REPLACE FUNCTION create_initial_list()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_list_id UUID;
BEGIN
  -- Create a new shared list
  INSERT INTO shared_lists (name, created_by)
  VALUES ('我们的清单', auth.uid())
  RETURNING id INTO new_list_id;

  -- Add creator as member
  INSERT INTO list_members (list_id, user_id)
  VALUES (new_list_id, auth.uid());

  RETURN new_list_id;
END;
$$;
