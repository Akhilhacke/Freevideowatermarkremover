import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "posts.json");

async function readPosts() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writePosts(posts) {
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

export async function GET() {
  const posts = await readPosts();
  return Response.json(posts);
}

export async function POST(req) {
  const body = await req.json();
  const posts = await readPosts();

  const newPost = {
    slug: body.slug,
    title: body.title,
    excerpt: body.excerpt,
    date: body.date || new Date().toISOString().split("T")[0],
    tags: body.tags || [],
    content: body.content || "",
  };

  const idx = posts.findIndex((p) => p.slug === newPost.slug);
  if (idx >= 0) {
    posts[idx] = newPost;
  } else {
    posts.push(newPost);
  }

  await writePosts(posts);
  return Response.json(newPost);
}

export async function DELETE(req) {
  const { slug } = await req.json();
  const posts = await readPosts();
  const filtered = posts.filter((p) => p.slug !== slug);
  await writePosts(filtered);
  return Response.json({ ok: true });
}
