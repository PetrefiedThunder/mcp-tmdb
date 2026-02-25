#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://api.themoviedb.org/3";
const RATE_LIMIT_MS = 250;
let last = 0;

function getKey(): string {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY required. Free at https://www.themoviedb.org/settings/api");
  return k;
}

async function tmdbFetch(path: string, extra?: URLSearchParams): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const p = extra || new URLSearchParams();
  p.set("api_key", getKey());
  const res = await fetch(`${BASE}${path}?${p}`);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-tmdb", version: "1.0.0" });

server.tool("search_movies", "Search for movies.", {
  query: z.string(), year: z.number().optional(), page: z.number().min(1).default(1),
}, async ({ query, year, page }) => {
  const p = new URLSearchParams({ query, page: String(page) });
  if (year) p.set("year", String(year));
  const d = await tmdbFetch("/search/movie", p);
  const movies = d.results?.map((m: any) => ({
    id: m.id, title: m.title, releaseDate: m.release_date, rating: m.vote_average,
    overview: m.overview?.slice(0, 200), poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.total_results, movies }, null, 2) }] };
});

server.tool("get_movie", "Get movie details.", {
  movieId: z.number(),
}, async ({ movieId }) => {
  const d = await tmdbFetch(`/movie/${movieId}`);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    id: d.id, title: d.title, tagline: d.tagline, overview: d.overview,
    releaseDate: d.release_date, runtime: d.runtime, rating: d.vote_average, voteCount: d.vote_count,
    budget: d.budget, revenue: d.revenue, genres: d.genres?.map((g: any) => g.name),
    poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null, imdbId: d.imdb_id,
  }, null, 2) }] };
});

server.tool("search_tv", "Search for TV shows.", {
  query: z.string(), page: z.number().min(1).default(1),
}, async ({ query, page }) => {
  const d = await tmdbFetch("/search/tv", new URLSearchParams({ query, page: String(page) }));
  const shows = d.results?.map((s: any) => ({
    id: s.id, name: s.name, firstAirDate: s.first_air_date, rating: s.vote_average,
    overview: s.overview?.slice(0, 200),
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.total_results, shows }, null, 2) }] };
});

server.tool("get_trending", "Get trending movies or TV shows.", {
  mediaType: z.enum(["movie", "tv", "all"]).default("all"),
  timeWindow: z.enum(["day", "week"]).default("week"),
}, async ({ mediaType, timeWindow }) => {
  const d = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
  const items = d.results?.map((i: any) => ({
    id: i.id, title: i.title || i.name, mediaType: i.media_type, rating: i.vote_average,
    releaseDate: i.release_date || i.first_air_date, overview: i.overview?.slice(0, 200),
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] };
});

server.tool("get_credits", "Get cast and crew for a movie.", {
  movieId: z.number(),
}, async ({ movieId }) => {
  const d = await tmdbFetch(`/movie/${movieId}/credits`);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    cast: d.cast?.slice(0, 20).map((c: any) => ({ name: c.name, character: c.character, order: c.order })),
    crew: d.crew?.filter((c: any) => ["Director", "Producer", "Writer", "Screenplay"].includes(c.job))
      .map((c: any) => ({ name: c.name, job: c.job })),
  }, null, 2) }] };
});

server.tool("search_person", "Search for actors/directors.", {
  query: z.string(),
}, async ({ query }) => {
  const d = await tmdbFetch("/search/person", new URLSearchParams({ query }));
  const people = d.results?.map((p: any) => ({
    id: p.id, name: p.name, knownFor: p.known_for_department,
    popularWorks: p.known_for?.map((w: any) => w.title || w.name).slice(0, 3),
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(people, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
