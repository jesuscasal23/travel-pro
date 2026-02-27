# Instagram API Research: Travel Destination Video Integration

**Date:** 2026-02-27
**Purpose:** Evaluate Instagram/Meta API options for fetching short destination travel videos (Reels) to display in a travel planning web app instead of static city images.

---

## 1. Instagram Basic Display API — DEAD

**Status: Deprecated and non-functional as of December 4, 2024.**

The Basic Display API reached end-of-life and was permanently shut down by Meta. It no longer works for any integration. All tools and apps that depended on it (social media widgets, Instagram feed embedders, etc.) were required to migrate elsewhere. There is no replacement that serves the same purpose (personal account access for any user).

**What it used to do:** Allowed any Instagram user (personal, business, or creator) to authorize a third-party app to read their media. It did not support public content search, hashtag discovery, or fetching videos from arbitrary accounts.

**Relevance to this use case:** None. It is gone and was never suited for fetching destination content anyway.

---

## 2. Instagram Graph API

**Status: Active, but severely limited for this use case.**

### What it supports

The Graph API is Meta's current production Instagram API. It is designed for business and brand tools — scheduling, analytics, comment management, and DMs. It supports:

- Reading and publishing media (photos, videos, Reels, Stories, Carousels) for accounts your app manages
- Reels as a first-class media type (since mid-2022): publish Reels, retrieve per-Reel stats (views, likes, comments)
- Hashtag search: `GET /ig_hashtag_search` → `GET /{hashtag-id}/recent_media` or `/{hashtag-id}/top_media`
- Business discovery (limited): look up _other_ public Business/Creator profiles by username

### What it does NOT support

- Fetching Reels or videos from arbitrary public accounts (personal or business) without them authorizing your app
- Location-based content search (no "show me Reels tagged in Santorini" endpoint)
- Searching public content by keyword beyond the narrow hashtag search endpoint
- Any access to personal/private accounts

### Authentication complexity

1. **Meta developer account + App creation**: Register at developers.facebook.com, create a Meta App tied to a Facebook Page.
2. **Business Verification**: For production use beyond development sandbox (which limits you to 5 test users), your business must complete Meta's Business Verification — a multi-day process requiring legal documents.
3. **App Review**: Most useful permissions (e.g., `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`) require submitting your app for review with detailed use-case documentation, screencasts, and a live URL. Review can take days to weeks and may be rejected.
4. **OAuth 2.0 per user**: Each Instagram Business or Creator account owner must individually authorize your app via OAuth. You cannot pull content from accounts that have not authorized you.
5. **Token management**: Short-lived access tokens (1 hour) must be exchanged for long-lived tokens (60 days) and refreshed on a schedule. Requires secure server-side token storage.

### Rate limits and quotas

- **Hashtag search**: Max 30 unique hashtags searched per week per Instagram Business Account connected to your app. Results do not include video file URLs — only media IDs, captions, media type, and timestamps.
- **General API calls**: Calls-per-hour limits scale with the number of users connected to the app.
- **Content discovery via hashtag**: Even if you retrieve a media ID from a hashtag search, you cannot retrieve the actual video file URL for a media item that does not belong to an account your app manages.

### Verdict for this use case

**Not viable.** The Graph API cannot retrieve video content from public accounts at scale, does not support location/destination search, and the hashtag search endpoint returns only metadata (no video URLs). Getting actual playable Reels for arbitrary cities is not possible through official Graph API endpoints.

---

## 3. Instagram oEmbed API

**Status: Active, but requires a known post URL.**

The oEmbed endpoint (`https://graph.facebook.com/v21.0/instagram_oembed`) allows you to pass a known public Instagram post or Reel URL and receive back an HTML embed snippet. This is how many blog platforms and CMS tools embed individual Instagram posts.

### What it supports

- Given a specific Instagram URL (e.g., `https://www.instagram.com/reel/AbCdEfG/`), return an `<blockquote>` HTML embed code
- Works for public posts from Business and Creator accounts
- Returns `html`, `width`, `height`, `provider_name`, `provider_url`
- No video file access — it renders the Instagram embedded player widget (requires Instagram's JS to load)

### What it does NOT support

- Discovering or searching for content — you must already know the specific post URL
- Thumbnail URLs (Meta removed `thumbnail_url`, `thumbnail_width`, `thumbnail_height`, and `author_name` from oEmbed responses as of recent updates)
- Batch fetching or programmatic search

### Authentication

Requires a Meta App access token (app token, not user token). Relatively straightforward compared to full Graph API OAuth, but still requires a registered Meta App.

### Verdict for this use case

**Not viable at scale.** oEmbed only works if you already have a curated list of specific Reel URLs for each destination. There is no discovery mechanism. You would need to manually find and hardcode Reel URLs per city, and those links can become unavailable if the creator deletes the post or makes their account private.

---

## 4. Unofficial Scraping and Third-Party Services (e.g., Apify, Bright Data)

### What is available

Services like Apify, Bright Data, ScrapFly, and ScrapeCreators offer paid APIs that scrape Instagram's public-facing website and return structured data including post metadata, video URLs, and hashtag feeds. Apify's Instagram Scraper actor is among the most established of these tools.

### Legal and ToS considerations

- **Instagram's Terms of Use explicitly prohibit**: "You can't attempt to create accounts or access or collect information in unauthorized ways. This includes creating accounts or collecting information in an automated way without our express permission."
- Meta has pursued legal action against scrapers and has obtained injunctions in US courts (the _Meta v. Bright Data_ case, 2024, resulted in a ruling that scraping behind authentication violates the CFAA).
- The hiQ v. LinkedIn precedent applies to _truly public_ data (no login required), but Instagram increasingly gates content behind a login wall, narrowing the legal protection for scrapers.
- **Practical risks**: Account bans, IP blocks, sudden API breakage (scrapers break frequently when Instagram changes its frontend), and potential legal exposure for a commercial product.
- **For a legitimate, VC-fundable, or enterprise-targeted product**, shipping a feature built on scraping third-party platforms is a serious liability and will surface during due diligence.

### Verdict

**Do not pursue.** The ToS violation risk, unreliability, and legal exposure are unacceptable for a production travel application.

---

## 5. Meta Official Partner Programs

Meta operates a **Marketing Partner Program** and a **Technology Partner Program**, but these are aimed at:

- Large social media management platforms (Hootsuite, Sprout Social scale)
- Advertising technology companies
- Business intelligence and analytics vendors

There is no Meta partner program that grants travel apps access to fetch or display public Reels content from arbitrary creators. There is no "media licensing" or "content discovery" partner tier available to third-party developers. Meta does not offer a licensed content API for embedding third-party Reels in external applications.

---

## 6. Alternative Approaches

### Option A: Pexels Video API (Recommended for MVP)

**URL:** https://www.pexels.com/api/

- **Free** with a registered API key; no business verification or app review
- License: All content is free for commercial use under the Pexels License (no attribution required, though recommended)
- **Search by city/destination name**: `GET https://api.pexels.com/videos/search?query=santorini&per_page=5` — returns video objects with multiple resolution sources (SD/HD/Full HD/4K) as direct MP4 URLs
- **Rate limits**: 200 requests/hour, 20,000 requests/month by default; unlimited rate available on request if you meet terms
- **Video quality**: High-quality HD/4K cinematic clips — often better production value than typical Instagram Reels
- **No OAuth, no user accounts, no per-user tokens** — a single API key in your backend, trivial to implement
- **Limitation**: Curated stock footage, not UGC. Some niche or less-touristed destinations may have limited coverage, though major travel destinations have strong libraries.

**Implementation sketch for TravelPro:**

```ts
// GET /api/v1/destinations/[city]/video
const res = await fetch(
  `https://api.pexels.com/videos/search?query=${encodeURIComponent(city)}+travel&per_page=3&orientation=portrait`,
  { headers: { Authorization: process.env.PEXELS_API_KEY! } }
);
const data = await res.json();
// data.videos[0].video_files → pick a 720p source, cache result in Redis (TTL 24h)
```

### Option B: YouTube Data API v3

- **Free** with a Google Cloud API key; 10,000 quota units/day by default
- `search.list` costs 100 units per call — at 10,000 units/day you get ~100 city video searches per day (cacheable, so fine in practice)
- Can search `q="santorini travel"` and filter `type=video`, `videoDefinition=high`, `videoDuration=short`
- Returns video IDs; embed via YouTube iframe (`https://www.youtube.com/embed/{videoId}`) — no direct video file URL
- Content quality is highly variable (algorithm returns popular videos but not always cinematic clips)
- YouTube embed iframe loads YouTube's full player JS — adds weight to page, slower than a native `<video>` tag
- **No app review** required for read-only search with an API key

### Option C: Pixabay Video API

- Fully free, no attribution required for commercial use
- `GET https://pixabay.com/api/videos/?key=...&q=santorini&video_type=film`
- Smaller library than Pexels, but useful as a fallback
- Returns direct MP4 URLs

### Option D: Curated Static Asset Library

Pre-download 1–3 short video clips per major destination from Pexels/Pixabay, convert to `.webp` looping or `.mp4`, host on your CDN. Zero API calls, zero rate limits, maximum performance. Works well for the ~50–100 destinations you currently have city images for.

---

## Summary Matrix

| Option                           | Cost          | Auth Complexity                                               | Video Discovery        | Direct MP4        | Legal Risk         | Viability       |
| -------------------------------- | ------------- | ------------------------------------------------------------- | ---------------------- | ----------------- | ------------------ | --------------- |
| Instagram Basic Display API      | Free          | N/A — deprecated                                              | None                   | No                | —                  | Dead            |
| Instagram Graph API              | Free          | Very high (app review, business verification, per-user OAuth) | Extremely limited      | No                | Low (if compliant) | Not viable      |
| Instagram oEmbed                 | Free          | Medium (Meta App token)                                       | None (need known URLs) | No (iframe only)  | Low                | Not viable      |
| Unofficial scraping (Apify etc.) | Paid          | None                                                          | Yes (hashtags)         | Unstable          | High (ToS, legal)  | Reject          |
| **Pexels Video API**             | Free          | Very low (API key only)                                       | Yes (keyword search)   | Yes (MP4)         | None               | **Recommended** |
| YouTube Data API                 | Free          | Low (API key only)                                            | Yes (keyword search)   | No (iframe embed) | None               | Good fallback   |
| Pixabay API                      | Free          | Very low (API key only)                                       | Yes (keyword search)   | Yes (MP4)         | None               | Good fallback   |
| Curated static CDN               | CDN cost only | None                                                          | Manual                 | Yes (MP4)         | None               | Best for perf   |

---

## Recommendation

**Do not pursue Instagram/Meta APIs for this use case.** The surface area of viable, legal content discovery through Instagram's official APIs is essentially zero for a travel app that needs to display destination videos for arbitrary cities. The Basic Display API is gone, the Graph API gates everything behind per-user OAuth, oEmbed requires known URLs, and scraping violates ToS.

**Recommended approach: Pexels Video API as primary source, with optional YouTube iframe as secondary.**

1. **Phase 1 (immediate)**: Add `PEXELS_API_KEY` to env vars. On the trip summary/plan view, when rendering a city card, call a new internal API route `GET /api/v1/destinations/[citySlug]/video` that queries Pexels, picks the best portrait-orientation HD clip, and returns the direct MP4 URL. Cache each result in Upstash Redis (TTL: 24 hours). Display as an autoplaying, muted, looping `<video>` with the existing city image as poster/fallback.

2. **Phase 2 (optimization)**: Pre-fetch and cache video URLs for the ~50 destinations in your `src/data/cities.ts` at build time. For rare destinations not in Pexels, fall back to the existing static `.webp` images. Optionally pre-download and self-host clips on a CDN for the top 20 most-booked destinations to eliminate API dependency and latency entirely.

3. **YouTube as a secondary option** makes sense only if you want longer-form destination inspiration content (e.g., a "destination guide" modal with a curated YouTube video). It is not suitable for background/ambient video loops due to the iframe player overhead.

---

## Sources

- [Instagram Basic Display API Deprecation — Behold](https://behold.so/updates/basic-display-api-deprecated/)
- [After Basic Display EOL: 2026 API Rules — Storrito](https://storrito.com/resources/Instagram-API-2026/)
- [Instagram Graph API Complete Developer Guide 2026 — Elfsight](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [Instagram Graph API Guide 2026: Auth, Limits — getlate.dev](https://getlate.dev/blog/instagram-graph-api)
- [A Complete Guide to the Instagram Reels API — Phyllo](https://www.getphyllo.com/post/a-complete-guide-to-the-instagram-reels-api)
- [Instagram API Deprecated? What to Do in 2026 — SociaVault](https://sociavault.com/blog/instagram-api-deprecated-alternative-2026)
- [Instagram oEmbed Updates — Swipe Insight](https://web.swipeinsight.app/posts/oembed-updates-enhance-facebook-developer-experience-15949)
- [How to Embed Instagram Reels 2026 — EmbedSocial](https://embedsocial.com/blog/embed-instagram-reels/)
- [Instagram Graph API Changes 2025 — Elfsight](https://elfsight.com/blog/instagram-graph-api-changes/)
- [Pexels Free Image and Video API](https://www.pexels.com/api/)
- [Is the Pexels API Free to Use? — Pexels Help](https://help.pexels.com/hc/en-us/articles/47677890260761-Is-the-Pexels-API-free-to-use)
- [YouTube Data API Overview — Google Developers](https://developers.google.com/youtube/v3/getting-started)
- [YouTube API Quota 10,000 Units/Day Breakdown 2026 — ContentStats](https://www.contentstats.io/blog/youtube-api-quota-tracking)
- [Instagram Scraping Legal Guide 2025 — SociaVault](https://sociavault.com/blog/instagram-scraping-legal-2025)
- [The 2026 Guide to Web Scraping Legality — Apify](https://use-apify.com/blog/web-scraping-legal-guide)
- [Instagram Graph API vs Alternatives — Data365](https://data365.co/blog/instagram-graph-api)
