# 1.0.0 (2026-04-29)


### Bug Fixes

* address code review findings ([a5d68b1](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a5d68b105efa30355b8aef51560d523a9a42d53f))
* address code review findings from phase 0+1 ([3dd31ef](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/3dd31ef8fe641cf2cb663523c8c414233a50428a))
* address code review round 3 findings ([14f96ac](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/14f96ac851ac23305c776a0c78df76b8448b1166))
* address review round 2 findings ([a70be25](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a70be252b83695f05abadf137f1f15a06ce6573a))
* address review round 2 suggestions ([b774a68](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/b774a68f481f4313905eb82f669574fa7c842bbf))
* **client:** allowlist hosts for authenticated media downloads ([1530dc9](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/1530dc920073590d9f3db23f9b3d8ddf7d0d6541))
* **client:** detach external abort listener when request settles ([a4a2934](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a4a293460f6ea2a1475a76108a14010958b4edc3))
* **client:** enforce HTTPS when allowlisting media hosts ([1638b44](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/1638b44d68cbd82ebdeb0fb72a8fdf8f3d9f7508))
* **client:** preserve subpath segments in custom baseUrl ([58c2275](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/58c2275fb79ac52543a211b3d2aad75d0172819d))
* **client:** prevent caller headers from shadowing Authorization ([9479675](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/94796753c05a35200096f1a3b17c625838158d7e))
* **client:** strip leading slash in buildUrl path ([40bb35d](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/40bb35d93a771491709cb7afe2ab07a20878a248))
* **docs:** align code samples with actual API types ([03e6d62](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/03e6d62f643127dd85a7d9e41bcb3e80346069f1))
* **docs:** align remaining stale snippets with API types ([d8ffe78](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/d8ffe78bb5388d5a2767b313e10b1ae7b9f018a2))
* **docs:** align TSDoc examples with actual API types ([d322fe3](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/d322fe37ea100edd5a11f650eff73d92b7ffcb52))
* **docs:** correct API signatures in README and multi-account example ([5675d13](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/5675d134c16f62c38d2249cc4b2337a68275c127))
* **docs:** remove non-null assertions from examples ([90926ae](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/90926ae2ba7562fc6c59608d4980ee361851bd96))
* **examples:** correct multi-account API usage in flows example ([51456ab](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/51456ab0f719eca91a33cda321c2bc403d55f04a))
* export MessageType from barrel files ([38847a2](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/38847a2fb7b39d23dc6205cfbf014a51ef816ea9))
* **flows:** fix test lint and type errors ([c4cf80c](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/c4cf80c806277f354a03eff60823d78071c21780))
* **flows:** honor caller-supplied fields in getPreview ([650cb58](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/650cb58dcd1910324992d812e1f1817b1d6f7e64))
* **flows:** merge caller params instead of shadowing them ([2ce7339](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/2ce73399dd06b0323f2638725d9117e766c34f9e))
* harden webhooks and tighten internal types ([3da171e](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/3da171e72a459c677c28c29a355929cc9a9d1859))
* **media:** address code review findings ([5a313c1](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/5a313c114480c06b01be385ef56dd445d639505a))
* **media:** drop guessed mediaType on HTTPS-check download error ([321f04b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/321f04beaf226f44c609c691ca7b2308f8a54941))
* **messages:** omit flow_action and mode defaults to match Meta's contract ([fad3dfe](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/fad3dfece1b61367b9b918ad3daa2e0872db5125))
* **messages:** replace indexed loop with for-of to avoid non-null assertion ([045d443](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/045d4438a852c4d47ec9762f63fe881be93f02b5))
* **multi-account:** address code review findings ([4ea66e3](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/4ea66e38236e76a6a35584c9880a7e1429b71826))
* **multi-account:** address pragmatic review findings ([619466b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/619466b81d660b0e3f7b6e87188c3a7a5f2f8ef7))
* **multi-account:** drop unused async in broadcast flows factory ([ddb68d1](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/ddb68d1f687f5e8236b7bf747f5e46f21c4b9e8f))
* **multi-account:** enforce strict concurrency cap in broadcast ([33d4587](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/33d4587fd362ecdf09a274f3467351c0f194c940))
* **multi-account:** remove forbidden non-null assertion in removeAccount ([f8d1e1d](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/f8d1e1df4040717dc7973951680e8944d5b8b7cf))
* **multi-account:** snapshot accounts in getAccounts ([658c39e](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/658c39e352f8fd032b17f0c2104e837884871945))
* **phone-numbers:** normalize response types to snake_case ([4c47539](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/4c47539b7a6a35316c0058361bac15ea9389b71a))
* **templates:** deep-clone examples and freeze built request ([28b09b3](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/28b09b396f28b97366f3e402099d5313ca7f2d9f))
* **templates:** seal TemplateBuilder and detach components on build ([31cf22a](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/31cf22a1f0405d5bd1c37b6b10d861daaf078979))
* **utils:** enforce FIFO in rate limiter against queue starvation ([a0260cf](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a0260cf2fe1c4dd315ed97af16589bb03ea031e8))
* **utils:** narrow phone-number strip set to explicit separators ([293aebb](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/293aebbe03a35e528d0a71b0a8005d43de223b53))
* **utils:** reject leading-zero numbers in E.164 validator ([768c19c](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/768c19c57783e89c36aa8effb9715c69c71318ca))
* **utils:** spread retry jitter symmetrically around delay ([141e167](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/141e167b2add68ac00ad4bb464e403b10fb0289b))
* **utils:** use monotonic clock in rate limiter ([2724ff3](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/2724ff3205f1b9d9d76cddee9e46dd0afed5fe9c))
* **webhooks:** coerce nfm_reply response_json defensively ([3fd81e0](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/3fd81e09f1fd961c2ebe57e759633faee6d3d67f))
* **webhooks:** constant-time verify-token compare via HMAC digests ([e1352a2](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/e1352a2e4fcc7a8a170e23e80b98873133f7f7ca))
* **webhooks:** fix order item parser loop logic ([cddfab7](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/cddfab7a01e57e043bbac10eee85233ac177fc56))
* **webhooks:** forward NextRouteHandlerOptions through Webhooks wrapper ([4cfc3bb](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/4cfc3bb9e9e81e81f4feec0070cac8d14ea9712f))
* **webhooks:** guard Next.js GET handler and surface errors to onInternalError ([e69c33d](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/e69c33d40dfdd036d58980ed8d4e3e9fd11084c0))
* **webhooks:** guard otherInfo against null in template status parser ([75497d1](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/75497d1caca1cb1a9ff31f30ad47c7024d20c1d6))
* **webhooks:** log signed-but-unparseable webhook bodies ([7ecf4db](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/7ecf4db027654a8de17c346e567fcfb7752d520f))
* **webhooks:** normalize OrderEvent metadata and contact ([e8fc9b1](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/e8fc9b1d35b5c37fc766b35db4958c1eb3ed152c))
* **webhooks:** reject signed bodies that are not valid UTF-8 ([f5e3619](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/f5e36197d966dc09803bee6a7b74bd0217780e53))
* **webhooks:** resolve circular imports and validation gaps ([9fd70d8](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/9fd70d858c1cf4f544aa9e04ff0281759abc546c))
* **webhooks:** route Next.js POST bytes through fatal-UTF-8 decode path ([a946a41](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a946a41e619e98dcd58e23044151ad6dc9deaf22))
* **webhooks:** sanitize unknown payload.object before logging ([1343ee0](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/1343ee08538528b2a5a5b117aff1bf43c359a8f3))
* **webhooks:** surface missing rawBody as 400 plus warn ([2d889f2](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/2d889f220d881ecbed412a570be7e52b06f0c820))
* **webhooks:** warn once per Express middleware factory on missing rawBody ([32a5921](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/32a592195b6f549dd279070750a2bf48e9ffa11e))


### Features

* add unified WhatsApp client class ([4d15966](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/4d15966145b44fbebc010d8bf173b8765edf4d27))
* **catalog:** add ./catalog subpath export to package.json ([3848dd2](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/3848dd2e6beaa86e17b6c988a64fb9429273319c))
* **catalog:** add Catalog class with product CRUD ([6e2ce8c](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/6e2ce8c8664fac643243a4f30b9eba08df17e399))
* **catalog:** add catalog module barrel export ([51d9aac](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/51d9aacb2a3a8d22ae727dd53ad0efc9f8bee5ee))
* **catalog:** add catalog module types ([43adebc](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/43adebcb6f970ee0b10b4accf687d786dfc1a32b))
* **catalog:** add lazy catalog getter to WhatsApp client ([d8d818b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/d8d818ba46c8b629f264ce6b87827beb8f0b0fb2))
* **catalog:** re-export catalog types from main barrel ([655955b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/655955b873b7bd7adfcf2717f31c61e72719d499))
* **client:** add HttpClient with auth, rate limiting, and retry ([ce30ec5](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/ce30ec5b7bc87252cd01f3f455f9b9dc7407b3cb))
* **errors:** add ConflictError for strict-create failures ([fc60bbb](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/fc60bbb1da964d55f4aff3417a4688bdfbdbf76b))
* **errors:** add NotFoundError and use it for empty profile response ([d034c41](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/d034c41053eea0053df0d98e81b32fd018a1ae9b))
* **errors:** add typed error class hierarchy ([779e44b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/779e44b348e5548ebdfb1bb1bd0354f1d08504c4))
* **examples:** add template-webhooks runnable example ([d93b3eb](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/d93b3eb42cf3767d0125cc9e38039bafb4909149))
* export phone numbers and multi-account modules ([fea4c42](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/fea4c4226d60ee1f3f9d3ec3404b26cad5bbb8b9))
* export WhatsApp and Webhooks from main barrel ([0c54467](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/0c54467a982e6ab74b986d75f3b7644b61f3fc98))
* **flows:** add barrel export for flows module ([1b4b38d](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/1b4b38d2d77cf3ba89c5e6a1fddbbc99843df45e))
* **flows:** add flow types and validation constants ([f9c8893](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/f9c8893f58c75ce14682ab6859315aa0dcf178d3))
* **flows:** add Flows class with create and publish ([417c99a](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/417c99a8095d67b13df0a64496cbddb7071ada34))
* **flows:** add list, get, updateMetadata, updateAssets, deprecate, delete, getPreview ([751c270](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/751c270990a3860512c0905f999083d0d2757b43))
* **flows:** export all Phase 6 types from barrel ([f538cb0](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/f538cb04de1538eb548f2394b8e80710e0214dce))
* **index:** export Flows class and all flow types from main barrel ([239b1fc](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/239b1fca327e4660472d22c1348d70a7bf2e96b2))
* **media:** implement upload, download, and management ([e8e90b8](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/e8e90b87a4fcf75742ed31022aefb21e5118948e))
* **messages:** add CatalogMessageOptions type ([6501ca5](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/6501ca552c73baf200b26b4e952114111f04c776))
* **messages:** add FlowMessageOptions interface ([edb25d0](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/edb25d071e432eb355de180844adfd5099658f2a))
* **messages:** add message type definitions ([83794f7](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/83794f7a6334660d2d5c27733e24c728e57f7e7f))
* **messages:** add multi-product message types and limits ([78d261f](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/78d261fa56d0cd0d63f28aa40a02723e6772b01c))
* **messages:** add ProductMessageOptions type ([fa89f22](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/fa89f22a9caf6acd7a5d338269c7f2cc1ff97338))
* **messages:** add reply-to, CTA URL, location request, typing indicators ([cbbeba0](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/cbbeba0861c62abef5c6a9d512d4f2a5e9fe8af3))
* **messages:** add sendCatalogMessage method ([f6f7545](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/f6f7545607ca4284e5151a0cf84fea1b71c04d90))
* **messages:** add sendFlow method for interactive flow messages ([3ecca89](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/3ecca89767522cd78b85b20a56938f65e103689e))
* **messages:** add sendProduct method ([df7cbd8](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/df7cbd8ca0b50b9a57caec27cd3393e67b9d0c87))
* **messages:** add sendProductList method with client-side validation ([7a3aeba](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/7a3aebae15017745b2049230dec98416e2e95405))
* **messages:** export FlowMessageOptions from barrel ([760403c](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/760403c387af1748b0b1f0fb999a865a27bb87cb))
* **messages:** implement Messages class ([04b603d](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/04b603dc8b3c072b47b50f93409b81ca20a89472))
* **messages:** name FlowActionPayload and narrow flowMessageVersion type ([61dc922](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/61dc92258487d2f992f8474c484af899872353e4))
* **messages:** re-export CatalogMessageOptions ([a3fff4a](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a3fff4aa141f6e71e0a48f8feea4cd1b9e05cf08))
* **messages:** re-export multi-product types and limits ([6c923eb](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/6c923eb32119fe1745964b0cf57a2a1f31b18eac))
* **multi-account:** add distribution strategy types ([33f64eb](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/33f64eb15e6ac06c5527115a0a45a6f3e6d1984f))
* **multi-account:** add getNext() and broadcast() methods ([222f183](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/222f183b280e43ecdfacd7aba2cb0e8fd964685d))
* **multi-account:** add types for multi-account management ([3795bb1](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/3795bb1274fdc3e65bf612e66302e48e0f3f2e18))
* **multi-account:** discriminate broadcast failures by kind ([9dddc63](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/9dddc636d96db12284b0e6dcc654ac7d46f4a286))
* **multi-account:** export distribution strategies and broadcast types ([42c540a](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/42c540a1e0a469ffcba0d04c9bcaef6f7c918692))
* **multi-account:** implement distribution strategies ([7e871b8](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/7e871b8237866ecef4a509dc74afd23c2c29a73e))
* **multi-account:** implement WhatsAppMultiAccount manager ([bc17404](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/bc17404ffc04b3e8bd1ed2c61217afd75e65b9ee))
* **multi-account:** inject RNG into WeightedStrategy ([0709f9d](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/0709f9dfd4bd38dafe33e365b2fe6e9675efc68c))
* **phone-numbers:** add types and interfaces ([c25868b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/c25868b0386eb8e75dea975eb44e490400e8e134))
* **phone-numbers:** implement PhoneNumbers class ([adf720b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/adf720b51002127c6a379c009664df749abf5fea))
* **templates:** add template management module ([c7c6bd3](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/c7c6bd383b94f99b121b94031fb239d1d1ee3a49))
* **utils:** add E.164 phone number validation ([ac34caa](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/ac34caa62789a2dec8b17b85d2815cb86668a514))
* **utils:** add exponential backoff retry utility ([0873dff](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/0873dff8804436397b67f67c0d43b0c506a58795))
* **utils:** add token bucket rate limiter ([2b8d08f](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/2b8d08f0adb141a3f3b450b72a3fb4919d0dadb1))
* **webhooks:** add field-based dispatch and template extractors ([796b64b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/796b64bbf3291e142639f97ec1716929bed204dd))
* **webhooks:** add flow completion event types ([cb777b0](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/cb777b07615cba01acf516f49256da75d8f7080d))
* **webhooks:** add onFlowCompletion pre-registration method ([9deaa46](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/9deaa461ba564309f24b9fa2c655f01b0f4a55f6))
* **webhooks:** add onOrder registration method to Webhooks class ([984c071](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/984c071668ac89b5278c7ada04e72ce38002317f))
* **webhooks:** add onTemplateStatus and onTemplateQuality to Webhooks class ([2883b37](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/2883b370b0ea941754426257dda45be6f853ba00))
* **webhooks:** add OrderItem, OrderEvent types and onOrder callback ([735afa7](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/735afa7067c234316839091c218b62fa99603e5f))
* **webhooks:** add template-event types and wire shapes ([b603f0b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/b603f0b586d813557f0d7a936dd1d43c3598bc52))
* **webhooks:** add webhook type definitions ([ab16d59](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/ab16d5952123af846369c4438d82bf686616940d))
* **webhooks:** add wrapper class with pre-bound config ([bf843c9](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/bf843c9a10af5dcfd8650ae544149f057d35848d))
* **webhooks:** dispatch flow_completion to onFlowCompletion ([fa8b49e](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/fa8b49e6fa3fc91421c9ace920523ccbebdc4ae0))
* **webhooks:** dispatch order events to onOrder callback ([e3b9d76](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/e3b9d767b2cb1915ee186d42f6eeff45d1d99a36))
* **webhooks:** dispatch template_status and template_quality events ([1c81ea4](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/1c81ea4f955953f198efd2b1cb824ac5375edcd2))
* **webhooks:** divert nfm_reply to FlowCompletionEvent ([70af6e7](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/70af6e7cc85759efe77bfc9bf158165d1f2457a6))
* **webhooks:** export FlowCompletionEvent and WebhookNfmReply ([5418e67](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/5418e677dc6538ab80d977e73f3eb0b824c2f43d))
* **webhooks:** expose onInternalError on next middleware ([bd5d64a](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/bd5d64a7cc818e0ae84f3eb730a6a74ff7fb8ed3))
* **webhooks:** implement handler and middleware ([f9c0054](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/f9c0054f604dbe79718a2b2b4a58916f84f933a0))
* **webhooks:** implement parser and verification ([a591c1d](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a591c1d61e7dc7afd0449ed220a28399ef040582))
* **webhooks:** log unknown payload.object at debug level ([b1341f6](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/b1341f63d63312edd5a80dce13aec4e4b281c50c))
* **webhooks:** parse order events from webhook payload ([02681bd](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/02681bd7e50b21706508ad54c01cfb52f489509b))
* **webhooks:** re-export OrderItem and OrderEvent types ([fedb5a9](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/fedb5a9614397137b9ebc65500280d264793d56a))
* **webhooks:** re-export template-event types from barrels ([0a4bdad](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/0a4bdad9cb231d864113c8dc99775b5f099d45c7))
* **whatsapp:** add lazy flows getter to unified client ([587b27b](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/587b27b0b170a3e7461ece49d89f27733a12f57e))
* **whatsapp:** add phoneNumbers lazy accessor ([a90cc78](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/a90cc78b3f8055839eeff7965b0a104115c0d6b0))


### Performance Improvements

* **multi-account:** drop broadcast results[] to bound memory by concurrency ([8ce5c2f](https://github.com/abdelrahmannasr/wa-cloud-sdk/commit/8ce5c2fec0d7cc38c420070ac5ea60a211fc3c8f))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING: npm package renamed** from `@abdelrahmannasr/wa-cloud-api` to the unscoped `wa-cloud-sdk`. Install with `npm i wa-cloud-sdk` and update all imports (`import { WhatsApp } from 'wa-cloud-sdk'`, subpaths such as `wa-cloud-sdk/webhooks`). The npm package name now matches the GitHub repository name. The previously published scoped package is no longer the canonical distribution.

### Added

- **Messages** — Send text, image, video, audio, document, sticker, location, contacts, reactions, interactive buttons/lists, template messages, product messages, product list messages, and catalog messages
- **Media** — Upload, download, retrieve URLs, and delete media assets with client-side MIME type and file size validation
- **Templates** — List, get, create, update, and delete message templates with a fluent `TemplateBuilder` API and client-side validation
- **Webhooks** — Parse incoming events into typed objects, verify signatures (HMAC SHA-256), handle template status/quality events, order events, and flow completion events; integrate with Express or Next.js App Router via middleware factories; `Webhooks` wrapper class with pre-bound config
- **Phone numbers** — List, get details, manage business profiles, request verification codes, verify, register, and deregister phone numbers
- **Multi-account** — Manage multiple WABAs with lazy client instantiation, dynamic account add/remove, dual lookup (by name or phone number ID), distribution strategies (round-robin, weighted, sticky), and broadcast messaging with pool-based concurrency control
- **Catalog** — List catalogs, get catalog details, list products, get product, create product (strict, raises `ConflictError` on duplicate), upsert product, update product, delete product; with client-side validation
- **Flows** — List, get, create, update metadata, update assets, publish, deprecate, delete, and get preview link for WhatsApp Flows
- **Unified client** — Single `WhatsApp` entry point that wires all modules with a shared `HttpClient`; lazy module initialization
- **Core HTTP client** — Authentication, token bucket rate limiting, and exponential backoff retry with jitter
- **Typed error hierarchy** — `WhatsAppError`, `ApiError`, `RateLimitError`, `AuthenticationError`, `ValidationError`, `WebhookVerificationError`, `MediaError`, `ConflictError`
- **Zero runtime dependencies** — Uses only Node.js built-in APIs (`fetch`, `crypto`, `Buffer`, `URL`)
- **Dual module output** — ESM and CJS via tsup with subpath exports for `./errors`, `./messages`, `./webhooks`, `./media`, `./templates`, `./flows`, `./phone-numbers`, `./multi-account`, `./catalog`
- **TypeScript strict mode** — Full type safety with no `any` usage
