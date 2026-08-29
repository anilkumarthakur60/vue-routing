/** Fake article store  backs the scoped-binding + custom-key demo. */
import type { User } from './users'

export interface Article {
  slug: string
  title: string
  authorId: number
}

const ARTICLES: readonly Article[] = [
  { slug: 'hello-world', title: 'Hello, World', authorId: 1 },
  { slug: 'on-routing', title: 'On Client-side Routing', authorId: 1 },
  { slug: 'type-safety', title: 'Type Safety End to End', authorId: 2 },
]

/**
 * Resolve an article by its `slug`, scoped to a parent author when present.
 * `parent` is the already-resolved `{user}` model (passed by the router because
 * the route opted into `scopeBindings()`). Returns `null` when not found or when
 * the article does not belong to the scoped author  which drives `missing()`.
 */
export function findArticle(slug: string, parent: unknown): Article | null {
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return null
  const author = parent as User | undefined
  if (author && article.authorId !== author.id) return null
  return article
}
