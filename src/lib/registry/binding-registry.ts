/** Owns the explicit model-binding resolvers keyed by parameter name. */
import type { BindingResolver } from '@/lib/types'

export class BindingRegistry {
  private readonly resolvers = new Map<string, BindingResolver>()

  public set(param: string, resolver: BindingResolver): void {
    this.resolvers.set(param, resolver)
  }

  public get(param: string): BindingResolver | undefined {
    return this.resolvers.get(param)
  }

  /** The underlying map, to hand to {@link createAppRouter}. */
  public all(): Map<string, BindingResolver> {
    return this.resolvers
  }

  public clear(): void {
    this.resolvers.clear()
  }
}
