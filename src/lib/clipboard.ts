import { toast } from 'sonner'

/** Copia al portapapeles; si el navegador no lo permite (p. ej. contexto no seguro) usa el método antiguo. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copiado')
    return
  } catch {
    /* se intenta el método de respaldo */
  }
  const area = document.createElement('textarea')
  area.value = text
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (ok) toast.success('Copiado')
  else toast.error('No se pudo copiar', { description: 'Selecciona el texto y copia con Ctrl+C.' })
}
