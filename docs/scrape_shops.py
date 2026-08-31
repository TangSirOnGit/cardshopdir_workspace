#!/usr/bin/env python3
"""
Reverse-engineer basic shop data from keepupcards.com by scraping the
JSON-LD LocalBusiness structured data embedded in each /shop/ page.

Input:  /tmp/shop_urls_clean.txt  (one URL per line)
Output: /Users/tangsir/work/source_code/aiconsultants/data/shops.jsonl
        /Users/tangsir/work/source_code/aiconsultants/data/shops.csv
        /Users/tangsir/work/source_code/aiconsultants/data/failed.txt
"""
import asyncio
import csv
import json
import os
import re
import sys
import time
from pathlib import Path

import aiohttp

URLS_FILE = "/tmp/shop_urls_clean.txt"
OUT_DIR = Path("/Users/tangsir/work/source_code/aiconsultants/data")
JSONL_PATH = OUT_DIR / "shops.jsonl"
CSV_PATH = OUT_DIR / "shops.csv"
FAILED_PATH = OUT_DIR / "failed.txt"
PROGRESS_PATH = OUT_DIR / "progress.txt"

CONCURRENCY = 12
TIMEOUT = 30
MAX_RETRIES = 3
RETRY_BACKOFF = 2.0

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")

JSONLD_RE = re.compile(
    r'<script type="application/ld\+json">(.*?)</script>', re.S)
OG_IMAGE_RE = re.compile(
    r'<meta property="og:image" content="([^"]+)"')
DESC_META_RE = re.compile(
    r'<meta name="description" content="([^"]+)"')


def extract_jsonld(html: str):
    blocks = JSONLD_RE.findall(html)
    for b in blocks:
        try:
            obj = json.loads(b)
        except json.JSONDecodeError:
            # try to fix common truncation by stripping trailing comma
            try:
                obj = json.loads(b.rstrip().rstrip(","))
            except Exception:
                continue
        if isinstance(obj, dict) and obj.get("@type") == "LocalBusiness":
            return obj
    return None


def parse_shop(url: str, html: str) -> dict:
    ld = extract_jsonld(html) or {}
    addr = ld.get("address") or {}
    geo = ld.get("geo") or {}
    rating = ld.get("aggregateRating") or {}
    offers = ld.get("makesOffer") or []
    if isinstance(offers, dict):
        offers = [offers]
    games = []
    for o in offers:
        item = o.get("itemOffered") or {}
        n = item.get("name")
        if n:
            games.append(n)
    hours = ld.get("openingHoursSpecification") or []
    if isinstance(hours, dict):
        hours = [hours]
    hours_list = []
    for h in hours:
        days = h.get("dayOfWeek")
        if isinstance(days, str):
            days = [days]
        hours_list.append({
            "days": days or [],
            "opens": h.get("opens"),
            "closes": h.get("closes"),
        })
    og_image = OG_IMAGE_RE.search(html)
    meta_desc = DESC_META_RE.search(html)
    return {
        "source_url": url,
        "name": ld.get("name"),
        "description": ld.get("description"),
        "meta_description": meta_desc.group(1) if meta_desc else None,
        "website": ld.get("url"),
        "telephone": ld.get("telephone"),
        "email": ld.get("email"),
        "image": og_image.group(1) if og_image else None,
        "street": addr.get("streetAddress"),
        "city": addr.get("addressLocality"),
        "state": addr.get("addressRegion"),
        "postal_code": addr.get("postalCode"),
        "country": addr.get("addressCountry"),
        "latitude": geo.get("latitude"),
        "longitude": geo.get("longitude"),
        "rating_value": rating.get("ratingValue"),
        "review_count": rating.get("reviewCount"),
        "games": games,
        "hours": hours_list,
    }


async def fetch_one(session, url, sem, writer, csv_writer, failed, done, total):
    for attempt in range(1, MAX_RETRIES + 1):
        async with sem:
            try:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=TIMEOUT)) as resp:
                    if resp.status == 200:
                        html = await resp.text()
                        rec = parse_shop(url, html)
                        writer.write(json.dumps(rec, ensure_ascii=False) + "\n")
                        writer.flush()
                        csv_writer.writerow(rec)
                        done[0] += 1
                        if done[0] % 50 == 0:
                            print(f"  [{done[0]}/{total}] ok", flush=True)
                            PROGRESS_PATH.write_text(f"{done[0]}/{total}\n")
                        return
                    elif resp.status in (429, 503):
                        wait = RETRY_BACKOFF * attempt
                        await asyncio.sleep(wait)
                        continue
                    else:
                        failed.append((url, f"HTTP {resp.status}"))
                        return
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                await asyncio.sleep(RETRY_BACKOFF * attempt)
                continue
    failed.append((url, "max retries exceeded"))


async def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    urls = [l.strip() for l in open(URLS_FILE) if l.strip()]
    total = len(urls)
    print(f"Scraping {total} shop URLs, concurrency={CONCURRENCY}", flush=True)

    # Resume support: skip already-done URLs
    done_urls = set()
    if JSONL_PATH.exists():
        with open(JSONL_PATH) as f:
            for line in f:
                try:
                    done_urls.add(json.loads(line)["source_url"])
                except Exception:
                    pass
    if done_urls:
        print(f"Resuming: {len(done_urls)} already done, skipping.", flush=True)
    urls = [u for u in urls if u not in done_urls]
    print(f"Remaining: {len(urls)}", flush=True)

    sem = asyncio.Semaphore(CONCURRENCY)
    failed = []
    done = [0]
    headers = ["source_url", "name", "description", "meta_description",
               "website", "telephone", "email", "image",
               "street", "city", "state", "postal_code", "country",
               "latitude", "longitude", "rating_value", "review_count",
               "games", "hours"]
    jsonl_fp = open(JSONL_PATH, "a", encoding="utf-8")
    csv_fp = open(CSV_PATH, "a", encoding="utf-8", newline="")
    csv_writer = csv.writer(csv_fp)
    if CSV_PATH.stat().st_size == 0:
        csv_writer.writerow(headers)

    connector = aiohttp.TCPConnector(limit=CONCURRENCY, force_close=True)
    async with aiohttp.ClientSession(
        connector=connector,
        headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"},
    ) as session:
        tasks = [fetch_one(session, u, sem, jsonl_fp, csv_writer,
                           failed, done, total) for u in urls]
        await asyncio.gather(*tasks)

    jsonl_fp.close()
    csv_fp.close()
    with open(FAILED_PATH, "w") as f:
        for u, reason in failed:
            f.write(f"{u}\t{reason}\n")
    print(f"\nDone. Success: {total - len(failed)}, Failed: {len(failed)}", flush=True)
    print(f"JSONL: {JSONL_PATH}", flush=True)
    print(f"CSV:   {CSV_PATH}", flush=True)
    print(f"Failed list: {FAILED_PATH}", flush=True)


if __name__ == "__main__":
    t0 = time.time()
    asyncio.run(main())
    print(f"Elapsed: {time.time()-t0:.1f}s", flush=True)
