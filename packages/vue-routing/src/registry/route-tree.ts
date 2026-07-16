/**
 * Owns the route-record tree and the layout-wrapper nesting. The only records
 * in this tree that carry children are layout wrappers, tracked via a WeakMap
 * so child access stays fully typed (no union narrowing on RouteRecordRaw).
 */
import type { RouteRecordRaw } from 'vue-router'
import type { MiddlewareFn, RouteComponent } from '@/lib/types'
import { collapseSlashes, joinPaths } from '@/lib/path'

/** A layout wrapper node. */
interface LayoutWrapper {
  path: string
  component: RouteComponent
  children: RouteRecordRaw[]
}

/** A single row produced by {@link RouteTree.describe}. */
export interface RouteListRow {
  path: string
  name: string
  middleware: string
}

export class RouteTree {
  private readonly records: RouteRecordRaw[] = []
  private readonly wrappers = new WeakMap<RouteRecordRaw, LayoutWrapper>()

  /** The top-level route records (what `createRouter` expects). */
  public roots(): RouteRecordRaw[] {
    return this.records
  }

  /**
   * Insert a record, nesting it beneath one wrapper per layout (outermost
   * first). Wrappers are reused when an identical component already exists at
   * the same level.
   */
  public add(record: RouteRecordRaw, layouts: readonly RouteComponent[]): void {
    if (layouts.length === 0) {
      this.records.push(record)
      return
    }

    let level = this.records
    for (const layout of layouts) {
      const wrapperPath = level === this.records ? '/' : ''
      let node = this.findWrapper(level, layout, wrapperPath)
      if (!node) {
        node = { path: wrapperPath, component: layout, children: [] }
        const raw = {
          path: wrapperPath,
          component: layout,
          children: node.children,
        } as RouteRecordRaw
        this.wrappers.set(raw, node)
        level.push(raw)
      }
      level = node.children
    }

    // vue-router requires child paths to be relative.
    if (record.path.startsWith('/')) record.path = record.path.slice(1)
    level.push(record)
  }

  /** Flatten the tree into printable rows. */
  public describe(filterPath?: string): RouteListRow[] {
    const rows: RouteListRow[] = []
    const walk = (records: readonly RouteRecordRaw[], parentPath: string): void => {
      for (const record of records) {
        const fullPath = collapseSlashes(joinPaths(parentPath, record.path))
        const meta = record.meta ?? {}
        if (!filterPath || fullPath.startsWith(filterPath)) {
          rows.push({
            path: fullPath,
            name: typeof record.name === 'string' ? record.name : '-',
            middleware: (meta.middleware ?? []).map(describeMiddleware).join(', ') || '-',
          })
        }
        const node = this.wrappers.get(record)
        if (node) walk(node.children, fullPath)
      }
    }
    walk(this.records, '')
    return rows
  }

  public clear(): void {
    this.records.length = 0
  }

  private findWrapper(
    level: readonly RouteRecordRaw[],
    layout: RouteComponent,
    wrapperPath: string,
  ): LayoutWrapper | undefined {
    for (const raw of level) {
      const node = this.wrappers.get(raw)
      if (node?.component === layout && node.path === wrapperPath) return node
    }
    return undefined
  }
}

function describeMiddleware(middleware: MiddlewareFn): string {
  return middleware.name || 'anonymous'
}
