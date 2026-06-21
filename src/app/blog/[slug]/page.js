import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/blog/load-posts";
import { MagicWand, Calendar, ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Free Video Watermark Remover" },
  };

  return (
    <div className="min-h-dvh bg-[#f8f7f4] text-[#1a1a2e] flex flex-col relative overflow-x-hidden">
      <div className="hero-subtle-bg" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-black/[0.04]">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0">
              <MagicWand size={13} weight="duotone" className="text-[#c9a96e]" />
            </div>
            <span className="text-[13px] sm:text-[14px] font-semibold tracking-tight truncate">Free Video Watermark Remover</span>
          </Link>
          <Link href="/blog" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <span className="hidden sm:inline">&larr; All Guides</span>
            <span className="sm:hidden">&larr; Blog</span>
          </Link>
        </div>
      </header>

      <article className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 relative z-10">
        <div className="mb-6 sm:mb-8">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4 sm:mb-6">
            <ArrowLeft size={13} /> Back to Guides
          </Link>
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 mb-2 sm:mb-3">
            <Calendar size={12} />
            {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          <h1 className="text-[24px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.12]">{post.title}</h1>
          <p className="text-gray-500 text-[14px] sm:text-[16px] mt-3 sm:mt-4 leading-relaxed">{post.excerpt}</p>
        </div>

        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed space-y-4">
          {(post.content || "").split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("### ")) {
              return <h3 key={i} className="text-base sm:text-lg font-semibold text-[#1a1a2e] mt-6 mb-2">{trimmed.replace("### ", "")}</h3>;
            }
            if (trimmed.startsWith("## ")) {
              return <h2 key={i} className="text-lg sm:text-xl font-semibold text-[#1a1a2e] mt-8 mb-3">{trimmed.replace("## ", "")}</h2>;
            }
            if (trimmed.startsWith("# ")) {
              return <h2 key={i} className="text-lg sm:text-xl font-semibold text-[#1a1a2e] mt-8 mb-3">{trimmed.replace("# ", "")}</h2>;
            }
            if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
              return <p key={i} className="font-semibold text-[#1a1a2e]">{trimmed.slice(2, -2)}</p>;
            }
            if (line.startsWith("- ")) {
              return <li key={i} className="text-[13px] sm:text-sm text-gray-600 ml-4 list-disc">{line.replace("- ", "")}</li>;
            }
            if (line.startsWith("| ")) return null;
            if (line.startsWith("1.")) {
              return <li key={i} className="text-[13px] sm:text-sm text-gray-600 ml-4 list-decimal">{line.replace(/^\d+\.\s*/, "")}</li>;
            }
            if (line.startsWith("---")) return <hr key={i} className="border-gray-200 my-6" />;
            if (line.match(/^\[.*\]\(\/\)/)) {
              const text = line.match(/\[(.*?)\]\(\)/);
              return <p key={i}><Link href="/" className="text-[#c9a96e] hover:underline font-medium">{text?.[1] || "Free Video Watermark Remover"}</Link></p>;
            }
            if (line.includes("[Free Video Watermark Remover](/)") || line.includes("[Free Video Watermark Remover](/)")) {
              const parts = line.split(/\[Free Video Watermark Remover\]\(\/\)/);
              return <p key={i}>{parts[0]}<Link href="/" className="text-[#c9a96e] hover:underline font-medium">Free Video Watermark Remover</Link>{parts[1]}</p>;
            }
            if (line.trim()) {
              const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>|\[.*?\]\(.*?\))/g);
              const children = parts.map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) return <em key={j} className="italic">{part.slice(1, -1)}</em>;
                if (part.startsWith("<u>") && part.endsWith("</u>")) return <u key={j}>{part.slice(3, -4)}</u>;
                const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                if (linkMatch) return <a key={j} href={linkMatch[2]} className="text-[#c9a96e] hover:underline font-medium" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
                return part;
              });
              return <p key={i} className="text-[13px] sm:text-sm text-gray-600 leading-relaxed">{children}</p>;
            }
            return null;
          })}
        </div>

        <div className="mt-10 sm:mt-12 p-4 sm:p-6 glass-card rounded-xl text-center">
          <p className="text-sm sm:text-base font-medium text-[#1a1a2e] mb-2">Ready to remove watermarks?</p>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">Try our free tool — no signup required.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#1a1a2e] text-white text-xs sm:text-sm font-medium hover:bg-[#2a2a4e] transition-all">
            <MagicWand size={14} weight="duotone" /> Remove Watermark Now
          </Link>
        </div>
      </article>

      <footer className="border-t border-black/[0.04] py-4 sm:py-6 px-4 sm:px-6 text-center relative z-10">
        <p className="text-xs sm:text-sm text-gray-400"><Link href="/" className="hover:text-gray-600 transition-colors">Free Video Watermark Remover</Link> &mdash; Free online tool</p>
      </footer>
    </div>
  );
}
