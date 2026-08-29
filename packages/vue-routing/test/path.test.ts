import { describe, expect, it } from 'vitest'
import {
  collapseSlashes,
  compileUrl,
  convertLaravelParams,
  ensureLeadingSlash,
  extractBindingFields,
  extractParamNames,
  joinPaths,
} from '@anil-labs/vue-routing'
import { applyWhereConstraints, patterns } from '@anil-labs/vue-routing'

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

  it('converts an optional custom-key param (audit test gap)', () => {
    expect(convertLaravelParams('p/{post:slug?}')).toBe('p/:post?')
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

  it('captures the column of an optional custom key (audit test gap)', () => {
    expect(extractBindingFields('p/{post:slug?}')).toEqual({ post: 'slug' })
  })
})

describe('extractParamNames', () => {
  it('lists params with optionality', () => {
    expect(extractParamNames('/users/:id')).toEqual([{ name: 'id', optional: false }])
    expect(extractParamNames('/users/:name?')).toEqual([{ name: 'name', optional: true }])
  })

  it('parses params carrying an inline regex (audit test gap)', () => {
    expect(extractParamNames('/u/:id([0-9]+)')).toEqual([{ name: 'id', optional: false }])
    expect(extractParamNames('/u/:id([0-9]+)?')).toEqual([{ name: 'id', optional: true }])
  })

  it('treats zero-or-more (*) as optional and one-or-more (+) as required', () => {
    expect(extractParamNames('/:pathMatch(.*)*')).toEqual([{ name: 'pathMatch', optional: true }])
    expect(extractParamNames('/files/:path+')).toEqual([{ name: 'path', optional: false }])
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

  it('guards against param-name prefix collisions (audit test gap)', () => {
    expect(applyWhereConstraints('/x/:id/:idea', { id: '[0-9]+' })).toBe('/x/:id([0-9]+)/:idea')
    expect(applyWhereConstraints('/x/:idea', { id: '[0-9]+' })).toBe('/x/:idea')
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

describe('compileUrl  wildcard/repeatable params (audit: catch-all URL generation)', () => {
  it('omits an absent zero-or-more (*) param like an optional one', () => {
    expect(compileUrl('/:pathMatch(.*)*', {})).toBe('/')
    expect(compileUrl('/admin/:pathMatch(.*)*', {})).toBe('/admin')
  })

  it('splits a string value on / and encodes each segment', () => {
    expect(compileUrl('/:pathMatch(.*)*', { pathMatch: 'x/y' })).toBe('/x/y')
    expect(compileUrl('/files/:path(.*)*', { path: 'a b/c' })).toBe('/files/a%20b/c')
  })

  it('joins an array value with one encoded segment per element', () => {
    expect(compileUrl('/files/:path*', { path: ['a b', 'c'] })).toBe('/files/a%20b/c')
    expect(compileUrl('/files/:path+', { path: ['x'] })).toBe('/files/x')
  })

  it('still requires a one-or-more (+) param', () => {
    expect(() => compileUrl('/files/:path+', {})).toThrow(/Missing required parameter "path"/)
    expect(() => compileUrl('/files/:path+', { path: [] })).toThrow(/must not be empty/)
  })
})

describe('compileUrl  empty required param values (audit: silent wrong URL)', () => {
  it('throws instead of generating a shorter, wrong URL', () => {
    expect(() => compileUrl('/users/:id/edit', { id: '' })).toThrow(
      /Parameter "id" for route "\/users\/:id\/edit" must not be empty/,
    )
  })

  it('collapses an empty optional param without leaking it into the query', () => {
    expect(compileUrl('/users/:name?', { name: '' })).toBe('/users')
  })
})

describe('compileUrl  edge values (audit test gap)', () => {
  it('stringifies boolean params', () => {
    expect(compileUrl('/f/:flag', { flag: true })).toBe('/f/true')
    expect(compileUrl('/f/:flag', { flag: false })).toBe('/f/false')
  })

  it('joins multiple leftover params with &', () => {
    expect(compileUrl('/p/:id', { id: 1, a: 'x', b: 'y' })).toBe('/p/1?a=x&b=y')
  })

  it('collapses a mid-path optional param', () => {
    expect(compileUrl('/a/:x?/b', {})).toBe('/a/b')
  })

  it('expands an array leftover into repeated query keys', () => {
    expect(compileUrl('/p/:id', { id: 1, tag: ['a', 'b'] })).toBe('/p/1?tag=a&tag=b')
  })
})
