import { ThemeToggle } from './components/ThemeToggle'
import { FarcasterFeed } from './components/FarcasterFeed'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Caster</h1>
          <ThemeToggle />
        </div>
        
        <FarcasterFeed />
      </div>
    </main>
  )
}