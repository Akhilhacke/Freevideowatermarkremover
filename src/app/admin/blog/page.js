"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MagicWand, Trash, PencilLine, Check,
  TextItalic, TextUnderline,
  ListBullets, ListNumbers, Link as LinkIcon,
} from "@phosphor-icons/react";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ slug: "", title: "", excerpt: "", date: "", tags: "", content: "" });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const contentRef = useRef(null);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    const res = await fetch("/api/admin/posts");
    const data = await res.json();
    setPosts(data);
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function savePost() {
    const slug = slugify(form.slug);
    if (!slug || !form.title) { setMsg("Slug and title required"); return; }
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const content = htmlToMarkdown(contentRef.current?.innerHTML || "");
    await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug, tags, content }),
    });
    setForm({ slug: "", title: "", excerpt: "", date: "", tags: "", content: "" });
    setEditing(null);
    setMsg("Saved!");
    if (contentRef.current) contentRef.current.innerHTML = "";
    await loadPosts();
  }

  async function deletePost(slug) {
    await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setMsg("Deleted");
    await loadPosts();
  }

  function editPost(p) {
    setForm({ slug: p.slug, title: p.title, excerpt: p.excerpt, date: p.date, tags: (p.tags || []).join(", "), content: markdownToHtml(p.content) });
    if (contentRef.current) contentRef.current.innerHTML = markdownToHtml(p.content);
    setEditing(p.slug);
  }

  function exec(cmd, val) {
    document.execCommand(cmd, false, val || null);
    contentRef.current?.focus();
  }

  function setHeading(tag) {
    document.execCommand("formatBlock", false, `<${tag}>`);
    contentRef.current?.focus();
  }

  function addLink() {
    const url = prompt("Enter URL:", "https://");
    if (url) document.execCommand("createLink", false, url);
    contentRef.current?.focus();
  }

  function htmlToMarkdown(html) {
    let md = html;
    md = md.replace(/<h2>(.*?)<\/h2>/gi, "## $1\n");
    md = md.replace(/<h3>(.*?)<\/h3>/gi, "### $1\n");
    md = md.replace(/<h1>(.*?)<\/h1>/gi, "# $1\n");
    md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
    md = md.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");
    md = md.replace(/<a href="(.*?)">(.*?)<\/a>/gi, "[$2]($1)");
    md = md.replace(/<li>(.*?)<\/li>/gi, "- $1\n");
    md = md.replace(/<div>/gi, "\n").replace(/<\/div>/gi, "");
    md = md.replace(/<p>/gi, "\n").replace(/<\/p>/gi, "");
    md = md.replace(/<br\s*\/?>/gi, "\n");
    md = md.replace(/<[^>]+>/g, "");
    md = md.replace(/&nbsp;/g, " ");
    md = md.replace(/\n{3,}/g, "\n\n");
    return md.trim();
  }

  function markdownToHtml(md) {
    let html = md;
    html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
    html = html.replace(/^- (.*)$/gm, "<li>$1</li>");
    html = html.replace(/^1\. (.*)$/gm, "<li>$1</li>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  function onEditorInput() {
    const el = contentRef.current;
    if (el) setForm((prev) => ({ ...prev, content: el.innerHTML }));
  }

  function setEditorContent(html) {
    const el = contentRef.current;
    if (el) { el.innerHTML = html; }
  }



  return (
    <div className="min-h-dvh bg-[#f8f7f4] text-[#1a1a2e]">
      <header className="bg-white border-b border-black/[0.04] px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
              <MagicWand size={13} weight="duotone" className="text-[#c9a96e]" />
            </div>
            <span className="text-sm font-semibold">Admin — Blog</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/blog" className="text-xs text-gray-500 hover:text-gray-700">View Blog &rarr;</Link>
            <button onClick={async () => { await fetch("/api/admin/logout"); window.location.href = "/admin/login"; }} className="text-xs text-red-400 hover:text-red-600">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {msg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs sm:text-sm text-emerald-700 flex items-center gap-2">
            <Check size={14} weight="bold" /> {msg}
            <button onClick={() => setMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600">x</button>
          </div>
        )}

          <div className="glass-card rounded-xl p-4 sm:p-6 mb-8">
              <style>{`
                .editor-content { outline: none; }
                .editor-content h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
                .editor-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
                .editor-content ul, .editor-content ol { padding-left: 1.5rem; margin: 0.5rem 0; }
                .editor-content li { margin: 0.25rem 0; }
                .editor-content a { color: #2563eb; text-decoration: underline; }
                .editor-content u { text-decoration: underline; }
                .editor-content strong { font-weight: 600; }
              `}</style>
          <h2 className="text-sm font-semibold mb-4">{editing ? "Edit Post" : "New Post"}</h2>
          <div className="grid gap-3">
            <input placeholder="Slug (auto from title)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30" />
            <input placeholder="Title" value={form.title} onChange={(e) => {
              const newTitle = e.target.value;
              setForm({ ...form, title: newTitle, slug: form.slug || slugify(newTitle) });
            }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30" />
            <textarea placeholder="Excerpt (SEO description)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30" rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Date (2026-07-01)" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30" />
              <input placeholder="Tags (comma: image, guide)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-50 border border-gray-200 rounded-t-lg border-b-0">
                <button onClick={() => exec("bold")} title="Bold" className="p-1.5 rounded text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all">B</button>
                <button onClick={() => exec("italic")} title="Italic" className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all"><TextItalic size={14} weight="bold" /></button>
                <button onClick={() => exec("underline")} title="Underline" className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all"><TextUnderline size={14} weight="bold" /></button>
                <span className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => setHeading("h1")} title="Heading 1" className="p-1.5 rounded text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all">H1</button>
                <button onClick={() => setHeading("h2")} title="Heading 2" className="p-1.5 rounded text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all">H2</button>
                <button onClick={() => setHeading("h3")} title="Heading 3" className="p-1.5 rounded text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all">H3</button>
                <span className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => exec("insertUnorderedList")} title="Bullet list" className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all"><ListBullets size={14} /></button>
                <button onClick={() => exec("insertOrderedList")} title="Numbered list" className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all"><ListNumbers size={14} /></button>
                <span className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={addLink} title="Insert link" className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all"><LinkIcon size={14} /></button>
              </div>
              <div ref={contentRef} contentEditable suppressContentEditableWarning onInput={onEditorInput}
                className="editor-content w-full min-h-[260px] px-3 py-2 rounded-b-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30 bg-white" />
            </div>
            <div className="flex gap-2">
              <button onClick={savePost}
                className="px-4 py-2 rounded-xl bg-[#1a1a2e] text-white text-xs font-medium hover:bg-[#2a2a4e] transition-all">
                {editing ? "Update Post" : "Publish Post"}
              </button>
              {editing && (
                <button onClick={() => { setForm({ slug: "", title: "", excerpt: "", date: "", tags: "", content: "" }); setEditing(null); if (contentRef.current) contentRef.current.innerHTML = ""; }}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-all">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6">
          <h2 className="text-sm font-semibold mb-4">All Posts ({posts.length})</h2>
          {posts.length === 0 ? (
            <p className="text-xs text-gray-400">No dynamic posts yet. Write one above!</p>
          ) : (
            <div className="grid gap-2">
              {posts.map((p) => (
                <div key={p.slug} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-[11px] text-gray-400">/{p.slug} &middot; {p.date}</p>
                  </div>
                  <button onClick={() => editPost(p)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all">
                    <PencilLine size={14} />
                  </button>
                  <button onClick={() => deletePost(p.slug)}
                    className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 mt-4">
          <h2 className="text-sm font-semibold mb-2">Static Posts (from code)</h2>
          <p className="text-[11px] text-gray-400">These are in <code className="bg-gray-100 px-1 rounded">src/blog/posts.js</code>. Edit the file to change them.</p>
          <p className="text-[11px] text-gray-400 mt-1">Dynamic posts above override static ones with the same slug.</p>
        </div>
      </main>
    </div>
  );
}
