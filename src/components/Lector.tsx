import { useEffect, useRef, useState } from 'react'
import { BookOpenText, ClipboardCopy, List, ClipboardPaste, Eraser, FileUp, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { copyText } from '@/lib/clipboard'
import { Markdown } from '@/components/Markdown'

const KEY = 'markdown-reader:draft'
// El borrador vive solo en el navegador de quien lo pega: nada se envía a ningún servidor.
const load = () => {
  try {
    return window.localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}
const store = (v: string) => {
  try {
    if (v) window.localStorage.setItem(KEY, v)
    else window.localStorage.removeItem(KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

type Heading = { id: string; text: string; level: number }

/** Índice del documento: se lee de los títulos ya renderizados (así coincide siempre con los ids de la página). */
function useHeadings(root: React.RefObject<HTMLElement | null>, source: string) {
  const [items, setItems] = useState<Heading[]>([])
  const [active, setActive] = useState('')
  useEffect(() => {
    const hs = Array.from(root.current?.querySelectorAll<HTMLElement>('h1[id],h2[id],h3[id]') ?? [])
    setItems(hs.map((h) => ({ id: h.id, text: h.textContent ?? '', level: Number(h.tagName[1]) })))
    const onScroll = () => {
      let cur = hs[0]?.id ?? ''
      for (const h of hs) if (h.getBoundingClientRect().top <= 120) cur = h.id
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [root, source])
  return { items, active }
}

function TocList({ items, active }: { items: Heading[]; active: string }) {
  const base = Math.min(...items.map((i) => i.level))
  return (
    <ul className="grid gap-0.5 border-l border-border">
      {items.map((i) => (
        <li key={i.id}>
          <a
            href={'#' + i.id}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(i.id)?.scrollIntoView({ behavior: 'smooth' })
            }}
            aria-current={active === i.id ? 'location' : undefined}
            style={{ paddingLeft: (i.level - base) * 12 + 12 }}
            className={cn(
              '-ml-px block border-l-2 py-1 pr-2 text-[13px] leading-snug transition-colors',
              active === i.id ? 'border-beam font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {i.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Lector() {
  const [text, setText] = useState(load)
  const [editing, setEditing] = useState(() => !load().trim())
  const [over, setOver] = useState(false)
  const area = useRef<HTMLTextAreaElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const doc = useRef<HTMLDivElement>(null)

  useEffect(() => store(text), [text])
  useEffect(() => {
    if (editing) area.current?.focus()
  }, [editing])

  const read = (value: string) => {
    setText(value)
    setEditing(!value.trim())
  }

  async function paste() {
    try {
      read(await navigator.clipboard.readText())
    } catch {
      toast.error('El navegador no dejó leer el portapapeles', { description: 'Pega con Ctrl+V dentro del recuadro.' })
      area.current?.focus()
    }
  }

  async function readFile(file?: File) {
    if (!file) return
    if (file.size > 5_000_000) return void toast.error('El archivo es demasiado grande para el lector (máx. 5 MB)')
    read(await file.text())
  }

  const reading = !editing && !!text.trim()
  const { items, active } = useHeadings(doc, reading ? text : '')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const minutes = Math.max(1, Math.round(words / 200))
  const docTitle = items.find((i) => i.level === 1)?.text ?? items[0]?.text ?? 'Documento sin título'

  useEffect(() => {
    document.title = reading ? `${docTitle} · Pretty Markdown Reader` : 'Pretty Markdown Reader'
  }, [reading, docTitle])

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="beam" onClick={() => read(text)} disabled={!text.trim()}>
        <BookOpenText /> Leer
      </Button>
      <Button variant="outline" onClick={() => void paste()}>
        <ClipboardPaste /> Pegar del portapapeles
      </Button>
      <Button variant="outline" onClick={() => picker.current?.click()}>
        <FileUp /> Abrir archivo .md
      </Button>
      {text.trim() && (
        <Button variant="ghost" onClick={() => setText('')}>
          <Eraser /> Vaciar
        </Button>
      )}
    </div>
  )

  return (
    <>
      {!reading && (
        <header className="mb-12 border-b border-border pb-9">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 flex items-center gap-2">
              <span aria-hidden className="inline-block h-px w-6 bg-beam" />
              Utilidad extraída de FARO ©
            </p>
            <h1 className="font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.05]">Pretty Markdown Reader</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Pega el markdown y léelo con formato. El borrador queda solo en tu navegador.
            </p>
          </div>
        </header>
      )}

      <input
        ref={picker}
        hidden
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={(e) => {
          void readFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {reading ? (
        // El documento y el índice forman un solo bloque centrado: el índice queda pegado a la hoja en cualquier ancho.
        <div className="mx-auto xl:grid xl:max-w-fit xl:grid-cols-[minmax(0,62rem)_14rem] xl:justify-center xl:gap-8">
          <div className="min-w-0">
            {items.length > 1 && (
              <details className="mb-5 rounded-[3px] border bg-card px-4 py-3 xl:hidden">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <List className="size-4" /> Contenido
                </summary>
                <div className="mt-3 max-h-72 overflow-y-auto">
                  <TocList items={items} active={active} />
                </div>
              </details>
            )}
            {/* La hoja: el documento en su propia superficie y con su propia barra */}
            <article className="rounded-[3px] border bg-card shadow-[0_1px_2px_hsl(var(--ink)/0.06),0_16px_36px_-16px_hsl(var(--ink)/0.18)]">
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-t-[3px] border-b bg-card/95 px-5 py-3 backdrop-blur sm:px-8">
                <div className="min-w-0">
                  <p className="truncate font-sans text-[15px] font-semibold leading-tight">{docTitle}</p>
                  <p className="tnum mt-0.5 text-xs text-muted-foreground">
                    {words.toLocaleString('es-CO')} palabras · {minutes} min de lectura
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => void copyText(text)}>
                    <ClipboardCopy /> Copiar markdown
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil /> Ver texto original
                  </Button>
                  <Button variant="beam" size="sm" onClick={() => read('')}>
                    <Eraser /> Pegar otro
                  </Button>
                </div>
              </div>
              <div ref={doc} className="px-5 py-8 sm:px-12 sm:py-12">
                <Markdown>{text}</Markdown>
              </div>
            </article>
          </div>
          {items.length > 1 && (
            <aside aria-label="Contenido" className="hidden xl:block">
              <div className="sticky top-8 max-h-[calc(100dvh-4rem)] overflow-y-auto">
                <p className="eyebrow mb-3">Contenido</p>
                <TocList items={items} active={active} />
              </div>
            </aside>
          )}
        </div>
      ) : (
        <section
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            void readFile(e.dataTransfer.files[0])
          }}
          className={cn('grid max-w-4xl gap-4 rounded-[3px] border-2 border-dashed p-5 transition-colors', over ? 'border-beam bg-beam-soft' : 'border-input bg-card')}
        >
          <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b bg-card px-5 py-3">{toolbar}</div>
          <textarea
            ref={area}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              // al pegar sobre un recuadro vacío se pasa directo a lectura
              if (text.trim()) return
              const pasted = e.clipboardData.getData('text')
              if (pasted.trim()) {
                e.preventDefault()
                read(pasted)
              }
            }}
            aria-label="Markdown a leer"
            placeholder="Pega aquí el markdown (Ctrl+V) o arrastra un archivo .md…"
            spellCheck={false}
            className="min-h-[18rem] w-full resize-y rounded-[3px] bg-transparent p-2 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          {toolbar}
        </section>
      )}
    </>
  )
}
