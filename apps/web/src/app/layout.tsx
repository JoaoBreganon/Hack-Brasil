import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { DadosEstruturados } from "@/components/seo/dados-estruturados";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/config/site";
import "./globals.css";

const TITULO = `${SITE.nome} · ${SITE.slogan}`;

const geist = localFont({
	src: "../fontes/geist-latin.woff2",
	variable: "--font-geist",
	weight: "100 900",
	display: "swap",
});

const bricolage = localFont({
	src: "../fontes/bricolage-grotesque-latin.woff2",
	variable: "--font-bricolage",
	weight: "200 800",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: { default: TITULO, template: `%s · ${SITE.nome}` },
	description: SITE.descricao,
	applicationName: SITE.nome,
	keywords: [...SITE.palavrasChave],
	authors: SITE.autores.map((nome) => ({ name: nome })),
	creator: SITE.nome,
	category: "education",
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		locale: SITE.localidade,
		url: "/",
		siteName: SITE.nome,
		title: TITULO,
		description: SITE.descricao,
	},
	twitter: {
		card: "summary_large_image",
		title: TITULO,
		description: SITE.descricao,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: { index: true, follow: true, "max-image-preview": "large" },
	},
	formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
	themeColor: SITE.corDoTema,
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang={SITE.idioma} className={`${geist.variable} ${bricolage.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col print:bg-white">
				<DadosEstruturados />
				<ConvexClientProvider>{children}</ConvexClientProvider>
				<Toaster position="top-center" richColors closeButton />
			</body>
		</html>
	);
}
