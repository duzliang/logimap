export interface NodeDiff {
  field: string
  oldValue: unknown
  newValue: unknown
  kind: 'added' | 'removed' | 'changed' | 'unchanged'
}

const diffableFields = [
  'name',
  'summary',
  'status',
  'priority',
  'trigger',
  'dependsOn',
  'mainFlow',
  'branches',
  'edgeCases',
  'codeRef',
  'tags',
  'notes',
  'positionX',
  'positionY'
]

function normalizeForCompare(value: unknown): unknown {
  if (value == null) return value
  if (Array.isArray(value)) {
    return value.map(normalizeForCompare).sort(compareSerialized)
  }
  if (typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort()) {
      sorted[key] = normalizeForCompare((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

function compareSerialized(a: unknown, b: unknown): number {
  return JSON.stringify(a).localeCompare(JSON.stringify(b))
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  return compareSerialized(normalizeForCompare(a), normalizeForCompare(b)) === 0
}

export function diffNodes(
  base: Record<string, unknown>,
  target: Record<string, unknown>
): NodeDiff[] {
  return diffableFields.map((field) => {
    const oldValue = base[field]
    const newValue = target[field]

    if (isEqual(oldValue, newValue)) {
      return { field, oldValue, newValue, kind: 'unchanged' }
    }

    const oldEmpty = oldValue == null || (Array.isArray(oldValue) && oldValue.length === 0)
    const newEmpty = newValue == null || (Array.isArray(newValue) && newValue.length === 0)

    if (oldEmpty && newEmpty) {
      return { field, oldValue, newValue, kind: 'unchanged' }
    }

    if (oldEmpty && !newEmpty) {
      return { field, oldValue, newValue, kind: 'added' }
    }

    if (!oldEmpty && newEmpty) {
      return { field, oldValue, newValue, kind: 'removed' }
    }

    return { field, oldValue, newValue, kind: 'changed' }
  })
}
