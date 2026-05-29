-- 0004_fix_rls_recursion.sql
-- Fix infinite recursion in list_members RLS policy
-- The old policy queried list_members recursively:
--   USING (list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid()))
-- This caused "infinite recursion detected in policy for relation 'list_members'"
-- when inserting into shared_list_items (which checks list_members via subquery).
--
-- New policy: each user can only see their own list_members rows.
-- This is sufficient because all app queries filter by user_id = auth.uid().

DROP POLICY IF EXISTS "list_members_select" ON list_members;

CREATE POLICY "list_members_select" ON list_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
