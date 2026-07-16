/** Owns the named-route map and named-route URL generation. */
import type { NamedRouteEntry } from '@/lib/types'
import { compileUrl, type ParamValue } from '@/lib/path'

export class NameRegistry {
  private readonly entries = new Map<string, NamedRouteEntry>()

  /** Register a name; throws if it already exists (names must be unique). */
  public register(name: string, entry: NamedRouteEntry): void {
    if (this.entries.has(name)) {
      throw new Error(`Route name "${name}" is already defined.`)
    }
    this.entries.set(name, entry)
  }

  public has(name: string): boolean {
    return this.entries.has(name)
  }

  /** Generate a URL for a named route (Laravel's `route()` helper). */
  public url(name: string, params: Record<string, ParamValue> = {}): string {
    const entry = this.entries.get(name)
    if (!entry) throw new Error(`Route "${name}" is not defined.`)
    // Per-route defaults fill in any params the caller omitted.
    const defaults = entry.record.meta?.defaults ?? {}
    return compileUrl(entry.absolutePath, { ...defaults, ...params })
  }

  public clear(): void {
    this.entries.clear()
  }
}
