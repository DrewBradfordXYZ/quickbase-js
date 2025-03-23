# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.1.0-beta.12](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v0.1.0-beta.11...v0.1.0-beta.12) (2025-03-23)


### Features

* enable true concurrency with throttle bucket ([8dc4dee](https://github.com/DrewBradfordXYZ/quickbase-js/commit/8dc4deeaddb4365f4f64a8bd07390c7071f739f7))

## [0.1.0-beta.11](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v0.1.0-beta.10...v0.1.0-beta.11) (2025-03-23)


### Features

* only fetch auth dbid once for concurrent requests. temp tokens and SSO ([12f7f31](https://github.com/DrewBradfordXYZ/quickbase-js/commit/12f7f3117b2fd6e5db35d73e945dff0a79ef0481))
* SSO concurrency tests passes ([caf5fca](https://github.com/DrewBradfordXYZ/quickbase-js/commit/caf5fca4e86b0dda4a75c2856f9324634369f15a))
* temp token concurrency prevents redundant token fetches. getAppConcurrency.test.ts unit test passes ([2913e7b](https://github.com/DrewBradfordXYZ/quickbase-js/commit/2913e7b38d38ca0ceaa0af21b2e872f7bafb9d99))

## [0.1.0-beta.10](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v0.1.0-beta.9...v0.1.0-beta.10) (2025-03-22)


### Features

* add descriptions to post-processed openapi files ([a607817](https://github.com/DrewBradfordXYZ/quickbase-js/commit/a607817156fb265f5198fc3b21189e7205f08c54))
* Add VitePress docs build to docs-dist for GitHub Pages ([db84f94](https://github.com/DrewBradfordXYZ/quickbase-js/commit/db84f946affe2111de5d8bc339c17dd66db6dddb))
* Add VitePress site ([92b941c](https://github.com/DrewBradfordXYZ/quickbase-js/commit/92b941cfba75f482dc542c948d8a48ad6338ff8f))
* align jsDoc parsing with the richness of the vitepress's DocsJson ([1059bbb](https://github.com/DrewBradfordXYZ/quickbase-js/commit/1059bbb72274416a8825e663ee52abac5d17d585))
* Configure GitHub Action to deploy VitePress from docs/.vitepress/dist ([90c1507](https://github.com/DrewBradfordXYZ/quickbase-js/commit/90c1507cf1a5642ec6197fa36b5f498e67da543d))
* extractHttpMethod, a more targeted approach to getting the HTTP method ([d64bda3](https://github.com/DrewBradfordXYZ/quickbase-js/commit/d64bda3dbf511bf74522de4362e62281f375bd01))
* generate-unified-interface.ts and generateDocsJson.ts are functionally separated ([030c62d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/030c62dd73d489eca893e6fa745f6361bae77857))
* generate-unified-interface.ts and generateDocsJson.ts are separated and DRY using sharedUtils.ts ([6426fda](https://github.com/DrewBradfordXYZ/quickbase-js/commit/6426fda8c28fe3f4922a6341d6edf44330b82526))
* ItemsInner has basic properties ([24a5631](https://github.com/DrewBradfordXYZ/quickbase-js/commit/24a56315c1211aa07ae68e7a2760d49b1628669c))
* jsDoc and docsJson uses the new post-process structure ([f87572d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/f87572ddc25e31013abb50463b1362a881a759b3))
* jsdoc styling ([fd41d3d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/fd41d3de26b5f48c3926c7813eeeb564746be816))
* make open-api files more dry with common utils and tweak jsdoc removing repitive descriptions for nested properties ([ff98f84](https://github.com/DrewBradfordXYZ/quickbase-js/commit/ff98f845ddda44faa3a0bf6a0a68bff3d0d41188))
* refactor fetchTempToken into TempTokenStrategy ([8203833](https://github.com/DrewBradfordXYZ/quickbase-js/commit/8203833b0126e35d5a11596dbf5ce13c36db66f7))
* refactored out generateDocsJson.ts ([0973f0f](https://github.com/DrewBradfordXYZ/quickbase-js/commit/0973f0fa4d2d2547b47e11e06cda23b628bd52ec))
* wrapTopLevelArrays fixing empty some 200 return type files ([f26e047](https://github.com/DrewBradfordXYZ/quickbase-js/commit/f26e0470a46368ee0a24c5cf4c0c2045c1d20e77))


### Bug Fixes

* github code page deploy update ([9305c36](https://github.com/DrewBradfordXYZ/quickbase-js/commit/9305c36220cf016cc0cda32a66882c989c07f4fa))
* Update workflow to use JamesIves/github-pages-deploy-action ([5bd7342](https://github.com/DrewBradfordXYZ/quickbase-js/commit/5bd73421ea00080e5b67ecf5b64a639117fa542c))

## [0.1.0-beta.9](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v0.1.0-beta.8...v0.1.0-beta.9) (2025-03-20)


### Features

* 429 and throttlebucket tests pass ([5591e19](https://github.com/DrewBradfordXYZ/quickbase-js/commit/5591e19357c3c3232337ec4ede020530a635aa76))
* add baseUrl with a default ([5c5829f](https://github.com/DrewBradfordXYZ/quickbase-js/commit/5c5829fcbe32e780efebea903db11a505bb9166c))
* add SSO strategy ([501034d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/501034d363ffd7b4d5acdd9cf2932b5d97f249ee))
* all relationship tests are passing ([5cdd0e9](https://github.com/DrewBradfordXYZ/quickbase-js/commit/5cdd0e9aafe5d22e354f3915e45b3950eec98cdf))
* auth refactor, auth tests pass, other tests still have errors ([47f353f](https://github.com/DrewBradfordXYZ/quickbase-js/commit/47f353f0fdb38813b9c047ec06059c9ff6354225))
* createField unit test passes ([676b6ab](https://github.com/DrewBradfordXYZ/quickbase-js/commit/676b6ab98379300b2d16e01c58b180bf1277ed86))
* createRelationship unit and integration tests pass ([577e7bb](https://github.com/DrewBradfordXYZ/quickbase-js/commit/577e7bbce7f7fa3d6ffbe1f9f2b7cb00e1a5e486))
* inferHttpMethod test and updateRelationship test pass ([1c6b342](https://github.com/DrewBradfordXYZ/quickbase-js/commit/1c6b34203a2100f17e9f626f547d426252922c67))
* jsdoc documents type properties ([191d721](https://github.com/DrewBradfordXYZ/quickbase-js/commit/191d7211c5c1cecd55b2019237c132225cf2d461))
* retryTempTokenMaxRetires unit test pass and update copyApp unit test is now more self contained ([8f38b1b](https://github.com/DrewBradfordXYZ/quickbase-js/commit/8f38b1b81a525702c6a49db07c1ef5b70a686792))
* retryUserToken401 integration test passes ([d78b0c6](https://github.com/DrewBradfordXYZ/quickbase-js/commit/d78b0c62cea3c1a35b9beca3db30d9fa1596c4e7))
* runFormula integration test passes ([4e5927d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/4e5927d51d10d44534430c58321580bc363a9496))
* runFormula unit test passes ([871d6e9](https://github.com/DrewBradfordXYZ/quickbase-js/commit/871d6e97c4aa93bc8a206337f20b8ba325e16a64))
* runFormula.test.ts unit test pass ([8fe27d8](https://github.com/DrewBradfordXYZ/quickbase-js/commit/8fe27d8401ac53f4da8e7a52ea4c8645c5a46508))
* sso integration test passes ([c09a02c](https://github.com/DrewBradfordXYZ/quickbase-js/commit/c09a02cd379efd935dd0c256d8cf6fb4a7402a7e))
* sso unit test passes ([5e5baeb](https://github.com/DrewBradfordXYZ/quickbase-js/commit/5e5baeb3fb0a00e7301183346ef49b6aee483a6a))
* tokenLifespan unit test passes ([09a72a9](https://github.com/DrewBradfordXYZ/quickbase-js/commit/09a72a965a99bb6bd712cb705354c1904c72aebb))
* updateField unit test passes ([9a2aae1](https://github.com/DrewBradfordXYZ/quickbase-js/commit/9a2aae1338c53eb92a82a6bff212c275705d027e))


### Bug Fixes

* updateRelationship integration test cleanup ([d27c030](https://github.com/DrewBradfordXYZ/quickbase-js/commit/d27c0303ec55162bea8d479064c5a93584cdef37))

## [0.1.0-beta.8](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v0.1.0-beta.7...v0.1.0-beta.8) (2025-03-18)


### Features

* add updateField subfields that are not included in raw spec, test pass ([4481cff](https://github.com/DrewBradfordXYZ/quickbase-js/commit/4481cff81d4e6205a90537d49bb596214c0e45bd))
* build now works without error ([3f6ef2c](https://github.com/DrewBradfordXYZ/quickbase-js/commit/3f6ef2c1337f50b93bb937dd4de1d702c2eb984b))
* dev dependencies reinstall, pipeline runs again ([91a8216](https://github.com/DrewBradfordXYZ/quickbase-js/commit/91a8216064a48708fbf598e9d7be6084052cd439))
* generate-report for spec diff ([53ad6e7](https://github.com/DrewBradfordXYZ/quickbase-js/commit/53ad6e7d2f94683134dfa79e50022a8d2ab0b448))
* integration getApp and deleteFields pass ([ba07e9a](https://github.com/DrewBradfordXYZ/quickbase-js/commit/ba07e9a68d298ab6dbcf326c865261fcc46b51ba))
* integration tests pass for getAppEvents and updateApp ([58f4d20](https://github.com/DrewBradfordXYZ/quickbase-js/commit/58f4d20b5e9d539e91ac29662cae4d2a5bb4eed0))
* rename TokenBucket to ThrottleBucket ([3a3cdb4](https://github.com/DrewBradfordXYZ/quickbase-js/commit/3a3cdb4869856622e40ae3898f7fc66d50918b6c))
* throttle limits and 429 retry ([a7aec4a](https://github.com/DrewBradfordXYZ/quickbase-js/commit/a7aec4af37f0a74c0e42a938c97e6ce1df7c5250))
* tokenLifespan and separate invokeMethod.ts ([2336bce](https://github.com/DrewBradfordXYZ/quickbase-js/commit/2336bce25a9a22b6f14f2e3915e58849d5cb64f3))
* updateApp.test.ts unit test passes ([f2a3dcc](https://github.com/DrewBradfordXYZ/quickbase-js/commit/f2a3dcc904da07bbb1c363732df551da60430de1))
* updateField unit test pass ([c6ad2d5](https://github.com/DrewBradfordXYZ/quickbase-js/commit/c6ad2d53996bae3f7ed8a51a5795a6bfe0c293fd))
* updateRelationship integration test passes, creates and cleans summary and lookup fields ([cc6645f](https://github.com/DrewBradfordXYZ/quickbase-js/commit/cc6645f91be43b1e63dc8b3428a24af42b69ad1c))
* updateRelationship unit test passes ([155defc](https://github.com/DrewBradfordXYZ/quickbase-js/commit/155defcb1f3a746ac2bb135ec09db39b64dd58e2))
* user token 401 retry, all tests now passing ([a81a05d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/a81a05d873f95d23f5721337854e2794be80ac64))


### Bug Fixes

* 429 retry logic now has all tests passing ([a2da0ad](https://github.com/DrewBradfordXYZ/quickbase-js/commit/a2da0ad28c24c843d2bfd318f78827ba543e6833))
* build runs and all tests pass ([b1cbfaf](https://github.com/DrewBradfordXYZ/quickbase-js/commit/b1cbfafb879d1325e60024e837e8c5602e027e47))

## [0.1.0-beta.7](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.1.0-beta.6...v0.1.0-beta.7) (2025-03-16)


### Features

* added Record, hybrid semantic naming, fully typed QuickbaseClient with few response models left as type:any ([535a02e](https://github.com/DrewBradfordXYZ/quickbase-js/commit/535a02e10d5974d2a2deb6dc213286da94d68dea))
* all fields tests pass ([84c539f](https://github.com/DrewBradfordXYZ/quickbase-js/commit/84c539fce7ba9d57c997b831be404a1398a6ac25))
* all types, methods and files generated ([f25bea0](https://github.com/DrewBradfordXYZ/quickbase-js/commit/f25bea0e65a019d75b39a9caf85901d520bf1ac8))
* build files always produce production code ([2f78598](https://github.com/DrewBradfordXYZ/quickbase-js/commit/2f785984416c61e1b3deda2b801071cbb1303a74))
* copyApp unit test passes ([0e13f91](https://github.com/DrewBradfordXYZ/quickbase-js/commit/0e13f918c5daabbbd6e17c2424b3f18eca2eb3a4))
* FieldMap issue resolved ([b3b7b41](https://github.com/DrewBradfordXYZ/quickbase-js/commit/b3b7b415d6a0f7701851f32a5e0b1207a07ba481))
* getApp and deleteApp test passes ([f5225e0](https://github.com/DrewBradfordXYZ/quickbase-js/commit/f5225e06299de58f34d6a765e73268d9a54e807d))
* getAppEvents spec update ([1028255](https://github.com/DrewBradfordXYZ/quickbase-js/commit/10282559cd76d004899fa2ebcea6f5f435ffae2b))
* import and upsert success ([ea9d9ee](https://github.com/DrewBradfordXYZ/quickbase-js/commit/ea9d9eef8384ad73b8cffb8183fbc374ab9cc25b))
* log-gen yaml file gets created next to the build file ([cfe25af](https://github.com/DrewBradfordXYZ/quickbase-js/commit/cfe25afb60498909d2bac8ec963484e1c1b42d3f))
* logging for swagger2.0 ([819aa17](https://github.com/DrewBradfordXYZ/quickbase-js/commit/819aa170cfc02e4e5b223ac13834d50bce5dda93))
* missing-types-report updated to empty on success ([e35b28d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/e35b28d61563b21f7bad3e1c9c3751bfa254ab4a))
* QuickbaseClient is fully-typed from raw spec ([5c875c2](https://github.com/DrewBradfordXYZ/quickbase-js/commit/5c875c2ee07c38731c5609c384aaa8d3fbbdd64a))
* reorganize open-api folder ([a0fe5bd](https://github.com/DrewBradfordXYZ/quickbase-js/commit/a0fe5bda606c37e7636d36c7fc5e233d191ac249))
* simplifyName refactor again ([2a2952e](https://github.com/DrewBradfordXYZ/quickbase-js/commit/2a2952ea90fab818501d17908d6cd85a79c41adb))
* split up fix-spec- files ([85b6a3e](https://github.com/DrewBradfordXYZ/quickbase-js/commit/85b6a3efb92520a46aa619bdfc4bf70d06984b3f))
* unit auth tests pass ([494897f](https://github.com/DrewBradfordXYZ/quickbase-js/commit/494897f4551854096f89b1af43df4a455dfd9f4b))
* unit records tests pass ([8160b53](https://github.com/DrewBradfordXYZ/quickbase-js/commit/8160b53378447fcd8e37fac178e7d4693b502288))
* unit tables tests pass ([c4ec0ac](https://github.com/DrewBradfordXYZ/quickbase-js/commit/c4ec0ac378dd03e5d018b4ea83530e2c0fe905a2))
* unit tests for apps folder is passing ([72ae8e5](https://github.com/DrewBradfordXYZ/quickbase-js/commit/72ae8e529cddc66626617c6b1ff672f40763f7b7))
* update scripts to call integration tests, all tests pass ([08911f7](https://github.com/DrewBradfordXYZ/quickbase-js/commit/08911f76b214e6eb3ca8b4362c156d55383d7264))


### Bug Fixes

* added back CreateRelationshipRequest and UpdateRelationshipRequest ([0d932ee](https://github.com/DrewBradfordXYZ/quickbase-js/commit/0d932eed8b603c6b84e13b8834a89722b91fabf3))
* generate-unified-interface type fixes ([b8acd16](https://github.com/DrewBradfordXYZ/quickbase-js/commit/b8acd16805f456336d396856c6ff88a29aa02813))
* playwright cleanup and type fixes ([ff30a15](https://github.com/DrewBradfordXYZ/quickbase-js/commit/ff30a15c1a244c7eb1ad4f52941f60b775bb88d4))
* remove the old /paths /definitons completely in scripts ([48ee6a3](https://github.com/DrewBradfordXYZ/quickbase-js/commit/48ee6a3b15579ca9224b89acde73f492e0769cab))
* update tags/tables.ts to match raw schema ([c6ed554](https://github.com/DrewBradfordXYZ/quickbase-js/commit/c6ed554f0994187224219b454d1e8671307fc189))

## [1.1.0-beta.6](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.1.0-beta.5...v1.1.0-beta.6) (2025-03-13)


### Features

* omit credientials for all api calls that are not fetching a temp token ([b1b4aae](https://github.com/DrewBradfordXYZ/quickbase-js/commit/b1b4aae02aaa655e6eaab2fe0d532d526e6dc69f))

## [1.1.0-beta.5](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.1.0-beta.4...v1.1.0-beta.5) (2025-03-13)


### Features

* ESM and UMD build prod ([49513e9](https://github.com/DrewBradfordXYZ/quickbase-js/commit/49513e902e7bf4dd35da3c6508242e96507a91bd))
* ESM and UMD support and src folder reorganization ([dc0170b](https://github.com/DrewBradfordXYZ/quickbase-js/commit/dc0170b547e6e9e57a117fbcccfdbeb86e48a8c7))

## [1.1.0-beta.4](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.1.0-beta.3...v1.1.0-beta.4) (2025-03-12)


### Features

* createField and deleteFields tests are passing ([4b47c4d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/4b47c4deb9b3d731e6e7938c12fcebe97830568b))
* createField mock and integration tests pass ([b227c73](https://github.com/DrewBradfordXYZ/quickbase-js/commit/b227c73b08f7efa5ce5f3d0c2897f82c8976a009))
* deleteFields spec update ([1f8beca](https://github.com/DrewBradfordXYZ/quickbase-js/commit/1f8becaca0d6b7950648c1b9bc2b0215781fa829))
* getFeildsUsage.test.ts unit and integration tests pass ([82a4886](https://github.com/DrewBradfordXYZ/quickbase-js/commit/82a488622967ec24a8767cbb19c59ef4ce808749))
* getField.test.ts unit and integration tests pass ([3e50b70](https://github.com/DrewBradfordXYZ/quickbase-js/commit/3e50b704f0ebea47f2fee3d02d811ea1b43db6c4))
* getFieldsUsage fix spec ([031faaa](https://github.com/DrewBradfordXYZ/quickbase-js/commit/031faaaeab9597f35fdd1ddcf5157ce5d774390b))
* getFieldUsage spec and unit test pass ([ac2824b](https://github.com/DrewBradfordXYZ/quickbase-js/commit/ac2824b226140dde99e33cf594d57bd6ffd4dc39))
* getFieldUsage unit and integration tests pass ([e62b586](https://github.com/DrewBradfordXYZ/quickbase-js/commit/e62b586d534620479a25dda2796ba5dcb8043705))
* split up fix-spec-paths and fix-spec-definitions into many files ([20d3246](https://github.com/DrewBradfordXYZ/quickbase-js/commit/20d32464e6337028778845fa55fbb19c5543f7eb))


### Bug Fixes

* cleanup createField.test.ts logging ([7b1306b](https://github.com/DrewBradfordXYZ/quickbase-js/commit/7b1306bd8eb49e2c932ce267f33457e949e0f74b))
* createField test syntax update ([043f964](https://github.com/DrewBradfordXYZ/quickbase-js/commit/043f964a47346878440eb73cc10c110dab904ad7))
* getFieldsUsage type fix ([4c6f271](https://github.com/DrewBradfordXYZ/quickbase-js/commit/4c6f271d123131ae13a236664f28fbbdfde3d564))
* update deleteFields error type spec ([1788e1c](https://github.com/DrewBradfordXYZ/quickbase-js/commit/1788e1ce6d4d2c8df871ec8b112be908d706f884))

## [1.1.0-beta.3](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.1.0-beta.2...v1.1.0-beta.3) (2025-03-11)

### Features

- copyApp fix-spec updates ([4c10ab4](https://github.com/DrewBradfordXYZ/quickbase-js/commit/4c10ab41464df047402a207c7b9e81026a7b6202))
- copyApp unit test passes ([b121bf1](https://github.com/DrewBradfordXYZ/quickbase-js/commit/b121bf1d0130f338f131de5417896d798fe90db3))
- deleteApp fix spec added ([b27ce11](https://github.com/DrewBradfordXYZ/quickbase-js/commit/b27ce11e2b08bc631d7656dedec57f6f5e579450))
- fix-spec-\* for getRelationship interface ([aad9fbd](https://github.com/DrewBradfordXYZ/quickbase-js/commit/aad9fbd7fc92b8aaaef901174c81169543ae86d2))
- getRelationship unit and integration test pass ([a1269bb](https://github.com/DrewBradfordXYZ/quickbase-js/commit/a1269bb60523944bdf5030404539043c967f0b83))
- updated Upsert200Response and Upsert207Response, deleteRecords.test.ts integration type issues resolved ([d39dad5](https://github.com/DrewBradfordXYZ/quickbase-js/commit/d39dad55d783d280db9dbae2ca4c782df3a1f12e))
- usertokens 401s do not generate a token, createApp unit and integration tests, deleteApp integration tests pass ([e3a092d](https://github.com/DrewBradfordXYZ/quickbase-js/commit/e3a092d76f283d5c5200ddbb5afd32782fc15379))

## [1.1.0-beta.2](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.1.0-beta.1...v1.1.0-beta.2) (2025-03-11)

## [1.1.0-beta.1](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.1.0-beta.0...v1.1.0-beta.1) (2025-03-11)

### Features

- runQuery.test.ts integration test pass ([180b17f](https://github.com/DrewBradfordXYZ/quickbase-js/commit/180b17f265c26a0d23bde3ca6993bad1ba4f65ee))
- runQuery.test.ts unit test pass ([84e2fc4](https://github.com/DrewBradfordXYZ/quickbase-js/commit/84e2fc4f237d5f558fcd20d7b6b8eb83f685d7ac))

### Bug Fixes

- added stub variables to unit tests ([d84b534](https://github.com/DrewBradfordXYZ/quickbase-js/commit/d84b5344201300d8d59e622b025d96ad9813d4eb))
- create env stubs for mock tests and update getTables.test.ts ([3d31c9e](https://github.com/DrewBradfordXYZ/quickbase-js/commit/3d31c9ebc9f852b99d1a807759490055d75c6396))

## [1.1.0-beta.0](https://github.com/DrewBradfordXYZ/quickbase-js/compare/v1.0.1-beta.0...v1.1.0-beta.0) (2025-03-11)

### Features

- add deleteTable integration test with 404 verification ([277aec6](https://github.com/DrewBradfordXYZ/quickbase-js/commit/277aec66a3047fab687ce81ad42b9371e8c2bf56))
- deleteRecords integration and unit tests ([d3beba1](https://github.com/DrewBradfordXYZ/quickbase-js/commit/d3beba1a362b13166b38f59eeea83c289ddaf999))
- integration tests for deleteRecords and upsert pass ([759978b](https://github.com/DrewBradfordXYZ/quickbase-js/commit/759978bc13cb1c50c03770232eb02a1c3c08428d))
- mock deleteRecords passes ([a167028](https://github.com/DrewBradfordXYZ/quickbase-js/commit/a1670286def030950c568e92ca99ea12e20d5b62))
- upsert mock test passes ([dde6d07](https://github.com/DrewBradfordXYZ/quickbase-js/commit/dde6d07d4c4c73bd14189f87fdc6347744004e4e))

### Bug Fixes

- all vitests are passing again ([7206ba3](https://github.com/DrewBradfordXYZ/quickbase-js/commit/7206ba3f28bd7a3c7f5d699988e9a9a1f0053f42))
- fix-spec and test updates for createTable ([9c0cdd3](https://github.com/DrewBradfordXYZ/quickbase-js/commit/9c0cdd3b707971e6fb8f3e73598e3a600ff2b33d))
- fix-spec for upsertRecords and createApp ([d12de40](https://github.com/DrewBradfordXYZ/quickbase-js/commit/d12de40feac35e5d86a0b7d5019d8058cdfcffd9))
- fix-spec getTable ([1eb936c](https://github.com/DrewBradfordXYZ/quickbase-js/commit/1eb936c360ce5df4818b8d5ef7ccf4dc6b769af0))
- fix-spec getTable deleteTable ([236349a](https://github.com/DrewBradfordXYZ/quickbase-js/commit/236349af9e30776e00754232d83d76e065aab00b))
- fix-spec updates for createApp ([3614958](https://github.com/DrewBradfordXYZ/quickbase-js/commit/36149589ff2544ec50a82d9dc9b183f15d07778d))
- fix-spec updateTable ([26e278c](https://github.com/DrewBradfordXYZ/quickbase-js/commit/26e278cdbbe96d33e51f14e90ebb2c8b47d70f07))
- getTables test pass, change order for extractDbid to assign temp token dbid ([37b7685](https://github.com/DrewBradfordXYZ/quickbase-js/commit/37b7685d55a0f64e62cb91ad23df28d4916d5a50))
- upsert unit test type fixes ([8460cc8](https://github.com/DrewBradfordXYZ/quickbase-js/commit/8460cc8e63564bc8602dc12a9b6415094cc215f0))

### 1.0.1-beta.0 (2025-03-10)

Testing done in a consuming library for getApp() and getFields()
