-- 0003_add_deadline.sql
-- Add deadline (DDL) column to list items

ALTER TABLE shared_list_items ADD COLUMN deadline DATE;
ALTER TABLE personal_list_items ADD COLUMN deadline DATE;

-- Add FK constraints from board_messages and shared_list_items to profiles
-- so PostgREST can resolve resource embedding joins for profiles(nickname, avatar_url)
ALTER TABLE board_messages
  ADD CONSTRAINT fk_board_messages_profile
  FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE shared_list_items
  ADD CONSTRAINT fk_shared_list_items_profile
  FOREIGN KEY (created_by) REFERENCES profiles(id);
