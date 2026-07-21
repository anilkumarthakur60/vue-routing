/**
 * Owns the active group stack and resolves it (plus a caller's transient
 * attributes) into a single {@link ResolvedContext}. The merge itself is a pure
 * function so it can be tested in isolation.
 */
import type { GroupAttributes, ResolvedContext } from '@/types'
import { convertLaravelParams, extractBindingFields, joinPaths } from '@/path'
import { appendRouteName } from '@/text'

/** Merge a list of group levels (outermost → innermost) into one context. */
export function mergeContext(levels: readonly GroupAttributes[]): ResolvedContext {
  const context: ResolvedContext = {
    prefix: '',
    namePrefix: '',
    middleware: [],
    excludedMiddleware: [],
    where: {},
    domain: undefined,
    bindingFields: {},
    layouts: [],
    scopeBindings: false,
    withoutScopedBindings: false,
    missing: undefined,
  }

  for (const level of levels) {
    if (level.prefix) {
      // Capture `{param:field}` binding columns BEFORE the brace syntax is
      // destroyed by the colon conversion — otherwise a custom key declared in
      // a group prefix is silently lost.
      Object.assign(context.bindingFields, extractBindingFields(level.prefix))
      context.prefix = joinPaths(context.prefix, convertLaravelParams(level.prefix))
    }
    if (level.namePrefix) context.namePrefix = appendRouteName(context.namePrefix, level.namePrefix)
    if (level.middleware?.length) context.middleware.push(...level.middleware)
    if (level.excludedMiddleware?.length)
      context.excludedMiddleware.push(...level.excludedMiddleware)
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
      // The stack pops synchronously, so an async callback would register
      // everything after its first `await` OUTSIDE the group — silently
      // dropping the prefix/middleware. Reject thenables loudly instead.
      const invoke: () => unknown = callback
      const result = invoke()
      if (isThenable(result)) {
        throw new Error(
          'group() callbacks must be synchronous — routes registered after an ' +
            'await would lose the group attributes. Await your imports before ' +
            'calling group().',
        )
      }
    } finally {
      this.levels.pop()
    }
  }

  /** A snapshot of the current stack (outermost → innermost). */
  public snapshot(): readonly GroupAttributes[] {
    return [...this.levels]
  }

  /**
   * Run a callback with the stack temporarily replaced by `levels`, restoring
   * the previous stack afterwards. Lets deferred registrations (pending
   * resources) execute in the group context where they were declared.
   */
  public runScoped(levels: readonly GroupAttributes[], callback: () => void): void {
    const saved = [...this.levels]
    this.levels.length = 0
    this.levels.push(...levels)
    try {
      callback()
    } finally {
      this.levels.length = 0
      this.levels.push(...saved)
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

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  )
}
