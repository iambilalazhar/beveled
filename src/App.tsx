import { useEffect, useMemo, useState } from 'react'
import Editor from '@/editor/Editor'
import { Button } from '@/components/ui/button'
import './App.css'
import { Github, ArrowRight, Sparkles, Palette, Circle, Grid3X3, Image } from 'lucide-react'

// Import tools
import GradientGenerator from '@/tools/GradientGenerator'
import BackgroundGenerator from '@/tools/BackgroundGenerator'
import BlobGenerator from '@/tools/BlobGenerator'
import MeshGradientGenerator from '@/tools/MeshGradientGenerator'

type RoutePath = '/' | '/editor' | '/terms' | '/tools/gradient' | '/tools/background' | '/tools/blob' | '/tools/mesh-gradient'

function useRoute(): [RoutePath, (path: RoutePath) => void] {
  const getPath = () => (window.location.pathname as RoutePath) || '/'
  const [path, setPath] = useState<RoutePath>(getPath())

  useEffect(() => {
    const onPop = () => setPath(getPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (p: RoutePath) => {
    if (p === path) return
    window.history.pushState({}, '', p)
    setPath(p)
    window.scrollTo(0, 0)
  }

  return [path, navigate]
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img src="/beveled_icon.png" alt="beveled" width={22} height={22} />
      <span className="logo-wordmark lowercase">beveled</span>
    </div>
  )
}

interface ToolCardProps {
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  onClick: () => void
  featured?: boolean
}

function ToolCard({ title, description, icon, gradient, onClick, featured }: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-card text-left transition-all hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity ${gradient}`} />
      <div className={`relative p-6 ${featured ? 'md:p-10' : ''}`}>
        <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg mb-4`}>
          {icon}
        </div>
        <h3 className={`font-semibold mb-2 ${featured ? 'text-2xl' : 'text-lg'}`}>{title}</h3>
        <p className={`text-muted-foreground ${featured ? 'text-base' : 'text-sm'}`}>{description}</p>
        <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Try now <ArrowRight className="size-4" />
        </div>
      </div>
    </button>
  )
}

function HomePage(props: { onUpload: (blob: Blob) => void; goTo: (p: RoutePath) => void }) {
  const fileInputId = useMemo(() => 'upload-' + Math.random().toString(36).slice(2), [])
  const webstoreUrl = 'https://chromewebstore.google.com/detail/beveled/kpdehbgphkkcedapekaaanpbajfmifjf'

  const tools = [
    {
      title: 'Screenshot Editor',
      description: 'Transform screenshots into stunning visuals with backgrounds, shadows, and professional styling. Add text, shapes, and window chrome.',
      icon: <Image className="size-6" />,
      gradient: 'from-[#e05d38] to-[#ff8a65]',
      path: '/editor' as RoutePath,
      featured: true
    },
    {
      title: 'Gradient Generator',
      description: 'Create beautiful CSS gradients with an intuitive visual editor.',
      icon: <Palette className="size-5" />,
      gradient: 'from-[#667eea] to-[#764ba2]',
      path: '/tools/gradient' as RoutePath
    },
    {
      title: 'Mesh Gradient',
      description: 'Design stunning mesh gradients with multiple color points.',
      icon: <Sparkles className="size-5" />,
      gradient: 'from-[#f093fb] to-[#f5576c]',
      path: '/tools/mesh-gradient' as RoutePath
    },
    {
      title: 'Background Patterns',
      description: 'Generate seamless CSS patterns for your designs.',
      icon: <Grid3X3 className="size-5" />,
      gradient: 'from-[#11998e] to-[#38ef7d]',
      path: '/tools/background' as RoutePath
    },
    {
      title: 'Blob Generator',
      description: 'Create organic blob shapes for modern designs.',
      icon: <Circle className="size-5" />,
      gradient: 'from-[#4facfe] to-[#00f2fe]',
      path: '/tools/blob' as RoutePath
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4">
            <a
              href="https://github.com/iambilalazhar/beveled"
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="size-5" />
            </a>
            <Button
              asChild
              size="sm"
              className="bg-[#e05d38] hover:bg-[#d14d28] text-white"
            >
              <a href={webstoreUrl} target="_blank" rel="noreferrer noopener">
                Add to Chrome
              </a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 home-gradient opacity-50" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="size-4" />
              Free design tools for developers
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Design Tools That{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e05d38] to-[#ff8a65]">
                Just Work
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              A collection of free, privacy-first design tools. Create beautiful screenshots, gradients, patterns, and more — all processed locally in your browser.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto bg-[#e05d38] hover:bg-[#d14d28] text-white border-0 shadow-lg shadow-[#e05d38]/25 hover:shadow-[#e05d38]/40 transition-all"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                Upload Screenshot
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto"
                onClick={() => props.goTo('/editor')}
              >
                Open Editor
              </Button>
            </div>
            <input
              id={fileInputId}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) props.onUpload(f)
              }}
            />
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">All Tools</h2>
            <p className="text-muted-foreground">Everything you need to create stunning visuals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {tools.map((tool, i) => (
              <ToolCard
                key={i}
                {...tool}
                onClick={() => props.goTo(tool.path)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">100% Private</h3>
              <p className="text-muted-foreground text-sm">
                All processing happens in your browser. Your files never leave your device.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm">
                No uploads or server processing. Get results instantly with zero latency.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Completely Free</h3>
              <p className="text-muted-foreground text-sm">
                No sign-up, no watermarks, no limits. Use all tools without restrictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Get the Chrome Extension</h2>
          <p className="text-muted-foreground mb-8">
            Capture screenshots directly from any webpage and edit them instantly with Beveled.
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-[#e05d38] hover:bg-[#d14d28] text-white"
          >
            <a href={webstoreUrl} target="_blank" rel="noreferrer noopener">
              Add to Chrome — It's Free
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src="/beveled_icon.png" alt="Beveled" width={20} height={20} />
              <span>© 2025 Beveled. All rights reserved.</span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <a
                href="https://beveled.app/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                onClick={(e) => { e.preventDefault(); props.goTo('/terms') }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="https://github.com/iambilalazhar/beveled"
                target="_blank"
                rel="noreferrer noopener"
                className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Github className="size-4" />
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TermsPage(props: { goTo: (p: RoutePath) => void }) {
  useEffect(() => { document.title = 'Beveled – Terms of Service' }, [])
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <Button variant="outline" size="sm" onClick={() => props.goTo('/')}>← Back to Home</Button>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
              <p className="leading-7">
                By accessing and using Beveled ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
              <p className="leading-7">
                Beveled is a screenshot enhancement tool that allows users to add backgrounds, shadows, frames, and other visual elements to their images. The Service is available as both a web application and browser extension.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p className="leading-7">You agree to use Beveled only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 leading-7 mt-4">
                <li>Use the Service for any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>Violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>Infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>Submit false or misleading information</li>
                <li>Upload or transmit viruses or any other type of malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">User Content</h2>
              <div className="space-y-4">
                <p className="leading-7">
                  You retain full ownership of any images, screenshots, or other content you upload to Beveled. We do not claim ownership of your content. All processing occurs locally in your browser, and we do not store or have access to your images.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
              <p className="leading-7">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Disclaimers</h2>
              <p className="leading-7">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. BEVELED MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="leading-7">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-medium">Email: legal@beveled.app</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [route, navigate] = useRoute()
  const [initialImage, setInitialImage] = useState<Blob | string | null>(null)

  useEffect(() => {
    if (route === '/') document.title = 'Beveled - Free Design Tools for Developers'
    if (route === '/editor') document.title = 'Screenshot Editor - Beveled'
  }, [route])

  const onUpload = (blob: Blob) => {
    setInitialImage(blob)
    navigate('/editor')
  }

  // Wrapper for tools that use string paths
  const goToPath = (path: string) => navigate(path as RoutePath)

  // Route handling
  if (route === '/terms') return <TermsPage goTo={navigate} />
  if (route === '/editor') return <Editor initialImageSource={initialImage} />
  if (route === '/tools/gradient') return <GradientGenerator goTo={goToPath} />
  if (route === '/tools/background') return <BackgroundGenerator goTo={goToPath} />
  if (route === '/tools/blob') return <BlobGenerator goTo={goToPath} />
  if (route === '/tools/mesh-gradient') return <MeshGradientGenerator goTo={goToPath} />

  return <HomePage onUpload={onUpload} goTo={navigate} />
}

export default App
