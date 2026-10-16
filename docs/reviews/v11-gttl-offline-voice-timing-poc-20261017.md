# V11 × Google-TTS-Local 零付费音频计时 POC

验证模式：离线测试，未调用 Google API、未激活 Cloud Billing、未支付 HK$100。

- Google-TTS-Local 本地媒体回归：9/9 PASS。该项目仍为 MOCK_ONLY，真实 Google Cloud TTS 未启用。
- 使用 Windows SAPI Zira en-US 合成的 8 条英语测试 WAV；Google-TTS-Local 的 OfflineMediaStore 在隔离 SQLite/媒体目录导入，生成版本化音频和 manifest。8条音频总时长 51.215 秒，来源严格标为 LOCAL_USER_IMPORT，禁止冒称 Google 语音。
- 验证 8 个音频版本 ID、原始文本快照 SHA-256、文件 SHA-256、PCM WAV 时长，音频资产版本没有被覆盖；输入与导演修订文本不一致、音频哈希损坏、缺失版本/来源元数据全部阻断。
- V11 新增 `scripts/v11-voice-timing-local.mjs`，根据每句实际音频和同一段可并行动作取 max，再计入必须串行的动作与情绪反应，避免重复累计。TTS 实测代理重新计时结果 126.0s，原计划 113.9s；超出 120s，status=blocked_out_of_policy，production_gate=BLOCKED。
- 新增声画桥接测试 6/6 PASS，V11 定向回归总计 59/59 PASS。适用范围：校验本地导入、文本版本和声画调度算法，不代表 Google Cloud TTS 已成功调用、真人配音/成片/观众效果已验收。
- 原始 Google-TTS-Local 工作区、原 V11 主分支未更改；所有真实导入均写入 `%TEMP%\v11-gttl-audio-bridge-*` 隔离目录。下一步需要使用真实角色音色/演员自然英文时长重新测量，并让 AI 导演针对超时部分改编后复测。
