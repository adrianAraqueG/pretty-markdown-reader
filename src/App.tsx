import { Toaster } from 'sonner'
import { Lector } from '@/components/Lector'

export default function App() {
  return (
    <>
      <main className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-8 lg:py-10">
        <Lector />
      </main>
      <Toaster position="bottom-right" />
    </>
  )
}
