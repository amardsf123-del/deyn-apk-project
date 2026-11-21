# DEYN Cloud Sync — Cloudflare Workers + SQLite Durable Objects

خادم مزامنة سحابية آمن ومعزول لتطبيق **DEYN** يعتمد على **Cloudflare Workers** مع **SQLite-backed Durable Objects** (كائن معزول بقاعدة SQLite خاصة لكل تاجر).

## لماذا هذه البنية؟
- **عزل تام لكل تاجر (Tenant Isolation):** كل `merchantId` يُوجَّه إلى Durable Object مستقل تمامًا بقاعدة SQLite منفصلة؛ لا توجد جداول مشتركة بين التجار.
- **تشفير من طرف إلى طرف (E2E):** تُشفَّر دفعات الأحداث داخل التطبيق (`AES-256-GCM`) قبل رفعها؛ خادم Cloudflare لا يرى أسماء الزبائن ولا أرقام الهواتف ولا مبالغ الديون.
- **عدم وجود أسرار Cloudflare داخل التطبيق:** لا يحتوي ملف APK على أي API Token أو مفتاح خاص لـ Cloudflare؛ التحقق يتم بتوقيع `Ed25519` الخاص بكل جهاز مسجّل.
- **توافق كامل مع التكلفة المنخفضة:** يعمل على خطة **Workers Free ($0/شهر)** في البداية، ويتوسع بسلاسة على خطة **Workers Paid ($5/شهر)**.

## خطوات النشر الخارجي (من جهازك)
1. أنشئ حسابًا على [Cloudflare](https://dash.cloudflare.com/).
2. ثبّت أداة Wrangler:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. من داخل مجلد `cloudflare-sync/`:
   ```bash
   wrangler deploy
   ```
4. انسخ رابط الـ Worker الناتج (مثل `https://deyn-cloud-sync.<your-subdomain>.workers.dev`) وضعه في إعدادات «المزامنة السحابية» داخل تطبيق DEYN، ثم فعّل زر **المزامنة السحابية**.
