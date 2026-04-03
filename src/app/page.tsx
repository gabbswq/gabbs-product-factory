import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/articles/ArticleCard'
import type { ArticleSummary } from '@/types/content'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'InnovateTech — Automação com IA para seu negócio',
  description:
    'Transforme processos repetitivos em fluxos automáticos com inteligência artificial. Consultoria, implementação e suporte em automação com IA.',
}

// Revalidate landing page every 10 minutes so featured articles stay fresh
// without waiting for a full deploy.
export const revalidate = 600

async function getFeaturedArticles(): Promise<ArticleSummary[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('featured_articles')
    .select('*')
    .limit(6)

  return (data ?? []) as ArticleSummary[]
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted py-24 md:py-36">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          Automação com Inteligência Artificial
        </span>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
          Seu negócio no{' '}
          <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            piloto automático
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          Eliminamos tarefas repetitivas com agentes de IA e integrações inteligentes.
          Do atendimento ao cliente à geração de relatórios — automatize o que drena seu time.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="#contact">Quero automatizar meu negócio</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/articles">Ver conteúdo gratuito</Link>
          </Button>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t pt-10 text-center">
          {[
            { value: '80%', label: 'redução de trabalho manual' },
            { value: '3×', label: 'mais velocidade nos processos' },
            { value: '24/7', label: 'operação sem parar' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-primary">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedArticles({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <span className="mb-2 block text-sm font-medium text-primary">Conteúdo gratuito</span>
          <h2 className="text-3xl font-bold">Aprenda sobre automação com IA</h2>
          <p className="mt-3 text-muted-foreground">
            Artigos práticos para quem quer aplicar IA no seu negócio hoje.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/articles">Ver todos os artigos</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function DiscordCTA() {
  return (
    <section className="bg-gradient-to-br from-indigo-600 to-purple-700 py-20 text-white">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <div className="mb-4 text-5xl">💬</div>
        <h2 className="mb-4 text-3xl font-bold">
          Entre para a comunidade
        </h2>
        <p className="mb-8 text-indigo-100">
          Mais de 500 empreendedores e profissionais discutindo automação com IA,
          compartilhando cases reais e aprendendo juntos.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-white text-indigo-700 hover:bg-indigo-50"
        >
          {/* Replace # with your real Discord invite link */}
          <a href="#" target="_blank" rel="noopener noreferrer">
            Entrar no Discord — é grátis
          </a>
        </Button>
      </div>
    </section>
  )
}

function ServicesSection() {
  const services = [
    {
      icon: '🤖',
      title: 'Agentes de IA',
      description:
        'Agentes autônomos que executam tarefas complexas: pesquisa, análise, geração de conteúdo e tomada de decisão.',
    },
    {
      icon: '🔗',
      title: 'Integrações inteligentes',
      description:
        'Conecte suas ferramentas (CRM, ERP, planilhas, WhatsApp) com fluxos automatizados via n8n ou Make.',
    },
    {
      icon: '💬',
      title: 'Chatbots com IA',
      description:
        'Atendimento 24/7 com contexto real do seu negócio — muito além das respostas enlatadas.',
    },
    {
      icon: '📊',
      title: 'Relatórios automáticos',
      description:
        'Dashboards e relatórios gerados e enviados automaticamente para quem precisa, quando precisa.',
    },
  ]

  return (
    <section className="bg-muted/50 py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <span className="mb-2 block text-sm font-medium text-primary">Serviços</span>
          <h2 className="text-3xl font-bold">O que posso fazer por você</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 text-3xl">{icon}</div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LandingPage() {
  const featured = await getFeaturedArticles()

  return (
    <main>
      <Hero />
      <ServicesSection />
      <FeaturedArticles articles={featured} />
      <DiscordCTA />
    </main>
  )
}
