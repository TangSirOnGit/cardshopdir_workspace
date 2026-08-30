#!/usr/bin/env python3
"""
Data cleaning + games inference + description generation for cardshopdir.

Phase 1: Clean (dedup, mark missing, classify shop type)
Phase 2: Games inference (rule-based + website scraping)
Phase 3: Description generation (rich template for noindex, LLM for index)
"""
import asyncio
import json
import os
import re
import time
from collections import Counter
from pathlib import Path

import aiohttp

DATA_DIR = Path(__file__).parent / "data"
INPUT = DATA_DIR / "shops.jsonl"
OUTPUT = DATA_DIR / "shops_clean.jsonl"
FAILED_LOG = DATA_DIR / "clean_failed.txt"

# ── Game keyword rules ──────────────────────────────────────────
GAME_RULES = [
    ("pokemon",             ["pokemon", "poke", "pikachu", "pkmn"]),
    ("magic-the-gathering", ["magic the gathering", "magic: the gathering", "mtg", "gathering"]),
    ("yu-gi-oh",            ["yu-gi-oh", "yugioh", "yu gi oh"]),
    ("flesh-and-blood",     ["flesh and blood", "flesh & blood", "fab card"]),
    ("sports",              ["sports card", "baseball card", "football card", "basketball card"]),
    ("lorcana",             ["lorcana", "disney lorcana"]),
    ("dragon-ball-super",   ["dragon ball", "dbs card", "dbz card"]),
    ("one-piece",           ["one piece", "onepiece"]),
    ("digimon",             ["digimon"]),
    ("star-wars-unlimited", ["star wars unlimited", "starwars unlimited"]),
    ("riftbound",           ["riftbound"]),
    ("union-arena",         ["union arena"]),
    ("weiss-schwarz",       ["weiss schwarz", "weiss schwarz"]),
    ("cardfight-vanguard",  ["cardfight", "cardfight!! vanguard", "vanguard card"]),
]

# Broader keywords for website scraping (case-insensitive match in page text)
GAME_WEB_KEYWORDS = {
    "pokemon": ["pokemon", "pokémon", "tcg pokemon", "pokemon tcg"],
    "magic-the-gathering": ["magic: the gathering", "magic the gathering", "mtg", "magic gathering"],
    "yu-gi-oh": ["yu-gi-oh", "yugioh", "yu gi oh"],
    "flesh-and-blood": ["flesh and blood", "flesh & blood"],
    "sports": ["sports card", "sports cards", "baseball card", "football card", "basketball card", "hockey card"],
    "lorcana": ["lorcana", "disney lorcana"],
    "dragon-ball-super": ["dragon ball super", "dragon ball z", "dbs card"],
    "one-piece": ["one piece card", "one piece tcg", "onepiece card"],
    "digimon": ["digimon card", "digimon tcg"],
    "star-wars-unlimited": ["star wars unlimited", "star wars: unlimited"],
    "riftbound": ["riftbound"],
    "union-arena": ["union arena"],
    "weiss-schwarz": ["weiss schwarz"],
    "cardfight-vanguard": ["cardfight vanguard", "cardfight!! vanguard"],
}

# ── Shop type classification ────────────────────────────────────
SHOP_TYPE_RULES = [
    ("tcg_specialty", ["tcg", "card shop", "card store", "trading card", "card game"]),
    ("comic_shop", ["comic"]),
    ("sports_cards", ["sports card", "baseball card", "football card"]),
    ("hobby_store", ["hobby"]),
    ("game_store", ["game shop", "game store", "gaming", "games"]),
    ("toy_store", ["toy"]),
    ("collectibles", ["collectible", "collectables"]),
]

# Known non-TCG chains (for classification, NOT deletion)
NON_TCG_CHAINS = {
    "dunham's sports", "go! calendars", "go! toys", "go! calendars, toys & games",
    "go! calendars & games", "go! toys, games & calendars", "go! toys & games",
    "hobbytown", "hobby lobby", "warhammer", "games workshop",
}

GAME_NAME_MAP = {
    "pokemon": "Pokemon",
    "magic-the-gathering": "Magic: The Gathering",
    "yu-gi-oh": "Yu-Gi-Oh!",
    "flesh-and-blood": "Flesh and Blood",
    "sports": "Sports Cards",
    "lorcana": "Lorcana",
    "dragon-ball-super": "Dragon Ball Super",
    "one-piece": "One Piece",
    "digimon": "Digimon",
    "star-wars-unlimited": "Star Wars Unlimited",
    "riftbound": "Riftbound",
    "union-arena": "Union Arena",
    "weiss-schwarz": "Weiss Schwarz",
    "cardfight-vanguard": "Cardfight!! Vanguard",
}


def classify_shop_type(name: str) -> str:
    n = (name or "").lower()
    if any(chain in n for chain in NON_TCG_CHAINS):
        if "hobby" in n or "calendar" in n or "toy" in n:
            return "general_retail"
        if "warhammer" in n or "games workshop" in n:
            return "hobby_store"
        return "general_retail"
    for shop_type, keywords in SHOP_TYPE_RULES:
        if any(kw in n for kw in keywords):
            return shop_type
    return "other"


def infer_games_from_text(text: str) -> list:
    text_lower = text.lower()
    found = []
    for game_slug, keywords in GAME_RULES:
        if any(kw in text_lower for kw in keywords):
            if game_slug not in found:
                found.append(game_slug)
    return found


def is_templated_description(desc: str) -> bool:
    return bool(desc and " - Trading card game shop in " in desc)


def should_index(shop: dict) -> bool:
    """Determine if a shop page should be indexed."""
    try:
        rc = int(shop.get("review_count") or 0)
    except (ValueError, TypeError):
        rc = 0
    has_hours = bool(shop.get("hours") and len(shop["hours"]) > 0)
    has_games = bool(shop.get("games") and len(shop["games"]) > 0)
    not_templated = not is_templated_description(shop.get("description") or "")
    return rc > 10 and has_hours and has_games and not_templated


def build_rich_template_desc(shop: dict) -> str:
    """Build a rich template description for noindex shops."""
    name = shop.get("name", "This shop")
    city = shop.get("city", "")
    state = shop.get("state", "")
    street = shop.get("street", "")
    games = shop.get("games") or []
    rating = shop.get("rating_value")
    review_count = shop.get("review_count")
    website = shop.get("website")
    hours = shop.get("hours") or []

    location = f"{city}, {state}" if city and state else (city or state or "")

    if games:
        game_names = [GAME_NAME_MAP.get(g, g) for g in games]
        if len(game_names) == 1:
            games_str = game_names[0]
        elif len(game_names) == 2:
            games_str = f"{game_names[0]} and {game_names[1]}"
        else:
            games_str = ", ".join(game_names[:-1]) + f", and {game_names[-1]}"
        games_sentence = f"The store carries {games_str}"
    else:
        games_sentence = "The store carries a variety of trading card games"

    rating_sentence = ""
    if rating and review_count:
        try:
            rc = int(review_count)
            rating_sentence = f" Rated {rating}/5 based on {rc} customer reviews."
        except (ValueError, TypeError):
            pass

    location_sentence = ""
    if location:
        location_sentence = f" in {location}"
    if street:
        location_sentence += f", located at {street}"

    hours_sentence = ""
    if hours:
        days = set()
        for h in hours:
            for d in (h.get("days") or []):
                days.add(d)
        if len(days) == 7:
            hours_sentence = " Open 7 days a week."
        elif len(days) >= 5:
            hours_sentence = f" Open {len(days)} days a week."

    website_sentence = ""
    if website and website.startswith("http"):
        website_sentence = " Visit their website for current inventory and events."

    desc = f"{name} is a trading card shop{location_sentence}. {games_sentence}.{rating_sentence}{hours_sentence}{website_sentence}"
    return desc


# ── Phase 1: Clean ──────────────────────────────────────────────
def clean_data(recs: list) -> list:
    print(f"Phase 1: Cleaning {len(recs)} records...")

    # Find duplicates: same name + same city + same state
    seen = {}
    to_remove = set()
    for i, r in enumerate(recs):
        key = (r.get("name", ""), r.get("city", ""), r.get("state", ""))
        if key in seen:
            # Keep the one with more complete data
            j = seen[key]
            def completeness(idx):
                rr = recs[idx]
                return sum(1 for v in rr.values() if v not in (None, "", [], {}))
            if completeness(i) > completeness(j):
                to_remove.add(j)
                seen[key] = i
            else:
                to_remove.add(i)
        else:
            seen[key] = i

    print(f"  Duplicates to remove: {len(to_remove)}")

    cleaned = []
    for i, r in enumerate(recs):
        if i in to_remove:
            continue
        # Add shop_type
        r["shop_type"] = classify_shop_type(r.get("name"))
        # Mark missing critical fields
        r["missing_city"] = not r.get("city")
        r["missing_state"] = not r.get("state")
        r["missing_latlng"] = not r.get("latitude") or not r.get("longitude")
        # Normalize games to slug format
        existing_games = r.get("games") or []
        normalized = []
        for g in existing_games:
            slug = g.lower().replace(" ", "-").replace(":", "").replace("!!", "").strip("-")
            slug_map = {
                "magic-the-gathering": "magic-the-gathering",
                "pokemon": "pokemon",
                "yu-gi-oh": "yu-gi-oh",
                "yu-gi-oh!": "yu-gi-oh",
                "flesh-and-blood": "flesh-and-blood",
                "sports": "sports",
                "lorcana": "lorcana",
                "dragon-ball-super": "dragon-ball-super",
                "one-piece": "one-piece",
                "digimon": "digimon",
                "star-wars-unlimited": "star-wars-unlimited",
                "riftbound": "riftbound",
                "union-arena": "union-arena",
                "weiss-schwarz": "weiss-schwarz",
                "cardfight-vanguard": "cardfight-vanguard",
            }
            normalized.append(slug_map.get(slug, slug))
        r["games"] = list(set(normalized))
        cleaned.append(r)

    print(f"  Cleaned records: {len(cleaned)}")
    return cleaned


# ── Phase 2: Games inference ────────────────────────────────────
def infer_games_rulebased(recs: list) -> list:
    print("Phase 2a: Rule-based games inference...")
    inferred = 0
    for r in recs:
        if r.get("games"):
            continue
        text = (r.get("name") or "") + " " + (r.get("website") or "")
        games = infer_games_from_text(text)
        if games:
            r["games"] = games
            r["games_source"] = "rule"
            inferred += 1
        else:
            r["games_source"] = "none"
    print(f"  Inferred by rules: {inferred}")
    return recs


async def scrape_website_games(session, url, sem):
    """Scrape a shop's website to find game keywords."""
    if not url or not url.startswith("http"):
        return []
    # Skip facebook (hard to parse, often blocks)
    if "facebook.com" in url or "instagram.com" in url or "twitter.com" in url or "x.com" in url:
        return []
    try:
        async with sem:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10), allow_redirects=True) as resp:
                if resp.status != 200:
                    return []
                html = await resp.text(errors="ignore")
                # Extract visible text (rough)
                text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S)
                text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.S)
                text = re.sub(r"<[^>]+>", " ", text)
                text_lower = text.lower()
                found = []
                for game_slug, keywords in GAME_WEB_KEYWORDS.items():
                    if any(kw in text_lower for kw in keywords):
                        if game_slug not in found:
                            found.append(game_slug)
                return found
    except Exception:
        return []


async def infer_games_from_websites(recs: list) -> list:
    print("Phase 2b: Website scraping for games inference...")
    need_scrape = [r for r in recs if not r.get("games") and r.get("games_source") == "none"]
    print(f"  Shops needing website scrape: {len(need_scrape)}")

    if not need_scrape:
        return recs

    sem = asyncio.Semaphore(15)
    headers = {"User-Agent": "Mozilla/5.0 (compatible; CardShopDirBot/1.0)"}
    connector = aiohttp.TCPConnector(limit=15, force_close=True)

    inferred = 0
    failed = 0
    done = [0]

    async def process_one(r):
        games = await scrape_website_games(session, r.get("website"), sem)
        done[0] += 1
        if done[0] % 100 == 0:
            print(f"  [{done[0]}/{len(need_scrape)}] processed", flush=True)
        if games:
            r["games"] = games
            r["games_source"] = "website"
            return 1
        else:
            r["games_source"] = "unknown"
            return 0

    async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
        tasks = [process_one(r) for r in need_scrape]
        results = await asyncio.gather(*tasks)
        inferred = sum(results)
        failed = len(results) - inferred

    print(f"  Inferred from website: {inferred}")
    print(f"  Still unknown: {failed}")
    return recs


# ── Phase 3: Description generation ─────────────────────────────
def generate_rich_templates(recs: list) -> list:
    print("Phase 3a: Rich template descriptions for noindex shops...")
    count = 0
    for r in recs:
        if not should_index(r):
            desc = r.get("description") or ""
            if is_templated_description(desc) or not desc:
                r["description"] = build_rich_template_desc(r)
                r["description_source"] = "template"
                count += 1
            else:
                r["description_source"] = "original"
    print(f"  Generated rich templates: {count}")
    return recs


async def generate_llm_descriptions(recs: list, api_key: str) -> list:
    print("Phase 3b: LLM descriptions for index shops...")
    need_llm = [r for r in recs if should_index(r) and is_templated_description(r.get("description") or "")]
    print(f"  Shops needing LLM description: {len(need_llm)}")

    if not need_llm or not api_key:
        # Fall back to rich template for all
        for r in need_llm:
            r["description"] = build_rich_template_desc(r)
            r["description_source"] = "template_fallback"
        print(f"  No API key or no shops need LLM. Used template fallback.")
        return recs

    sem = asyncio.Semaphore(10)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    connector = aiohttp.TCPConnector(limit=10, force_close=True)
    done = [0]
    success = [0]

    def build_prompt(r: dict) -> str:
        name = r.get("name", "this shop")
        city = r.get("city", "")
        state = r.get("state", "")
        games = r.get("games") or []
        game_names = [GAME_NAME_MAP.get(g, g) for g in games]
        games_str = ", ".join(game_names) if game_names else "various trading card games"
        rating = r.get("rating_value", "")
        review_count = r.get("review_count", "")
        hours = r.get("hours") or []
        hours_str = ""
        if hours:
            days = set()
            for h in hours:
                for d in (h.get("days") or []):
                    days.add(d)
            hours_str = f"Open {len(days)} days a week"
        website = r.get("website", "")

        return f"""Write a unique, natural 100-150 word description for a trading card shop directory listing.

Shop: {name}
Location: {city}, {state}
Games: {games_str}
Rating: {rating}/5 ({review_count} reviews)
Hours: {hours_str}
Website: {website}

Requirements:
1. Describe what this shop offers (games, products)
2. Mention the city/location naturally
3. Include relevant keywords (trading cards, the specific games)
4. Read naturally, NOT like a template
5. Do NOT start with the shop name - vary the opening
6. Do NOT use markdown formatting
7. Do NOT make up facts not provided above

Output only the description text, nothing else."""

    async def gen_one(session, r):
        prompt = build_prompt(r)
        payload = {
            "model": "deepseek/deepseek-v4-flash",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 250,
            "temperature": 0.7,
        }
        for attempt in range(3):
            try:
                async with sem:
                    async with session.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            content = data["choices"][0]["message"]["content"].strip()
                            if content and len(content) > 50:
                                r["description"] = content
                                r["description_source"] = "llm"
                                success[0] += 1
                                return
                        elif resp.status == 429:
                            await asyncio.sleep(3 * (attempt + 1))
                            continue
            except Exception:
                await asyncio.sleep(2 * (attempt + 1))
                continue
        # Fallback to template
        r["description"] = build_rich_template_desc(r)
        r["description_source"] = "template_fallback"

    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [gen_one(session, r) for r in need_llm]
        for i, task in enumerate(asyncio.as_completed(tasks)):
            await task
            done[0] += 1
            if done[0] % 50 == 0:
                print(f"  [{done[0]}/{len(need_llm)}] done (success: {success[0]})", flush=True)

    print(f"  LLM generated: {success[0]}")
    print(f"  Template fallback: {len(need_llm) - success[0]}")
    return recs


# ── Main ────────────────────────────────────────────────────────
async def main():
    api_key = os.environ.get("OPENROUTER_API_KEY", "")

    # Load
    recs = [json.loads(l) for l in open(INPUT, encoding="utf-8")]
    print(f"Loaded {len(recs)} records\n")

    # Phase 1: Clean
    recs = clean_data(recs)

    # Phase 2: Games inference
    recs = infer_games_rulebased(recs)
    recs = await infer_games_from_websites(recs)

    # Phase 3: Descriptions
    recs = generate_rich_templates(recs)
    recs = await generate_llm_descriptions(recs, api_key)

    # Stats
    print("\n=== Final Stats ===")
    print(f"  Total records: {len(recs)}")
    has_games = sum(1 for r in recs if r.get("games"))
    print(f"  Has games: {has_games} ({100*has_games/len(recs):.1f}%)")
    indexed = sum(1 for r in recs if should_index(r))
    print(f"  Should index: {indexed} ({100*indexed/len(recs):.1f}%)")
    desc_sources = Counter(r.get("description_source", "original") for r in recs)
    print(f"  Description sources: {dict(desc_sources)}")
    games_sources = Counter(r.get("games_source", "original") for r in recs)
    print(f"  Games sources: {dict(games_sources)}")
    shop_types = Counter(r.get("shop_type") for r in recs)
    print(f"  Shop types: {dict(shop_types)}")

    # Write output
    with open(OUTPUT, "w", encoding="utf-8") as f:
        for r in recs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"\nWritten to {OUTPUT}")


if __name__ == "__main__":
    t0 = time.time()
    asyncio.run(main())
    print(f"\nTotal elapsed: {time.time()-t0:.1f}s")
