import { useEffect, useMemo, useState } from 'react'
import Editor from '@/editor/Editor'
import { Button } from '@/components/ui/button'
import './App.css'
import { Github } from 'lucide-react'

type RoutePath = '/' | '/editor' | '/terms'

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

function HomePage(props: { onUpload: (blob: Blob) => void; goTo: (p: RoutePath) => void }) {
  const fileInputId = useMemo(() => 'upload-' + Math.random().toString(36).slice(2), [])
  const webstoreUrl = 'https://chromewebstore.google.com/detail/beveled/kpdehbgphkkcedapekaaanpbajfmifjf'
  return (
    <div className="min-h-screen flex flex-col home-gradient">
      {/* Full viewport hero section */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src="/beveled_icon.png" alt="Beveled" width={48} height={48} />
              <h1 className="text-5xl logo-wordmark lowercase">beveled</h1>
            </div>
            <h1 className="mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
              Make Your Screenshots Better
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Transform ordinary screenshots into beautiful, professional images with custom backgrounds, shadows, and branding elements.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-auto bg-[#e05d38] hover:bg-[#d14d28] text-white border-0 shadow-lg shadow-[#e05d38]/25 hover:shadow-[#e05d38]/40 transition-all duration-200"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                Upload Screenshot
              </Button>
              <Button 
                asChild 
                size="lg" 
                className="text-lg px-8 py-6 h-auto bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <a href={webstoreUrl} target="_blank" rel="noreferrer noopener">
                  Add to Chrome
                </a>
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
            <div>
              <Button 
                variant="ghost" 
                onClick={() => props.goTo('/editor')}
                className="text-gray-600 hover:text-gray-800 hover:bg-black/5 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-white/10"
              >
                or try the editor without an image
              </Button>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href="https://github.com/iambilalazhar/beveled"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Github className="size-4" />
                <span>Star us on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/30 backdrop-blur-sm relative z-10 dark:border-white/10 dark:bg-black/20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <img src="/beveled_icon.png" alt="Beveled" width={20} height={20} />
              <span>© 2025 Beveled. All rights reserved.</span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <a 
                href="https://beveled.app/privacy.html" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                onClick={(e) => { e.preventDefault(); props.goTo('/terms') }} 
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="https://github.com/iambilalazhar/beveled"
                target="_blank"
                rel="noreferrer noopener"
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors inline-flex items-center gap-1"
              >
                <Github className="size-3" />
                <span>GitHub</span>
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
                <li>Spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                <li>Use the Service for any obscene or immoral purpose</li>
                <li>Interfere with or circumvent the security features of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">User Content</h2>
              <div className="space-y-4">
                <p className="leading-7">
                  You retain full ownership of any images, screenshots, or other content you upload to Beveled. By using the Service, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 leading-7">
                  <li>You own or have the necessary rights to use and authorize the use of your content</li>
                  <li>Your content does not infringe upon the rights of any third party</li>
                  <li>Your content does not violate any applicable laws or regulations</li>
                </ul>
                <p className="leading-7">
                  We do not claim ownership of your content. All processing occurs locally in your browser, and we do not store or have access to your images.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>
              <p className="leading-7">
                The Service and its original content, features, and functionality are and will remain the exclusive property of Beveled and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
              <p className="leading-7">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Disclaimers</h2>
              <div className="space-y-4">
                <p className="leading-7">
                  <strong>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS.</strong> BEVELED MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE SERVICE OR THE INFORMATION, CONTENT, MATERIALS, OR PRODUCTS INCLUDED ON THE SERVICE.
                </p>
                <p className="leading-7">
                  TO THE FULL EXTENT PERMISSIBLE BY APPLICABLE LAW, BEVELED DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="leading-7">
                IN NO EVENT SHALL BEVELED, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
              <p className="leading-7">
                You agree to defend, indemnify, and hold harmless Beveled and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Termination</h2>
              <p className="leading-7">
                We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="leading-7">
                These Terms shall be interpreted and governed by the laws of the jurisdiction in which Beveled operates, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p className="leading-7">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="leading-7">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-medium">Email: legal@beveled.app</p>
                <p className="text-sm text-muted-foreground mt-2">
                  We will respond to legal inquiries within 30 days.
                </p>
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
    if (route === '/') document.title = 'Beveled – Make your screenshots better'
    if (route === '/editor') document.title = 'Beveled – Editor'
  }, [route])

  const onUpload = (blob: Blob) => {
    setInitialImage(blob)
    navigate('/editor')
  }

  if (route === '/terms') return <TermsPage goTo={navigate} />
  if (route === '/editor') return <Editor initialImageSource={initialImage} />
  return <HomePage onUpload={onUpload} goTo={navigate} />
}

export default App
