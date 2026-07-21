/** Owns the explicit model-binding resolvers keyed by parameter name. */
import type { BindingResolver } from '@/types'

export class BindingRegistry {
  private readonly resolvers = new Map<string, BindingResolver>()

  public set(param: string, resolver: BindingResolver): void {
    this.resolvers.set(param, resolver)
  }

  /** Read-only view of the registered resolvers. */
  public all(): ReadonlyMap<string, BindingResolver> {
    return this.resolvers
  }

  public clear(): void {
    this.resolvers.clear()
  }
}
