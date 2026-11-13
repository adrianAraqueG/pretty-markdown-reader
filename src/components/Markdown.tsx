import { isValidElement, type ComponentProps, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { ClipboardCopy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyText } from '@/lib/clipboard'

/** Texto plano de un nodo React (el código resaltado llega como spans anidados). */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

/** Bloque de código con botón de copiar. */
function CodePre({ children }: ComponentProps<'pre'>) {
  const lang = /language-([\w-]+)/.exec(isValidElement<{ className?: string }>(children) ? (children.props.className ?? '') : '')?.[1]
  return (
    <div className="group relative my-4">
      {lang && <span className="absolute left-4 top-2 font-mono text-[10px] uppercase tracking-[0.1em] text-rail-muted">{lang}</span>}
      <button
        type="button"
        onClick={() => void copyText(textOf(children).replace(/\n$/, ''))}
        aria-label="Copiar código"
        title="Copiar código"
        className="absolute right-2 top-2 rounded-[3px] p-1.5 text-rail-muted opacity-70 transition hover:bg-rail-line hover:text-rail-foreground hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <ClipboardCopy className="size-4" />
      </button>
      <pre className={cn('overflow-x-auto rounded-[3px] bg-rail p-4 pr-12 font-mono text-[12.5px] leading-relaxed text-rail-foreground', lang && 'pt-8')}>{children}</pre>
    </div>
  )
}

const linkClass = 'font-medium text-tide underline underline-offset-2 hover:text-ink'

const components: Components = {
  h1: ({ children, id }) => <h1 id={id} className="scroll-mt-20 mb-5 mt-10 font-sans text-4xl font-semibold leading-tight first:mt-0">{children}</h1>,
  h2: ({ children, id }) => <h2 id={id} className="scroll-mt-20 mb-3 mt-11 border-b border-border pb-2 font-sans text-2xl font-semibold first:mt-0">{children}</h2>,
  h3: ({ children, id }) => <h3 id={id} className="scroll-mt-20 mb-2 mt-8 font-sans text-lg font-semibold">{children}</h3>,
  h4: ({ children, id }) => <h4 id={id} className="scroll-mt-20 mb-1.5 mt-6 font-sans text-base font-semibold">{children}</h4>,
  h5: ({ children }) => <h5 className="mb-1 mt-5 font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{children}</h5>,
  h6: ({ children }) => <h6 className="mb-1 mt-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{children}</h6>,
  p: ({ children }) => <p className="my-4 max-w-[72ch] text-[15.5px] leading-[1.7]">{children}</p>,
  ul: ({ children }) => <ul className="my-4 grid max-w-[72ch] list-disc gap-2 pl-5 text-[15.5px] leading-[1.7] marker:text-beam">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 grid max-w-[72ch] list-decimal gap-2 pl-5 text-[15.5px] leading-[1.7] marker:font-mono">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-5 max-w-[72ch] border-l-[3px] border-tide bg-tide-soft px-4 py-2 text-[15.5px] leading-[1.7]">{children}</blockquote>,
  hr: () => <hr className="my-8 border-border" />,
  img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" className="my-4 max-w-full rounded-[3px] border" />,
  del: ({ children }) => <del className="text-muted-foreground">{children}</del>,
  li: ({ children, className }) => <li className={cn(className?.includes('task-list-item') && '-ml-5 list-none')}>{children}</li>,
  input: ({ type, checked }) =>
    type === 'checkbox' ? <input type="checkbox" checked={!!checked} disabled readOnly className="mr-2 size-3.5 translate-y-px accent-[hsl(var(--beam))]" /> : null,
  code: ({ children, className }) =>
    className?.includes('language-') ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-[2px] bg-secondary px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
    ),
  pre: CodePre,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-[3px] border">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-secondary">{children}</thead>,
  th: ({ children }) => <th className="border-b px-3.5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{children}</th>,
  td: ({ children }) => <td className="border-b px-3.5 py-3 align-top leading-relaxed last:border-b-0 [tr:last-child_&]:border-b-0">{children}</td>,
  a: ({ children, href }) => {
    // Los enlaces #ancla (índices que genera la IA) se resuelven con scroll suave, sin tocar la URL.
    if (href?.startsWith('#'))
      return (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault()
            let id = href.slice(1)
            try {
              id = decodeURIComponent(id)
            } catch {
              /* ancla mal codificada: se usa tal cual */
            }
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
          }}
          className={linkClass}
        >
          {children}
        </a>
      )
    const external = !!href && /^https?:\/\//i.test(href)
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})} className={linkClass}>
        {children}
      </a>
    )
  },
}

/** Renderiza markdown (GFM, títulos con ancla, código resaltado y copiable). El HTML crudo no se interpreta. */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false, ignoreMissing: true }]]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
