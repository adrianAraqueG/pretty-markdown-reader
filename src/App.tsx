import { Toaster } from 'sonner'
import { Lector } from '@/components/Lector'

const link = 'underline-offset-2 transition-colors hover:text-foreground hover:underline'

export default function App() {
  return (
    <>
      <p className="flex flex-wrap gap-x-4 px-4 pt-3 font-mono text-[11px] tracking-[0.04em] text-muted-foreground/70 sm:px-8">
        <span>
          author:{' '}
          <a href="https://www.linkedin.com/in/adrian-araque-dev/" target="_blank" rel="noreferrer noopener" className={link}>
            adrianAraqueG
          </a>
        </span>
        <span>
          repository:{' '}
          <a href="https://github.com/adrianAraqueG/pretty-markdown-reader" target="_blank" rel="noreferrer noopener" className={link}>
            pretty-markdown-reader
          </a>
        </span>
      </p>
      <main className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-8 lg:py-10">
        <Lector />
      </main>
      <Toaster position="bottom-right" />
    </>
  )
}
