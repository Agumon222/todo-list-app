// Database types for To-Do List App

export interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
  bubble_color: string
  created_at: string
  updated_at: string
}

export interface SharedList {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface ListMember {
  list_id: string
  user_id: string
  joined_at: string
}

export interface SharedListItem {
  id: string
  list_id: string
  created_by: string
  content: string
  is_done: boolean
  deadline: string | null
  created_at: string
  updated_at: string
  // Joined fields (from profiles table)
  creator_nickname?: string
  creator_avatar?: string
}

export interface PersonalListItem {
  id: string
  user_id: string
  content: string
  is_done: boolean
  deadline: string | null
  created_at: string
  updated_at: string
}

export interface DailyQuote {
  id: string
  quote_date: string
  hitokoto: string
  from_name: string | null
  from_who: string | null
}

export interface BoardMessage {
  id: string
  list_id: string
  user_id: string
  content: string
  bubble_color: string
  created_at: string
  // Joined fields
  user_nickname?: string
  user_avatar?: string
}

export interface InviteToken {
  id: string
  token: string
  list_id: string
  created_by: string
  expires_at: string
  max_uses: number
  used_count: number
  created_at: string
}
