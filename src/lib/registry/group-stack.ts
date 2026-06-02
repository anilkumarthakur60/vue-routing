/**
 * Owns the active group stack and resolves it (plus a caller's transient
 * attributes) into a single {@link ResolvedContext}. The merge itself is a pure
 * function so it can be tested in isolation.
 */
import type { GroupAttributes, ResolvedContext } from '@/lib/types'
import { convertLaravelParams, joinPaths } from '@/lib/path'
import { appendRouteName } from '@/lib/text'

/** Merge a list of group levels (outermost → innermost) into one context. */
export function mergeContext(levels: readonly GroupAttributes[]): ResolvedContext {
  const context: ResolvedContext = {
    prefix: '',
    namePrefix: '',
    middleware: [],
    excludedMiddleware: [],
    where: {},
    domain: undefined,
    layouts: [],
    scopeBindings: false,
    withoutScopedBindings: false,
    missing: undefined,
  }

  for (const level of levels) {
    if (level.prefix) context.prefix = joinPaths(context.prefix, convertLaravelParams(level.prefix))
    if (level.namePrefix) context.namePrefix = appendRouteName(context.namePrefix, level.namePrefix)
    if (level.middleware?.length) context.middleware.push(...level.middleware)
    if (level.excludedMiddleware?.length) context.excludedMiddleware.push(...level.excludedMiddleware)
    if (level.where) context.where = { ...context.where, ...level.where }
    if (level.domain !== undefined) context.domain = level.domain
    if (level.layout) context.layouts.push(level.layout)
    if (level.scopeBindings) context.scopeBindings = true
    if (level.withoutScopedBindings) context.withoutScopedBindings = true
    if (level.missing) context.missing = level.missing
  }

  return context
}

export class GroupStack {
  private readonly levels: GroupAttributes[] = []

  /** Run a callback with `attributes` pushed onto the stack, popping after. */
  public run(attributes: GroupAttributes, callback: () => void): void {
    this.levels.push(attributes)
    try {
      callback()
    } finally {
      this.levels.pop()
    }
  }

  /** Resolve the current stack plus the caller's transient attributes. */
  public resolve(transient: GroupAttributes): ResolvedContext {
    return mergeContext([...this.levels, transient])
  }

  public clear(): void {
    this.levels.length = 0
  }
}
