// Hitokoto API client
// API documentation: https://developer.hitokoto.cn/sentence/

export interface HitokotoResponse {
  id: number
  hitokoto: string
  type: string
  from: string
  from_who: string | null
  creator: string
  creator_uid: number
  reviewer: number
  uuid: string
  created_at: string
}

const HITOKOTO_API = 'https://v1.hitokoto.cn/'

// Categories: c=d (literature), c=k (philosophy), c=i (poetry)
// max_length limits character count for card display
export async function fetchQuote(): Promise<HitokotoResponse> {
  // Hitokoto API accepts multiple c= params: d=literature, k=philosophy, i=poetry
  const url = `${HITOKOTO_API}?c=d&c=k&c=i&max_length=60`

  const res = await fetch(url, {
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Hitokoto API error: ${res.status}`)
  }

  return res.json()
}
