import { describe, expect, it } from 'vitest'
import { splitWords, pluralize, singularize, appendRouteName } from '@/lib'

describe('splitWords', () => {
  it('splits camelCase, PascalCase, kebab-case, and snake_case', () => {
    expect(splitWords('userProfile')).toEqual(['user', 'profile'])
    expect(splitWords('UserProfile')).toEqual(['user', 'profile'])
    expect(splitWords('user-profile')).toEqual(['user', 'profile'])
    expect(splitWords('user_profile')).toEqual(['user', 'profile'])
    expect(splitWords('apiV2Client')).toEqual(['api', 'v2', 'client'])
  })

  it('trims and drops empties', () => {
    expect(splitWords('  __foo--bar__ ')).toEqual(['foo', 'bar'])
    expect(splitWords('')).toEqual([])
  })
})

describe('pluralize', () => {
  it('handles the common English cases', () => {
    expect(pluralize('user')).toBe('users')
    expect(pluralize('category')).toBe('categories')
    expect(pluralize('box')).toBe('boxes')
    expect(pluralize('bus')).toBe('buses')
    expect(pluralize('knife')).toBe('knives')
    expect(pluralize('hero')).toBe('heroes')
    expect(pluralize('studio')).toBe('studios')
  })
})

describe('singularize', () => {
  it('inverts the common English cases', () => {
    expect(singularize('users')).toBe('user')
    expect(singularize('categories')).toBe('category')
    expect(singularize('boxes')).toBe('box')
    expect(singularize('photos')).toBe('photo')
    expect(singularize('comments')).toBe('comment')
  })

  it('leaves already-singular or invariant words alone', () => {
    expect(singularize('class')).toBe('class')
    expect(singularize('user')).toBe('user')
  })
})

describe('appendRouteName', () => {
  it('joins with a dot, respecting an explicit trailing dot', () => {
    expect(appendRouteName('', 'index')).toBe('index')
    expect(appendRouteName('users', 'index')).toBe('users.index')
    expect(appendRouteName('admin.', 'users')).toBe('admin.users')
    expect(appendRouteName('a', 'b.c')).toBe('a.b.c')
  })
})
