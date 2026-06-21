import { promises as fs } from "fs";
import path from "path";
import staticPosts from "./posts";

export async function getAllPosts() {
  let dynamic = [];
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "posts.json"),
      "utf-8"
    );
    dynamic = JSON.parse(raw);
  } catch {}

  const slugSet = new Set();
  const merged = [];

  for (const p of dynamic) {
    if (!slugSet.has(p.slug)) {
      slugSet.add(p.slug);
      merged.push(p);
    }
  }
  for (const p of staticPosts) {
    if (!slugSet.has(p.slug)) {
      slugSet.add(p.slug);
      merged.push(p);
    }
  }

  return merged;
}

export async function getPost(slug) {
  const all = await getAllPosts();
  return all.find((p) => p.slug === slug) || null;
}
