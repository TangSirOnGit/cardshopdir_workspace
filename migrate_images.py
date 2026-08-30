#!/usr/bin/env python3
"""
Migrate shop images from KeepUp's Supabase to our Cloudflare R2.

- Downloads 6,769 real shop images from supabase.co
- Uploads to R2 bucket 'cardshopdir' with key: shops/{slug}.jpg
- Updates shops_final.jsonl with new R2 URLs
- Placeholder images (keepupcards.com/placeholder.svg) are set to empty string
- Skips already-migrated images (resumable)

Usage:
  python3 migrate_images.py

Requires: boto3, aiohttp (pip install boto3 aiohttp)
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import aiohttp
import boto3
from botocore.config import Config

# ── Config ──────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
INPUT = DATA_DIR / "shops_final.jsonl"
OUTPUT = DATA_DIR / "shops_final.jsonl"  # overwrite in-place
PROGRESS_FILE = DATA_DIR / "image_migration_progress.json"

R2_ACCOUNT_ID = "2f20e0cb516260ec8e08588792bd89f4"
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "b19a9294a55ac81765fd525fdca3e7b0")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "814c553724cb77e8cd314a8c2c6cb49d2527d79d89eea26cbb7daeb1604386ab")
R2_BUCKET = "cardshopdir"
R2_PUBLIC_URL = "https://assert.cardshopdir.com"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

CONCURRENCY = 20  # parallel downloads


# ── R2 Client ───────────────────────────────────────────────────
s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)


def get_slug(source_url: str) -> str:
    """Extract slug from source_url like https://www.keepupcards.com/shop/{slug}"""
    return source_url.split("/shop/")[-1]


def is_placeholder(url: str) -> bool:
    """Check if URL is a KeepUp placeholder."""
    return "placeholder" in url or not url


def is_already_migrated(url: str) -> bool:
    """Check if image is already on our R2."""
    return url.startswith(R2_PUBLIC_URL)


def get_extension(url: str, content_type: str = "") -> str:
    """Determine file extension from URL or content-type."""
    if content_type:
        ct_map = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
            "image/svg+xml": ".svg",
        }
        for ct, ext in ct_map.items():
            if ct in content_type:
                return ext
    path = urlparse(url).path
    if "." in path.split("/")[-1]:
        ext = "." + path.split("/")[-1].rsplit(".", 1)[-1]
        if ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"):
            return ext
    return ".jpg"


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        return json.load(open(PROGRESS_FILE))
    return {}


def save_progress(progress: dict):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f)


async def download_and_upload(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    shop: dict,
    progress: dict,
    stats: dict,
):
    source_url = shop.get("image", "")
    slug = get_slug(shop["source_url"])

    if is_placeholder(source_url):
        shop["image"] = ""
        shop["image_source"] = "none"
        stats["placeholder"] += 1
        return

    if is_already_migrated(source_url):
        stats["already_migrated"] += 1
        return

    if slug in progress:
        shop["image"] = progress[slug]
        shop["image_source"] = "r2"
        stats["skipped"] += 1
        return

    # Download
    try:
        async with sem:
            async with session.get(
                source_url, timeout=aiohttp.ClientTimeout(total=30), allow_redirects=True
            ) as resp:
                if resp.status != 200:
                    stats["download_failed"] += 1
                    shop["image"] = ""
                    shop["image_source"] = "download_failed"
                    return

                content_type = resp.headers.get("Content-Type", "image/jpeg")
                image_data = await resp.read()

                if not image_data or len(image_data) < 100:
                    stats["download_failed"] += 1
                    shop["image"] = ""
                    shop["image_source"] = "empty_image"
                    return

    except asyncio.TimeoutError:
        stats["download_failed"] += 1
        shop["image"] = ""
        shop["image_source"] = "timeout"
        return
    except Exception as e:
        stats["download_failed"] += 1
        shop["image"] = ""
        shop["image_source"] = f"error: {type(e).__name__}"
        return

    # Upload to R2
    ext = get_extension(source_url, content_type)
    r2_key = f"shops/{slug}{ext}"
    r2_url = f"{R2_PUBLIC_URL}/shops/{slug}{ext}"

    try:
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=r2_key,
            Body=image_data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
        shop["image"] = r2_url
        shop["image_source"] = "r2"
        progress[slug] = r2_url
        stats["uploaded"] += 1
    except Exception as e:
        stats["upload_failed"] += 1
        shop["image"] = ""
        shop["image_source"] = f"upload_error: {type(e).__name__}"


async def main():
    recs = [json.loads(l) for l in open(INPUT, encoding="utf-8")]
    print(f"Loaded {len(recs)} records")

    # Categorize
    placeholders = [r for r in recs if is_placeholder(r.get("image", ""))]
    already_done = [r for r in recs if is_already_migrated(r.get("image", ""))]

    print(f"  Placeholders (set empty): {len(placeholders)}")
    print(f"  Already migrated: {len(already_done)}")

    # Set placeholders to empty
    for r in placeholders:
        r["image"] = ""
        r["image_source"] = "none"

    # Load progress
    progress = load_progress()
    print(f"  Progress file: {len(progress)} already done")

    # Apply progress to records
    for r in recs:
        slug = get_slug(r["source_url"])
        if slug in progress and not is_already_migrated(r.get("image", "")):
            r["image"] = progress[slug]
            r["image_source"] = "r2"

    # Find what still needs migration
    to_migrate = [
        r for r in recs
        if not is_placeholder(r.get("image", ""))
        and not is_already_migrated(r.get("image", ""))
        and get_slug(r["source_url"]) not in progress
    ]
    print(f"\n  Actually downloading: {len(to_migrate)} images")
    print(f"  Concurrency: {CONCURRENCY}")
    print()

    stats = {
        "uploaded": 0, "skipped": 0, "placeholder": len(placeholders),
        "already_migrated": len(already_done),
        "download_failed": 0, "upload_failed": 0,
    }
    sem = asyncio.Semaphore(CONCURRENCY)
    headers = {"User-Agent": "Mozilla/5.0 (compatible; CardShopDirBot/1.0)"}
    connector = aiohttp.TCPConnector(limit=CONCURRENCY, force_close=True)

    done = [0]
    total = len(to_migrate)
    last_save = time.time()

    async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
        tasks = [download_and_upload(session, sem, r, progress, stats) for r in to_migrate]

        for task in asyncio.as_completed(tasks):
            await task
            done[0] += 1
            if done[0] % 100 == 0:
                print(
                    f"  [{done[0]}/{total}] uploaded={stats['uploaded']} "
                    f"failed={stats['download_failed']+stats['upload_failed']}",
                    flush=True,
                )
                if time.time() - last_save > 30:
                    save_progress(progress)
                    last_save = time.time()

    save_progress(progress)

    # Write updated data
    with open(OUTPUT, "w", encoding="utf-8") as f:
        for r in recs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Stats
    print(f"\n=== Migration Complete ===")
    print(f"  Uploaded:          {stats['uploaded']}")
    print(f"  Skipped (cached):  {stats['skipped']}")
    print(f"  Placeholders:      {stats['placeholder']}")
    print(f"  Already migrated:  {stats['already_migrated']}")
    print(f"  Download failed:   {stats['download_failed']}")
    print(f"  Upload failed:     {stats['upload_failed']}")
    print(f"  Total:             {len(recs)}")

    r2_urls = sum(1 for r in recs if r.get("image", "").startswith(R2_PUBLIC_URL))
    empty = sum(1 for r in recs if not r.get("image"))
    print(f"\n  R2 URLs in data:   {r2_urls}")
    print(f"  Empty (no image):  {empty}")
    print(f"  Written to:        {OUTPUT}")


if __name__ == "__main__":
    t0 = time.time()
    asyncio.run(main())
    print(f"\nTotal elapsed: {time.time()-t0:.1f}s")
