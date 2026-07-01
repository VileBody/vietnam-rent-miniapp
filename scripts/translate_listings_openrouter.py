#!/usr/bin/env python3
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


INPUT = Path(sys.argv[1] if len(sys.argv) > 1 else "/Users/ergin/Downloads/vietnest-listings-for-translation.json")
OUTPUT = Path(sys.argv[2] if len(sys.argv) > 2 else "/Users/ergin/Downloads/vietnest-listings-ru-translations.json")
MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-3-flash-preview")
API_KEY = os.environ.get("OPENROUTER_API_KEY")
BATCH_SIZE = int(os.environ.get("TRANSLATION_BATCH_SIZE", "6"))
FIELDS = ["title", "area", "about", "specs", "details", "tags", "amenities"]

try:
    import certifi

    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except Exception:
    SSL_CONTEXT = ssl.create_default_context()


if not API_KEY:
    print("OPENROUTER_API_KEY is required", file=sys.stderr)
    sys.exit(1)


def load_json(path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")
    tmp.replace(path)


def compact_listing(item):
    return {field: item.get(field, [] if field in {"specs", "details", "tags", "amenities"} else "") for field in ["id"] + FIELDS}


def extract_json(text):
    text = (text or "").strip()
    if text.startswith("{"):
        return json.loads(text)
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.I)
    if fenced:
        return json.loads(fenced.group(1))
    first = text.find("{")
    last = text.rfind("}")
    if first >= 0 and last > first:
        return json.loads(text[first : last + 1])
    raise ValueError("No JSON object in model response")


def pick_items(parsed):
    if isinstance(parsed, dict):
        if isinstance(parsed.get("listings"), list):
            return parsed["listings"]
        if isinstance(parsed.get("translations"), list):
            return parsed["translations"]
        if isinstance(parsed.get("items"), list):
            return parsed["items"]
        if isinstance(parsed.get("result"), dict):
            return pick_items(parsed["result"])
    if isinstance(parsed, list):
        return parsed
    return None


def normalize_item(item):
    if not isinstance(item, dict):
        raise ValueError("Translation item is not an object")
    ru = item.get("ru")
    if not isinstance(ru, dict):
        ru = {field: item.get(field) for field in FIELDS}
    return {"id": item.get("id"), "ru": ru}


def validate_items(items, batch):
    expected = {item["id"]: item for item in batch}
    normalized = []
    for raw in items:
        item = normalize_item(raw)
        listing_id = item.get("id")
        if listing_id not in expected:
            raise ValueError(f"Unexpected id {listing_id}")
        for field in FIELDS:
            original = expected[listing_id].get(field)
            translated = item["ru"].get(field)
            if isinstance(original, list):
                if not isinstance(translated, list):
                    raise ValueError(f"{listing_id}.{field} must be an array")
                if len(translated) != len(original):
                    raise ValueError(f"{listing_id}.{field} changed array length")
            else:
                if not isinstance(translated, str):
                    raise ValueError(f"{listing_id}.{field} must be a string")
        normalized.append(item)
    if len(normalized) != len(batch):
        raise ValueError(f"Expected {len(batch)} listings, got {len(normalized)}")
    return normalized


def openrouter_chat(batch):
    user_payload = {
        "return_json_shape": {
            "listings": [
                {
                    "id": "same id",
                    "ru": {
                        "title": "Russian string",
                        "area": "Russian string",
                        "about": "Russian string",
                        "specs": ["Russian strings"],
                        "details": ["Russian strings"],
                        "tags": ["Russian strings"],
                        "amenities": ["Russian strings"],
                    },
                }
            ]
        },
        "rules": [
            "Translate rental listing text to Russian.",
            "Return JSON only, exactly with top-level key listings.",
            "Preserve ids exactly.",
            "Preserve URLs, prices, currencies, phone placeholders, emojis, dates, numbers, measurements, and [hidden information].",
            "Keep array lengths and order exactly the same.",
            "Translate only user-visible natural language.",
        ],
        "listings": [compact_listing(item) for item in batch],
    }
    body = {
        "model": MODEL,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": "You are a precise JSON-only translation engine for a rental marketplace app.",
            },
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
    }
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vietnam.teamgenius.ru/",
            "X-Title": "VietNest listing translation",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180, context=SSL_CONTEXT) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter {error.code}: {response_body[:1200]}") from error

    data = json.loads(response_body)
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    parsed = extract_json(content)
    items = pick_items(parsed)
    if not isinstance(items, list):
        preview = json.dumps(parsed, ensure_ascii=False)[:1000]
        raise ValueError(f"No listings array in response: {preview}")
    return validate_items(items, batch)


def main():
    source = load_json(INPUT)
    if OUTPUT.exists():
        output = load_json(OUTPUT)
    else:
        output = {
            "meta": {
                "sourceFile": str(INPUT),
                "model": MODEL,
                "translatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "purpose": "russian_translations_for_visible_listing_text",
                "fieldsTranslated": FIELDS,
                "notes": "Only user-visible listing text is translated. IDs are preserved for merging back into the database.",
            },
            "listings": [],
        }

    done = {item["id"] for item in output.get("listings", [])}
    listings = [item for item in source["listings"] if item["id"] not in done]
    print(f"input={INPUT}")
    print(f"output={OUTPUT}")
    print(f"model={MODEL}")
    print(f"already={len(done)} remaining={len(listings)} total={len(source['listings'])}", flush=True)

    for start in range(0, len(listings), BATCH_SIZE):
        batch = listings[start : start + BATCH_SIZE]
        translated = None
        for attempt in range(1, 5):
            try:
                translated = openrouter_chat(batch)
                break
            except Exception as error:
                print(f"batch={start // BATCH_SIZE + 1} attempt={attempt} failed: {error}", flush=True)
                if attempt == 4:
                    raise
                time.sleep(1.5 * attempt)
        existing = {item["id"]: item for item in output["listings"]}
        for item in translated:
            existing[item["id"]] = item
        output["listings"] = sorted(existing.values(), key=lambda item: item["id"])
        output["meta"]["count"] = len(output["listings"])
        output["meta"]["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        save_json(OUTPUT, output)
        print(f"translated={len(output['listings'])}/{len(source['listings'])}", flush=True)

    print(f"done {OUTPUT}", flush=True)


if __name__ == "__main__":
    main()
