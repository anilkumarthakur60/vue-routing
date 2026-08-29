/** Fake user "database"  backs the resource + model-binding demos. */
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor'
}

const USERS: readonly User[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'editor' },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com', role: 'admin' },
]

export function allUsers(): readonly User[] {
  return USERS
}

/** Resolve a user by id; returns `null` when not found (drives `missing()`). */
export function findUser(id: string | number): User | null {
  const numeric = typeof id === 'number' ? id : Number.parseInt(id, 10)
  return USERS.find((user) => user.id === numeric) ?? null
}
