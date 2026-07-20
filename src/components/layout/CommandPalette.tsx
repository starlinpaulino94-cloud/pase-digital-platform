'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { navForRole, filtrarNavOculto } from '@/components/layout/nav-config'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { AppRole } from '@/types'

/**
 * Paleta de comandos (Cmd+K / Ctrl+K): navegación rápida a cualquier sección
 * del panel, agrupada como el sidebar. Complementa el buscador del header.
 */
export function CommandPalette({ role, hiddenNav }: { role: AppRole; hiddenNav?: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const groups = filtrarNavOculto(navForRole(role), hiddenNav ?? [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Ir a…"
      description="Navega a cualquier sección del panel"
    >
      <CommandInput placeholder="¿A dónde quieres ir?" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.href}
                  value={`${group.label} ${item.label}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
