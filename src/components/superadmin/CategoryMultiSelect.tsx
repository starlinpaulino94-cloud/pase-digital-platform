'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export interface CategoryOption {
  id: string
  name: string
  icon: string | null
}

interface CategoryMultiSelectProps {
  categories: CategoryOption[]
  defaultSelected?: string[]
}

/**
 * Selector múltiple de categorías de negocio como chips.
 * Cada chip es un <input type="checkbox" name="categoryIds"> real, por lo que
 * las seleccionadas viajan en el FormData del server action sin lógica extra
 * (formData.getAll('categoryIds')).
 */
export function CategoryMultiSelect({
  categories,
  defaultSelected = [],
}: CategoryMultiSelectProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelected)
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (categories.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay categorías disponibles. Ejecuta el seed de categorías primero.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const active = selected.has(c.id)
        return (
          <label
            key={c.id}
            className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'border-border bg-background text-muted-foreground hover:border-blue-300 hover:text-foreground'
            }`}
          >
            <input
              type="checkbox"
              name="categoryIds"
              value={c.id}
              checked={active}
              onChange={() => toggle(c.id)}
              className="sr-only"
            />
            {active && <Check className="h-3.5 w-3.5" />}
            {c.name}
          </label>
        )
      })}
    </div>
  )
}
