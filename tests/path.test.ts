import { describe, expect, it } from 'vitest'
import {
  collapseSlashes,
  compileUrl,
  convertLaravelParams,
  ensureLeadingSlash,
  extractBindingFields,
  extractParamNames,
  joinPaths,
} from '@/lib'
import { applyWhereConstraints, patterns } from '@/lib'

describe('ensureLeadingSlash', () => {
  it('adds a leading slash and maps empty to root', () => {
    expect(ensureLeadingSlash('')).toBe('/')
    expect(ensureLeadingSlash('users')).toBe('/users')
    expect(ensureLeadingSlash('/users')).toBe('/users')
  })
})

describe('collapseSlashes', () => {
  it('collapses duplicates and trims trailing slash (keeping root)', () => {
    expect(collapseSlashes('/a//b/')).toBe('/a/b')
    expect(collapseSlashes('/')).toBe('/')
    expect(collapseSlashes('/a/')).toBe('/a')
  })
})

describe('joinPaths', () => {
  it('joins segments into a normalized absolute path', () => {
    expect(joinPaths('', 'login')).toBe('/login')
    expect(joinPaths('/users', '/:id')).toBe('/users/:id')
    expect(joinPaths('/users', '')).toBe('/users')
    expect(joinPaths('', '')).toBe('/')
    expect(joinPaths('/a/', '/b')).toBe('/a/b')
  })
})

describe('convertLaravelParams', () => {
  it('converts required, optional, and custom-key params', () => {
    expect(convertLaravelParams('{id}')).toBe(':id')
    expect(convertLaravelParams('users/{id}')).toBe('users/:id')
    expect(convertLaravelParams('user/{name?}')).toBe('user/:name?')
    expect(convertLaravelParams('{post:slug}')).toBe(':post')
    expect(convertLaravelParams('users/{user}/posts/{post:slug}')).toBe('users/:user/posts/:post')
  })

  it('leaves colon syntax untouched', () => {
    expect(convertLaravelParams('users/:id')).toBe('users/:id')
  })
})

describe('extractBindingFields', () => {
  it('captures the custom column for {param:column}', () => {
    expect(extractBindingFields('users/{user}/posts/{post:slug}')).toEqual({ post: 'slug' })
    expect(extractBindingFields('users/{id}')).toEqual({})
  })
})

describe('extractParamNames', () => {
  it('lists params with optionality', () => {
    expect(extractParamNames('/users/:id')).toEqual([{ name: 'id', optional: false }])
    expect(extractParamNames('/users/:name?')).toEqual([{ name: 'name', optional: true }])
  })
})

describe('applyWhereConstraints', () => {
  it('injects regex into matching params', () => {
    expect(applyWhereConstraints('/user/:id', { id: patterns.number })).toBe('/user/:id([0-9]+)')
  })

  it('does not double-apply when a constraint already exists', () => {
    expect(applyWhereConstraints('/user/:id([0-9]+)', { id: '\\w+' })).toBe('/user/:id([0-9]+)')
  })

  it('respects global patterns with per-route overrides taking precedence', () => {
    expect(applyWhereConstraints('/u/:id', { id: 'a' }, { id: 'b' })).toBe('/u/:id(a)')
  })
})

describe('compileUrl', () => {
  it('substitutes required params', () => {
    expect(compileUrl('/posts/:id', { id: 5 })).toBe('/posts/5')
  })

  it('appends leftover params as a query string', () => {
    expect(compileUrl('/posts/:id', { id: 5, page: 2 })).toBe('/posts/5?page=2')
  })

  it('drops missing optional params', () => {
    expect(compileUrl('/users/:name?', {})).toBe('/users')
    expect(compileUrl('/users/:name?', { name: 'ada' })).toBe('/users/ada')
  })

  it('strips inline regex constraints', () => {
    expect(compileUrl('/user/:id([0-9]+)', { id: 7 })).toBe('/user/7')
  })

  it('throws for a missing required param', () => {
    expect(() => compileUrl('/posts/:id', {})).toThrow(/Missing required parameter "id"/)
  })

  it('encodes param and query values', () => {
    expect(compileUrl('/search/:q', { q: 'a b', tag: 'c&d' })).toBe('/search/a%20b?tag=c%26d')
  })
})
