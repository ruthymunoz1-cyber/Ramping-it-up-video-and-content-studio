# Unity Keepsakes: Project Handoff

_Last updated: 2026-11-08. Written for the next Claude Code session (or any helper) picking this project up._

---

## 1. Who and what

- **Owner:** founder of **RAMP Linguistic Society**, a language-education company (flagship product: **MEMOIVA**; also runs YouTube channels). Based in **Florida, USA**.
- **New business:** **Unity Keepsakes**, a print-on-demand store selling **language-inspired and bilingual keepsakes**.
  - Shopify store: **Unity Keepsakes**, domain **unitykeepsakes.com**, Shopify **Basic** plan, USD, EST timezone.
  - Fulfillment: **Printful** (prints and ships every order).
- **Owner's goal:** be as hands-off as possible, using agents for store operations, product research and design.
  - **Agreed in the conversation:** fully hands-off isn't realistic or safe. The target is **80–90% automated**, with the owner spending about **15–30 minutes a week** on approvals (new designs, payouts, flagged orders).
- **Hard constraint from the owner:** **nothing may put the language company (RAMP) at risk.** Keep Unity Keepsakes legally and reputationally separate.

---

## 2. Decisions made

| Topic | Decision | Notes |
|---|---|---|
| Legal structure | **Separate Florida LLC for Unity Keepsakes** (recommended; owner was leaning that way) | A DBA under RAMP doesn't separate liability, and the owner wants RAMP protected. If the LLC is formed, no DBA is needed. |
| LLC timing | **File now with today's date** (recommended) | Florida allows a Jan 1 effective date for LLCs formed Oct–Dec to skip the first annual report ($138.75), but then the LLC wouldn't exist during the holiday season. |
| Product scope v1 | **Simplified launch**: Spanish/English bilingual + fixed-language designs + **name personalization in Latin script only** | The "customer types anything in any language" idea is **on hold**: no proven demand, extra risk (fonts, right-to-left text, content moderation). Revisit in 2027 with data. |
| Languages with fixed text | Spanish, French, Portuguese, Italian, Chinese (Simplified), Chinese (Traditional) | All designed. Chinese uses Noto Serif SC/TC. |
| Native-speaker review | Required for any text **RAMP/Unity writes** (designs, photos, descriptions). **Not** required for what customers type. | Customer text is printed as typed; protect with preview + checkbox + policy. |
| Bible-verse products | **Only KJV (English) + Reina-Valera 1909 (Spanish)**, both public domain | **Do NOT use RVR1960, NIV, ESV or NLT**; they are copyrighted and need a license. |
| Trademarks | No licensed characters or phrases (Grinch, Elf, sports teams, song lyrics, etc.) | Especially on ugly sweaters. |
| Personalization app (when needed) | **Customily** preferred over Teeinblue | Customily has a documented Printful + Shopify setup, unlimited font uploads and Arabic preview tools. Both need the Printful API key. **Note:** Printful's own built-in personalization works only with **Etsy**, not Shopify. |

---

## 3. Current status

### Done
- [x] Shopify store **Unity Keepsakes** exists and was reachable through the Shopify connector (store info confirmed).
- [x] **16 fixed-language ornament designs** made (3000×3000 px, 300 DPI). Preview: `previews/fixed-language-ornaments.jpg`
  - "First Christmas" (navy & gold): Spanish, French, Portuguese, Italian, Chinese Simplified, Chinese Traditional
  - "Family / Merry Christmas" (cream, red & green): same 6 languages
  - Personalized Spanish versions: SAMPLE (with "Ana & Luis" / "Familia García") + BLANK-BASE (empty name area) for both designs
- [x] **12-colorway universal personalized template** (print bases + sample product photos). Preview: `previews/universal-colorways.jpg`
  - Christmas: navy-gold, cranberry-gold, evergreen-gold, snow-silver, cream-classic
  - Modern: blush-rosegold
  - Rainbow & fun: pastel-iridescent, bold-rainbow, frosted-ice, midnight-holo
  - Clear acrylic (transparent PNG, frosted window behind text): CLEAR-ACRYLIC-gold, CLEAR-ACRYLIC-rainbow
  - **On hold for v1**; samples show 12 scripts and were only machine-checked.
- [x] All design source code saved in `design-scripts/`. **Rebuild everything with:**
  ```bash
  bash docs/unity-keepsakes/design-scripts/build.sh /path/to/output
  ```
  Needs python3 + Pillow, node + Playwright/Chromium and access to fonts.googleapis.com. Produces 40 PNGs (verified).
- [x] Research done on: demand, competitors, Printful products/shipping, personalization apps, Florida LLC costs, Bible copyrights (see section 7).

### Blocked / waiting on the owner
- [ ] **Printful API key.** The owner will check at developers.printful.com → Tokens → "Add new token" (store-level token for Unity Keepsakes; access to products, files and orders; copy it immediately; note the expiry date, since tokens can't be renewed).
  - **Never ask for the key in chat.** Use the secure credential form (`request_credential`, host `api.printful.com`).
  - In the previous cloud session, `api.printful.com` was **blocked by the network proxy**; saving the credential should also allow the host.
- [ ] **Florida LLC filing** (owner must do it personally).
- [ ] Owner's choice of which products to launch first (recommended below).

---

## 4. Next tasks (priority order)

**Season timing:** it's November 2026. Ornament/Christmas selling window is about 5 weeks. Set the US holiday order cutoff around mid-December and the international cutoff around Dec 1–5. Check Printful's published holiday deadlines.

1. **Write store policies** (paste into Shopify → Settings → Policies):
   - Refund policy: personalized items printed exactly as typed, no returns for customer spelling errors; Printful-caused defects replaced.
   - Shipping policy: worldwide via Printful; international buyers may owe import duties/VAT; holiday cutoff dates.
   - Personalization checkbox text: _"I confirm my text is spelled correctly. Personalized items are printed exactly as typed and can't be returned for spelling errors."_
   - Terms line: store may cancel/refund orders containing offensive or infringing text.
2. **Upload v1 ornaments to Printful → Shopify:** one product per design, **languages as variants** ("Language: Spanish / French / Portuguese / Italian / Chinese (Simplified) / Chinese (Traditional)"). Ceramic ornament first (round; also heart/star/snowflake).
3. **Write Shopify listings** (titles, descriptions, tags, SEO, collections): bilingual angle, "gift for abuela / bilingual family / first Christmas." Ceramic ornament cost is roughly $6–14 at Printful; suggested retail **$22–26** (confirm the actual cost in Printful).
4. **Design more products for this season:**
   - **Bilingual ugly Christmas sweaters**: Printful knit sweaters (up to 4 yarn colors from 36) or all-over-print sweatshirts. Pun ideas: "Feliz Navi-DAD", "Ho Ho Hola". No trademarks.
   - **Personalized blanket**: Printful Sublimated Sherpa (about $30 cost; better reviews than the thin $25 throw, 50×60″) with a family name + bilingual saying.
5. **Name personalization (Latin script only).** Install Customily (needs the Printful key) and use the SAMPLE/BLANK-BASE Spanish files. Text field: Great Vibes font, gold (#e8c77d) on navy or red (#8c1d2b) on cream. Character limit about 20.
6. **January 2027:** faith line (KJV + RVR1909 bilingual verses), company/team sweaters and tees (B2B, bulk), more languages based on sales data.
7. **Automation ("agents"):** set up as scheduled tasks once listings exist:
   - **Researcher** (weekly): trends, competitor ads, shortlist of ideas.
   - **Designer/Lister** (weekly): makes designs and drafts listings; **the owner approves before publishing**.
   - **Store Manager** (weekly report): sales, best/worst sellers, what to drop or push. Later: screen personalized order text and hold anything questionable for the owner.
8. **Shopify Markets** for local currencies. **Shopify Tax** on for Florida sales tax.

---

## 5. Florida LLC checklist (for the owner)

| Item | Cost | Notes |
|---|---|---|
| Articles of Organization at **sunbiz.org** | **$125** ($100 filing + $25 registered agent) | Check the name "Unity Keepsakes LLC" in the Sunbiz search first |
| Annual report | **$138.75 per year**, due **Jan 1 – May 1** | **Late = +$400.** If still unfiled by September, the LLC can be dissolved. **Set a reminder.** |
| EIN | Free at irs.gov | Avoid paid lookalike sites |
| Florida sales tax registration (Dept. of Revenue) | Free | Then turn on Shopify Tax |
| Registered agent | Self (address is public) or a service | Bizee includes year 1 free, then about $100–150/yr |

Steps after filing: business bank account → connect to Shopify Payments → give **Printful the Florida resale certificate** (otherwise Printful charges sales tax on its invoices) → update Shopify store legal name and address.

Formation-service options: Bizee or ZenBusiness ($0 + state fee); Northwest ($39 + state fee, includes domain and website, which isn't needed because unitykeepsakes.com is already owned). Filing directly on Sunbiz is cheapest.

---

## 6. Design specs

**Shared:** 3000×3000 px, 300 DPI, text kept inside the center ~63% (safe for round ornaments). Fonts are all free for commercial use (SIL Open Font License, Google Fonts): Playfair Display, Great Vibes, Montserrat, Noto Serif SC/TC/JP/KR, Noto Naskh Arabic, Noto Serif Devanagari.

**Fixed-language ornaments**

| Language | First Christmas | Family |
|---|---|---|
| Spanish | Nuestra Primera Navidad | Feliz Navidad · La Familia · 2026 |
| French | Notre Premier Noël | Joyeux Noël · La Famille · 2026 |
| Portuguese | Nosso Primeiro Natal | Feliz Natal · A Família · 2026 |
| Italian | Il Nostro Primo Natale | Buon Natale · La Famiglia · 2026 |
| Chinese (Simplified) | 我们的 第一个 圣诞节 | 圣诞快乐 · 阖家欢乐 · 2026 |
| Chinese (Traditional) | 我們的 第一個 聖誕節 | 聖誕快樂 · 闔家歡樂 · 2026 |

Each design also carries the English line ("Our First Christmas" / "Merry Christmas"). **A native speaker should check all of these before launch** (they're RAMP/Unity-authored text).

Palettes: First Christmas = navy gradient #16405a→#0b2233, gold #d9b56b / #e8c77d, cream text #f3e6c4. Family = cream #f7f1e5, red #8c1d2b, green #2f5d3a.

**Universal templates:** the text color for each colorway is in `design-scripts/universal-personalized/gen.py` (dict `C`). Clear-acrylic files are transparent PNGs for **Printful's clear acrylic ornament only**. **Order one test print first** to check the frosted window and thin ring. On ceramic (white sublimation), "translucent/iridescent" looks are printed effects only.

**Printful products confirmed:** ceramic ornament (circle, heart, star, snowflake), acrylic, metal and wood ornaments; Throw Blanket 50×60″; Sublimated Sherpa Blanket; Embroidered Premium Sherpa; knit ugly sweaters; all-over-print sweatshirts; embroidered and printed apparel.

---

## 7. Research findings (summary)

- **Personalized ornaments overall: large demand.** Top stores (estimates from the Winning Hunter research tool): Wander Prints $10–18M/mo (~2,800 Facebook ads), Macorner $6–9.5M/mo, Jesuspirit/Joymade $3–6M/mo, Artveraprint $3–5M/mo (bestseller: personalized initial ornament at $11.99). These are high-volume US/Vietnam print-on-demand operations. **Don't compete on volume; compete on the language/culture niche.**
- **Spanish personalized ornaments: proven.** ParaTigift (Spain) runs about 90–126 Spanish-language ads for name/photo Christmas ornaments. Zazzle has Spanish personalized-ornament collections.
- **Bilingual gift stores: small but real.** Feppy (bilingual Spanish learning box) about $18–30K/mo; Duck Duck Books (bilingual Chinese books) about $14–24K/mo.
- **"Any language" personalized ornaments: no seller found.** Unproven demand. The closest proof is Arabic/Chinese **name jewelry** (Theo Grace, Onecklace).
- **Printful worldwide:** in-house centers in the US (NC, TX), Mexico (Tijuana), Canada (Toronto), UK (Birmingham), Latvia (Riga); partners in Japan, Australia and Brazil. No shipping to sanctioned countries (e.g., Russia, Belarus, Cuba, Iran, Syria, North Korea).
- **Personalization apps:** Customily (free plan/trial, Printful+Shopify integration doc, unlimited fonts, Arabic tools); Teeinblue (about $19/mo Starter, $59/mo Growth, 14-day trial; supports Printful).

---

## 8. Guardrails for whoever continues

- Don't publish new designs or listings without the **owner's approval** (trademark/copyright risk; print-on-demand takedowns can ban the account).
- Never request secrets in chat; use the secure credential form.
- No ad spend without explicit owner approval and a set budget.
- Keep anything that could reflect on RAMP accurate: native-speaker check on any non-English text the store writes; when one isn't possible, use English-only or name-only samples.
- Bible text: KJV and RVR1909 only.
- Owner preference: keep things **simple**. They pushed back when the plan got complicated. Prioritize what earns money this season.

---

## 9. Sources

- Printful: [personalization (Etsy only)](https://support.printful.com/hc/en-us/articles/41396545783697-How-does-Printful-s-personalization-feature-work) · [text designs / non-Latin](https://support.printful.com/hc/en-us/articles/41396548277777) · [custom fonts](https://support.printful.com/hc/en-us/articles/41396550561553) · [where products are printed](https://support.printful.com/hc/en-us/articles/41396775395729-Where-are-Printful-products-printed) · [fulfillment locations](https://www.printful.com/how-printful-works/warehousing-fulfillment) · [ornaments](https://www.printful.com/custom-christmas-ornaments) · [ceramic ornament](https://www.printful.com/custom/decor/personalized/ceramic-ornament) · [ugly sweaters](https://www.printful.com/make-your-own-ugly-christmas-sweater) · [throw blanket](https://www.printful.com/custom/blankets/personalized/throw) · [sherpa blanket](https://www.printful.com/custom/blankets/personalized/sublimated-sherpa-blanket) · [developer portal / EDM docs](https://developers.printful.com/docs/edm/)
- Apps: [Customily–Printful for Shopify](https://help.customily.com/articles/5348959213-integrating-printful-for-shopify) · [Customily pricing](https://www.customily.com/pricing-product) · [Teeinblue pricing](https://teeinblue.com/pricing) · [Teeinblue ornaments](https://teeinblue.com/blogs/en/shopify-app-to-create-customized-ornaments) · [Customily ornament comparison](https://www.customily.com/post/the-great-christmas-ornament-showdown-best-pod-ornaments-reviewed)
- Florida LLC: [StateBusinessCompliance annual report](https://www.statebusinesscompliance.com/blog/florida-llc-annual-report-2026-138-75-due-may-1-400-late-fee-kicks-in-after-september-1) · [LLC Starters Florida](https://llcstarters.com/how-to-start-an-llc/florida/) · [LLC University annual report / Jan 1 effective date](https://www.llcuniversity.com/florida-llc/annual-report/) · [Rho: cheapest LLC formation](https://www.rho.co/blog/cheapest-way-to-form-an-llc)
- DBA: [Zenind](https://www.zenind.com/help/post/can-your-e-commerce-store-have-a-different-name-than-your-llc-) · [LLC University](https://www.llcuniversity.com/?p=12994)
- Bible copyright: [Bible Gateway RVR1960](https://www.biblegateway.com/versions/Reina-Valera-1960-RVR1960-Biblia/) · [Logos RVR licensing note](https://www.logos.com/product/1868/reina-valera-revisada) · [SwordSearcher: RV1909 public domain](https://forums.swordsearcher.com/threads/spanish-bible.3160/latest)
- Market: [Zazzle Spanish name ornaments](https://www.zazzle.es/colecciones/spanish_christmas_name_ornaments_collection-119430166477571722) · [Theo Grace Arabic names](https://www.theograce.com/products/custom-arabic-name-necklace-in-silver) · [Onecklace Chinese names](https://www.onecklace.com/chinese-name-necklace) · [Etsyhunt Christmas ornaments](https://etsyhunt.com/best-etsy-christmas-ornaments)
