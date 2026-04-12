"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type FooterLink = {
  label: string;
  href?: string;
};

const benefitItems = [
  {
    title: "Pagamento sem atrito",
    description: "Cartao, Pix e outras formas de pagamento para fechar o pedido sem ruído.",
    cta: { label: "Ver formas de pagamento", href: "/privacy" },
    icon: "payment",
  },
  {
    title: "Entrega clara do catálogo",
    description: "Peças, coleções e disponibilidade organizadas para acelerar sua escolha.",
    cta: { label: "Explorar produtos", href: "/products" },
    icon: "box",
  },
  {
    title: "Suporte de projeto",
    description: "Atendimento para briefings, ajustes e dúvidas antes da compra.",
    cta: { label: "Falar com suporte", href: "/contact" },
    icon: "shield",
  },
] as const;

const footerColumns: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Descubra a Matriz 3D Studio",
    links: [
      { label: "Pagina inicial", href: "/" },
      { label: "Catalogo completo", href: "/products" },
      { label: "Ofertas do dia", href: "/products?sort=price_asc" },
      { label: "Mais buscados", href: "/products?sort=relevance" },
    ],
  },
  {
    title: "Sua conta",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Criar conta", href: "/register" },
      { label: "Minha area", href: "/account" },
      { label: "Meu carrinho", href: "/cart" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { label: "Contato", href: "/contact" },
      { label: "Privacidade", href: "/privacy" },
      { label: "Sobre a marca", href: "/about" },
      { label: "Compra segura" },
    ],
  },
  {
    title: "Experiencia",
    links: [
      { label: "Busca rapida", href: "/products" },
      { label: "Curadoria por vitrine", href: "/" },
      { label: "Checkout simplificado", href: "/cart" },
      { label: "Suporte pos-compra", href: "/contact" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Termos gerais", href: "/about" },
  { label: "Privacidade", href: "/privacy" },
  { label: "Contato", href: "/contact" },
];

function renderBenefitIcon(icon: (typeof benefitItems)[number]["icon"]) {
  switch (icon) {
    case "payment":
      return (
        <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h4" />
        </svg>
      );
    case "box":
      return (
        <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8.5L12 13 3 8.5" />
          <path d="M3 8.5L12 4l9 4.5v7L12 20l-9-4.5v-7z" />
          <path d="M12 13v7" />
        </svg>
      );
    case "shield":
      return (
        <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" />
          <path d="M9.5 12.5l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Footer() {
  const pathname = usePathname();
  const isAdminProductsPage = pathname === '/admin/products';
  if (pathname?.startsWith('/admin') && !isAdminProductsPage) return null;

  return (
    <footer className="mt-12">
      <div className="bg-slate-700 text-white">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mx-auto flex w-full max-w-screen-xl items-center justify-center px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/8 sm:px-6 lg:px-8"
        >
          Voltar ao inicio
        </button>
      </div>

      <div className="border-y border-slate-200 bg-white text-slate-900">
        <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3 md:gap-0">
            {benefitItems.map((item, index) => (
              <article
                key={item.title}
                className={[
                  "flex flex-col items-center px-3 text-center",
                  index < benefitItems.length - 1
                    ? "border-b border-slate-200 pb-6 md:border-b-0 md:border-r md:pb-0"
                    : "",
                ].join(" ")}
              >
                <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-brand">
                  {renderBenefitIcon(item.icon)}
                </span>
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{item.description}</p>
                <Link href={item.cta.href} className="mt-3 text-sm font-medium text-brand hover:underline">
                  {item.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-200">
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <section key={column.title} className="space-y-3">
                <h2 className="text-sm font-semibold tracking-wide text-white">{column.title}</h2>
                <ul className="space-y-2 text-sm text-slate-300">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      {link.href ? (
                        <Link href={link.href} className="transition-colors hover:text-white">
                          {link.label}
                        </Link>
                      ) : (
                        <span className="text-slate-400">{link.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <Link href="/" className="text-xl font-semibold tracking-tight text-white">
                Matriz 3D Studio
              </Link>

              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-slate-300">
                  Brasil
                </span>
                <Link
                  href="/products?sort=price_asc"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  Ofertas do dia
                </Link>
                <Link
                  href="/products"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  Catalogo
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 md:justify-start">
              {legalLinks.map((link) => (
                <Link key={link.label} href={link.href ?? "/"} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-slate-400 md:text-left">
              © {new Date().getFullYear()} Matriz 3D Studio. Interface inspirada em vitrines de objetos 3D.
            </p>
            <p className="mt-2 text-center text-xs leading-6 text-slate-500 md:text-left">
              Estoque, frete, condicoes comerciais e disponibilidade podem variar conforme a operacao. Para duvidas sobre pedido, conta ou privacidade, use a pagina de contato.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
