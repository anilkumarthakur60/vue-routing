import { describe, expect, it } from 'vitest'
import { domainParamNames, domainToRegExp, matchDomain } from '@/path'

describe('domainParamNames', () => {
  it('lists the params declared in a domain pattern, in order', () => {
    expect(domainParamNames('{account}.example.com')).toEqual(['account'])
    expect(domainParamNames('{tenant}.{region}.example.com')).toEqual(['tenant', 'region'])
    expect(domainParamNames('example.com')).toEqual([])
  })
})

describe('domainToRegExp', () => {
  it('escapes literal characters so dots are not wildcards', () => {
    const re = domainToRegExp('admin.example.com')
    expect(re.test('admin.example.com')).toBe(true)
    expect(re.test('adminXexampleXcom')).toBe(false)
  })

  it('turns each {param} into a single-label capture', () => {
    const re = domainToRegExp('{account}.example.com')
    expect(re.test('acme.example.com')).toBe(true)
    // A dot inside the captured label must not match `[^.]+`.
    expect(re.test('a.b.example.com')).toBe(false)
  })

  it('matches case-insensitively (DNS hostnames are case-insensitive)', () => {
    expect(domainToRegExp('{account}.MyApp.com').test('acme.myapp.com')).toBe(true)
    expect(domainToRegExp('admin.example.com').test('ADMIN.EXAMPLE.COM')).toBe(true)
  })
})

describe('matchDomain', () => {
  it('extracts params from a matching hostname', () => {
    expect(matchDomain('{account}.example.com', 'acme.example.com')).toEqual({ account: 'acme' })
    expect(matchDomain('{tenant}.{region}.example.com', 'acme.eu.example.com')).toEqual({
      tenant: 'acme',
      region: 'eu',
    })
  })

  it('returns null when the hostname does not satisfy the pattern', () => {
    expect(matchDomain('{account}.example.com', 'acme.other.com')).toBeNull()
    expect(matchDomain('admin.example.com', 'evil.com')).toBeNull()
  })

  it('extracts params regardless of pattern casing', () => {
    expect(matchDomain('{account}.MyApp.com', 'acme.myapp.com')).toEqual({ account: 'acme' })
  })
})
