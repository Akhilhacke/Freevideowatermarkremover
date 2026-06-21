import Link from "next/link";
import { getAllPosts } from "@/blog/load-posts";
import { MagicWand, ArrowRight, Calendar, Clock } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Blog — Watermark Removal Guides & Tips",
  description:
    "Learn how to remove watermarks from images and videos with our free guides. Tips, methods comparison, and step-by-step tutorials.",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-dvh bg-[#f8f7f4] text-[#1a1a2e] flex flex-col relative overflow-x-hidden">
      <div className="hero-subtle-bg" />

      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0">
              <MagicWand size={13} weight="duotone" className="text-[#c9a96e]" />
            </div>
            <h1 className="text-[13px] sm:text-[14px] font-semibold tracking-tight truncate">Free Video Watermark Remover</h1>
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            &larr; Back to Tool
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 relative z-10">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 tracking-wider uppercase">
            Resources
          </span>
          <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-[1.08] mt-2 sm:mt-3">
            Watermark Removal Guides
          </h2>
          <p className="text-gray-500 text-[14px] sm:text-[15px] max-w-lg mx-auto leading-relaxed mt-2 sm:mt-3">
            Learn how to remove watermarks from images and videos with our step-by-step guides and tips.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <div className="glass-card rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <span className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400">
                    <Calendar size={12} />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400">
                    <Clock size={12} />
                    {post.tags.join(", ")}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#1a1a2e] mb-1.5 sm:mb-2">
                  {post.title}
                </h3>
                <p className="text-[13px] sm:text-sm text-gray-500 leading-relaxed mb-3">
                  {post.excerpt}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[12px] sm:text-xs font-medium text-[#c9a96e]">
                  Read More <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-black/[0.04] py-4 sm:py-6 px-4 sm:px-6 text-center relative z-10">
        <p className="text-xs sm:text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Free Video Watermark Remover</Link> &mdash; Free online tool
          <span className="mx-2">·</span>
          <Link href="/admin/blog" className="hover:text-gray-600 transition-colors">Admin</Link>
        </p>
      </footer>
    </div>
  );
}
