import { BskyAgent } from '@atproto/api'

const agent = new BskyAgent({ service: 'https://bsky.social' })

export async function searchBlueskyPosts(keyword: string) {
  // No login required for public search
  const response = await agent.searchPosts({ q: keyword, limit: 10 })
  return response.data.posts.map(post => ({
    id: post.uri,
    author: post.author.handle,
    content: post.text,
    timestamp: post.indexedAt,
    // Add more fields as needed
  }))
}