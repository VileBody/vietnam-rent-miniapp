import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ACTOR_ID = "apify~facebook-marketplace-scraper";
const TOKEN = process.env.APIFY_TOKEN;
const API_BASE = process.env.VIETNEST_API_BASE || "https://vietnam.teamgenius.ru";
const OUT_DIR = process.env.APIFY_OUT_DIR || join(process.cwd(), "data", "apify-detail", new Date().toISOString().replace(/[:.]/g, "-"));
const BATCH_SIZE = Number(process.env.APIFY_BATCH_SIZE || "50");
const POLL_MS = Number(process.env.APIFY_POLL_MS || "5000");
const MEDIA_CONCURRENCY = Number(process.env.APIFY_MEDIA_CONCURRENCY || "6");
const MEDIA_TIMEOUT_MS = Number(process.env.APIFY_MEDIA_TIMEOUT_MS || "30000");
const APIFY_RETRIES = Number(process.env.APIFY_RETRIES || "4");

if (!TOKEN) {
  console.error("APIFY_TOKEN is required");
  process.exit(1);
}

async function apify(path, options = {}) {
  const sep = path.includes("?") ? "&" : "?";
  let lastError;
  for (let attempt = 1; attempt <= APIFY_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`https://api.apify.com/v2/${path}${sep}token=${TOKEN}`, options);
      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = text;
      }
      if (!response.ok) {
        throw new Error(`Apify ${response.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
      }
      return payload.data ?? payload;
    } catch (error) {
      lastError = error;
      if (attempt === APIFY_RETRIES) break;
      const delay = 1000 * attempt * attempt;
      console.warn(`Apify request failed (${attempt}/${APIFY_RETRIES}) ${path}: ${error.message}; retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function getMonthlyUsage() {
  const usage = await apify("users/me/usage/monthly");
  return usage.totalUsageCreditsUsdAfterVolumeDiscount ?? usage.totalUsageCreditsUsdBeforeVolumeDiscount ?? 0;
}

async function getListings() {
  const response = await fetch(`${API_BASE}/api/listings`);
  if (!response.ok) throw new Error(`Listings API ${response.status}: ${await response.text()}`);
  const listings = await response.json();
  return listings.filter((item) => item?.id?.startsWith("fbm-") && item.fbUrl);
}

async function startRun(batch, index) {
  const input = {
    startUrls: batch.map((listing) => ({ url: listing.fbUrl })),
    resultsLimit: batch.length,
    includeListingDetails: true,
    proxyConfiguration: { useApifyProxy: true },
  };
  const run = await apify(`acts/${ACTOR_ID}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  console.log(`batch ${index}: run ${run.id} started (${batch.length} urls)`);
  return run;
}

async function waitRun(runId, index) {
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const run = await apify(`actor-runs/${runId}`);
    if (!["READY", "RUNNING"].includes(run.status)) {
      console.log(`batch ${index}: ${run.status}, usage $${run.usageTotalUsd ?? 0}, dataset ${run.defaultDatasetId}`);
      return run;
    }
  }
}

async function getDatasetItems(datasetId) {
  return apify(`datasets/${datasetId}/items?clean=false`);
}

async function readJSONIfExists(path) {
  try {
    await access(path);
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function mediaFromItem(item) {
  const media = [];
  for (const photo of item.listingPhotos || item.listing_photos || []) {
    const url = photo?.image?.uri || photo?.uri || photo?.url;
    if (url) {
      media.push({
        kind: "photo",
        source_url: url,
        width: photo?.image?.width ?? null,
        height: photo?.image?.height ?? null,
        caption: photo?.accessibility_caption ?? null,
      });
    }
  }
  for (const video of item.listingVideo || item.listing_video || []) {
    const url = video?.url || video?.uri || video?.playable_url || video?.playableUrl;
    if (url) media.push({ kind: "video", source_url: url });
  }
  return media;
}

function itemId(item) {
  return String(item.id || item.listingId || item.marketplace_listing_id || "").trim();
}

function contentExt(contentType, url) {
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return ".jpg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("mp4")) return ".mp4";
  const parsed = extname(new URL(url).pathname);
  return parsed && parsed.length <= 6 ? parsed : ".bin";
}

async function downloadOneMedia(entry, id, sourceName, index) {
  try {
    const response = await fetch(entry.source_url, {
      headers: { "user-agent": "Mozilla/5.0 VietNest media mirror" },
      signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const checksum = createHash("sha256").update(buffer).digest("hex");
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const ext = contentExt(contentType, entry.source_url);
    const dir = join(OUT_DIR, "media", sourceName, id || "unknown");
    await mkdir(dir, { recursive: true });
    const localPath = join("media", sourceName, id || "unknown", `${index}-${checksum.slice(0, 16)}${ext}`);
    await writeFile(join(OUT_DIR, localPath), buffer);
    return {
      ...entry,
      local_path: localPath,
      bytes: buffer.length,
      checksum,
      content_type: contentType,
    };
  } catch (error) {
    return { ...entry, error: error.message };
  }
}

async function downloadMediaForItem(item, sourceName = "detail") {
  const id = itemId(item);
  const media = mediaFromItem(item);
  return Promise.all(media.map((entry, index) => downloadOneMedia(entry, id, sourceName, index)));
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function normalizeItem(item, media) {
  const id = itemId(item);
  return {
    external_id: id,
    listing_id: id ? `fbm-${id}` : null,
    url: item.itemUrl || item.listingUrl || item.facebookUrl || (id ? `https://www.facebook.com/marketplace/item/${id}` : null),
    title: item.listingTitle || item.marketplace_listing_title || null,
    description: item.description?.text || item.description || null,
    price: item.listingPrice || item.listing_price || null,
    location: item.location || null,
    details: item.details || [],
    condition: item.condition || null,
    is_live: item.isLive ?? item.is_live ?? null,
    is_hidden: item.isHidden ?? item.is_hidden ?? null,
    is_pending: item.isPending ?? item.is_pending ?? null,
    is_sold: item.isSold ?? item.is_sold ?? null,
    media,
    raw: item,
  };
}

function chunks(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

await mkdir(OUT_DIR, { recursive: true });
const beforeUsage = await getMonthlyUsage();
const listings = await getListings();
const batches = chunks(listings, BATCH_SIZE);
const rawItems = [];
const normalized = [];
const runs = [];

console.log(`enriching ${listings.length} listings in ${batches.length} batches -> ${OUT_DIR}`);

for (let index = 0; index < batches.length; index += 1) {
  const batch = batches[index];
  const batchName = `batch-${String(index + 1).padStart(2, "0")}`;
  const rawPath = join(OUT_DIR, `${batchName}.raw.json`);
  let items = await readJSONIfExists(rawPath);
  if (items) {
    console.log(`${batchName}: using existing raw file (${items.length} items)`);
  } else {
    const run = await startRun(batch, index + 1);
    const finished = await waitRun(run.id, index + 1);
    runs.push({
      batch: index + 1,
      runId: finished.id,
      datasetId: finished.defaultDatasetId,
      status: finished.status,
      usageTotalUsd: finished.usageTotalUsd,
      itemCount: finished.stats?.itemsCount,
    });
    if (finished.status !== "SUCCEEDED") {
      await writeFile(join(OUT_DIR, "manifest.partial.json"), JSON.stringify({ beforeUsage, runs }, null, 2));
      throw new Error(`Batch ${index + 1} failed with ${finished.status}`);
    }
    items = await getDatasetItems(finished.defaultDatasetId);
    await writeFile(rawPath, JSON.stringify(items, null, 2));
  }
  rawItems.push(...items);
  const batchNormalized = await mapPool(items, MEDIA_CONCURRENCY, async (item) => {
    const media = await downloadMediaForItem(item, batchName);
    return normalizeItem(item, media);
  });
  normalized.push(...batchNormalized);
  await writeFile(join(OUT_DIR, "details.raw.json"), JSON.stringify(rawItems, null, 2));
  await writeFile(join(OUT_DIR, "details.normalized.json"), JSON.stringify(normalized, null, 2));
  console.log(`${batchName}: normalized ${batchNormalized.length} items, total ${normalized.length}`);
}

const afterUsage = await getMonthlyUsage();
const manifest = {
  outDir: OUT_DIR,
  apiBase: API_BASE,
  totalListings: listings.length,
  totalItems: rawItems.length,
  mediaDownloaded: normalized.reduce((sum, item) => sum + item.media.filter((media) => media.local_path).length, 0),
  mediaErrors: normalized.reduce((sum, item) => sum + item.media.filter((media) => media.error).length, 0),
  beforeUsage,
  afterUsage,
  usageDeltaUsd: afterUsage - beforeUsage,
  runs,
};

await writeFile(join(OUT_DIR, "details.raw.json"), JSON.stringify(rawItems, null, 2));
await writeFile(join(OUT_DIR, "details.normalized.json"), JSON.stringify(normalized, null, 2));
await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
