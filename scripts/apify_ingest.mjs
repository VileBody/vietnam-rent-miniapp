#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ACTOR_ID = "apify~facebook-marketplace-scraper";
const TOKEN = process.env.APIFY_TOKEN;
const OUT_DIR = process.env.APIFY_OUT_DIR || join(process.cwd(), "data", "apify-ingest", new Date().toISOString().replace(/[:.]/g, "-"));
const INCLUDE_DETAILS = process.env.APIFY_INCLUDE_DETAILS === "true";
const TIER_PRICE_PER_LISTING = Number(process.env.APIFY_LISTING_PRICE_USD || "0.0062");

const SOURCES = [
  { city: "hcmc", name: "hcmc-apartments", path: "hochiminhcity", query: "apartment for rent", limit: 120 },
  { city: "hcmc", name: "hcmc-serviced", path: "hochiminhcity", query: "serviced apartment for rent", limit: 60 },
  { city: "hcmc", name: "hcmc-studio", path: "hochiminhcity", query: "studio apartment for rent", limit: 50 },
  { city: "hcmc", name: "hcmc-1br", path: "hochiminhcity", query: "1 bedroom apartment for rent", limit: 40 },
  { city: "danang", name: "danang-apartments", path: "113055078713103", query: "apartment for rent", limit: 100 },
  { city: "danang", name: "danang-houses", path: "113055078713103", query: "house for rent", limit: 30 },
  { city: "danang", name: "danang-villas", path: "113055078713103", query: "villa for rent", limit: 30 },
  { city: "nhatrang", name: "nhatrang-apartments", path: "109205905763791", query: "apartment for rent", limit: 80 },
  { city: "nhatrang", name: "nhatrang-seaview", path: "109205905763791", query: "sea view apartment for rent", limit: 40 },
  { city: "phuquoc", name: "phuquoc-villas", path: "107416705961385", query: "villa for rent", limit: 50 },
  { city: "phuquoc", name: "phuquoc-houses", path: "107416705961385", query: "house for rent", limit: 30 },
  { city: "hoian", name: "hoian-villas", path: "113055078713103", query: "Hoi An villa for rent", limit: 10 },
  { city: "hoian", name: "hoian-houses", path: "113055078713103", query: "Hoi An house for rent", limit: 10 },
];

if (!TOKEN) {
  console.error("APIFY_TOKEN is required");
  process.exit(1);
}

async function api(path, options = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const response = await fetch(`https://api.apify.com/v2/${path}${sep}token=${TOKEN}`, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Apify ${response.status}: ${body}`);
  }
  return response.json();
}

async function usage() {
  const data = await api("users/me/usage/monthly");
  return {
    totalUsd: data.data.totalUsageCreditsUsdAfterVolumeDiscount,
    paidActorEvents: data.data.monthlyServiceUsage?.PAID_ACTORS_PER_EVENT?.quantity || 0,
    cycle: data.data.usageCycle,
  };
}

function sourceUrl(source) {
  const url = new URL(`https://www.facebook.com/marketplace/${source.path}/search/`);
  url.searchParams.set("query", source.query);
  return url.toString();
}

async function startRun(source) {
  const input = {
    startUrls: [{ url: sourceUrl(source) }],
    resultsLimit: source.limit,
    includeListingDetails: INCLUDE_DETAILS,
  };
  const response = await api(`acts/${ACTOR_ID}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return { ...response.data, input };
}

async function waitRun(runId) {
  for (;;) {
    const response = await api(`actor-runs/${runId}`);
    const run = response.data;
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) return run;
    await sleep(10_000);
  }
}

async function datasetItems(datasetId, limit) {
  return api(`datasets/${datasetId}/items?clean=true&limit=${Math.max(limit + 100, 1000)}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listingId(item) {
  return String(item.id || item.listingId || item.marketplaceListingId || "").trim();
}

function textAt(item, paths) {
  for (const path of paths) {
    let value = item;
    for (const key of path) value = value?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function itemUrl(item) {
  return textAt(item, [["listingUrl"], ["itemUrl"], ["facebookUrl"]]);
}

function title(item) {
  return textAt(item, [["marketplace_listing_title"], ["listingTitle"]]);
}

function price(item) {
  return textAt(item, [["listing_price", "formatted_amount"], ["listingPrice", "formattedAmount"], ["listingPrice", "formatted_amount"]]);
}

function location(item) {
  return textAt(item, [
    ["location", "reverse_geocode", "city_page", "display_name"],
    ["location", "reverseGeocode", "cityPage", "displayName"],
  ]);
}

function mediaUrls(item) {
  const urls = [];
  const add = (value, kind = "photo") => {
    if (typeof value === "string" && value.startsWith("http")) urls.push({ kind, url: value });
  };

  add(item.primary_listing_photo?.photo_image_url, "photo");
  add(item.primaryListingPhoto?.photoImageUrl, "photo");
  add(item.primaryListingPhoto?.photo_image_url, "photo");

  for (const photo of item.listing_photos || item.listingPhotos || []) {
    add(photo.photo_image_url, "photo");
    add(photo.photoImageUrl, "photo");
    add(photo.image?.uri, "photo");
  }

  add(item.listing_video?.playable_url, "video");
  add(item.listingVideo?.playableUrl, "video");
  add(item.listingVideo?.playable_url, "video");

  const seen = new Set();
  return urls.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

function safeExt(contentType, url) {
  if (contentType?.includes("jpeg")) return ".jpg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("mp4")) return ".mp4";
  const ext = extname(new URL(url).pathname).split("?")[0];
  return ext && ext.length <= 6 ? ext : ".bin";
}

async function downloadMedia(item, sourceName) {
  const id = listingId(item) || createHash("sha1").update(itemUrl(item) || JSON.stringify(item)).digest("hex").slice(0, 16);
  const entries = mediaUrls(item);
  const saved = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    try {
      const response = await fetch(entry.url, {
        headers: { "user-agent": "Mozilla/5.0 VietNest media mirror" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const checksum = createHash("sha256").update(buffer).digest("hex");
      const ext = safeExt(response.headers.get("content-type"), entry.url);
      const dir = join(OUT_DIR, "media", sourceName, id);
      await mkdir(dir, { recursive: true });
      const relativePath = join("media", sourceName, id, `${index}-${checksum.slice(0, 16)}${ext}`);
      const filePath = join(OUT_DIR, relativePath);
      await writeFile(filePath, buffer);
      saved.push({
        kind: entry.kind,
        source_url: entry.url,
        local_path: relativePath,
        bytes: buffer.length,
        checksum,
        content_type: response.headers.get("content-type") || "",
      });
    } catch (error) {
      saved.push({ kind: entry.kind, source_url: entry.url, error: error.message });
    }
  }
  return saved;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const before = await usage();
  const planned = SOURCES.reduce((sum, source) => sum + source.limit, 0);
  const manifest = {
    actor: ACTOR_ID,
    includeDetails: INCLUDE_DETAILS,
    plannedListings: planned,
    estimatedListingCostUsd: Number((planned * TIER_PRICE_PER_LISTING * (INCLUDE_DETAILS ? 2 : 1)).toFixed(4)),
    outDir: OUT_DIR,
    beforeUsage: before,
    sources: [],
  };

  const allItems = [];
  for (const source of SOURCES) {
    console.log(`[start] ${source.name}: ${source.limit} ${sourceUrl(source)}`);
    const started = await startRun(source);
    const run = await waitRun(started.id);
    const items = run.defaultDatasetId ? await datasetItems(run.defaultDatasetId, source.limit) : [];
    console.log(`[done] ${source.name}: status=${run.status} items=${items.length} cost=${run.usageTotalUsd ?? "?"}`);
    const sourceRecord = {
      ...source,
      url: sourceUrl(source),
      runId: run.id,
      datasetId: run.defaultDatasetId,
      status: run.status,
      usageTotalUsd: run.usageTotalUsd,
      itemCount: items.length,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      stats: run.stats,
    };
    manifest.sources.push(sourceRecord);
    await writeFile(join(OUT_DIR, `${source.name}.items.json`), JSON.stringify(items, null, 2));
    allItems.push(...items.map((item) => ({ ...item, __source: source.name, __city: source.city, __runId: run.id })));
    await writeFile(join(OUT_DIR, "manifest.partial.json"), JSON.stringify(manifest, null, 2));
  }

  const byId = new Map();
  for (const item of allItems) {
    const key = listingId(item) || itemUrl(item);
    if (!key || byId.has(key)) continue;
    byId.set(key, item);
  }

  const normalized = [];
  let mediaCount = 0;
  let mediaErrors = 0;
  for (const item of byId.values()) {
    const media = await downloadMedia(item, item.__source);
    mediaCount += media.filter((entry) => entry.local_path).length;
    mediaErrors += media.filter((entry) => entry.error).length;
    normalized.push({
      external_id: listingId(item),
      city: item.__city,
      source: item.__source,
      run_id: item.__runId,
      title: title(item),
      price: price(item),
      location: location(item),
      url: itemUrl(item),
      media,
      raw: item,
    });
    if (normalized.length % 50 === 0) console.log(`[media] processed ${normalized.length}/${byId.size}`);
  }

  const after = await usage();
  manifest.afterUsage = after;
  manifest.actualUsageDeltaUsd = Number((after.totalUsd - before.totalUsd).toFixed(6));
  manifest.totalItems = allItems.length;
  manifest.uniqueItems = normalized.length;
  manifest.duplicateItems = allItems.length - normalized.length;
  manifest.mediaDownloaded = mediaCount;
  manifest.mediaErrors = mediaErrors;

  await writeFile(join(OUT_DIR, "items.raw.json"), JSON.stringify(allItems, null, 2));
  await writeFile(join(OUT_DIR, "items.normalized.json"), JSON.stringify(normalized, null, 2));
  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({
    outDir: OUT_DIR,
    totalItems: manifest.totalItems,
    uniqueItems: manifest.uniqueItems,
    duplicateItems: manifest.duplicateItems,
    mediaDownloaded: manifest.mediaDownloaded,
    mediaErrors: manifest.mediaErrors,
    actualUsageDeltaUsd: manifest.actualUsageDeltaUsd,
    afterTotalUsd: after.totalUsd,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

