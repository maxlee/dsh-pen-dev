# 发布与收录：怎么让别人在插件市场里搜到 `dsh-pen-dev`

## 先说清楚现状

这个版本的 DeepSeek Harness **没有"提交到官方插件库"的入口**，也没有内置的官方索引：

- 插件市场 = 用户自己配置的索引源。`plugin-market` 的 `indexes` 默认是 `[]`，一份都不配时 Host 不发任何市场请求；「发现」页的示例 URL 是 `https://example.com/index.json`。
- "官方"插件走的是**构建期**白名单：`ON_DEMAND_BUNDLES`（本版本只有 `dsh-subagent-claude-code`、`dsh-subagent-codex` 两个 `@deepseek-ai/*` 包），配套的 `OFFICIAL_ON_DEMAND_CATALOG` 由 `pnpm gen-official-bundle-catalog` 生成，编译进应用。第三方包进不去，除非它成为 DSH 发布成员并重新发版。
- 因此"官方库搜得到"目前不是能力问题，是**没有这个库**。

好消息：让用户搜到并安装，不需要官方入口。

## 路线 A：npm 发布 + 自建索引（现在就能做）

1. **发布 npm**
   ```bash
   npm login
   npm publish        # 包名 dsh-pen-dev
   ```

2. **填写索引** [`market/index.json`](market/index.json)（已按 format 1 写好）：把 `author`、`homepage`、`repository` 换成真实地址；每发一个新版本，往 `versions` 里**追加**一条（旧版本保留），`version` 用精确 SemVer，`publishTimestamp` 用 Unix 秒。

3. **托管**：放到 GitHub Pages（`https://<user>.github.io/dsh-pen-dev/market/index.json`）或任意静态 HTTPS 地址。索引必须能被跨域直接 GET。

4. **用户侧**：插件 → **发现** → **添加索引源** → 粘贴 URL。之后搜索 `pen`、`canvas`、`设计` 都能命中，点安装即可（安装 spec 是精确版本 `dsh-pen-dev@0.1.0`）。

5. **自测**：格式规则由 `@deepseek-ai/dsh-plugin-market-index` 校验，可以本地跑：

   ```js
   import { parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index'
   parseMarketIndex(JSON.parse(readFileSync('market/index.json', 'utf8')), 'https://example.com/index.json')
   ```

### format 1 的关键约束

| 字段 | 规则 |
| --- | --- |
| `format` | 必须是 `1` |
| `title` | 必填；可以是字符串，或多语言对象且**必须含 `en`** |
| `plugins[].name` | 合法 npm 包名，索引内唯一 |
| `versions[]` | 非空；`version` 精确 SemVer；`publishTimestamp` 是 Unix 秒整数 |
| `source` | `{"type":"npm"}`（可带 `registry`）或 git（`url` + 40 位小写 commit，可带 `path`） |
| `icon` | https URL、`data:` base64（解码 ≤32 KiB），或相对索引 URL 且同源 |
| `metadata.category` / `labels` | 必须先在索引的 `metadata.categories` / `metadata.labels` 里声明 |

搜索命中 `name`、`author`、`keywords` 和所有语言的 `title` / `description` / 分类名 / 标签名；`name` 与 `title` 权重 3 倍、`keywords` 2 倍；中文按二元组切分。所以**中英双语标题 + 关键词**是能被搜到的关键。

## 路线 B：争取进官方随包目录（不由我们控制）

官方目录是发布产物，不是开放注册。现实做法：

1. 在 `github.com/deepseek-ai/deepseek-harness` 提 issue：请求把社区插件纳入官方可选目录，或请求官方开放一个公共市场索引 URL，并说明默认 `indexes: []` 对第三方发现不友好。
2. 附上：包名、`market/index.json` 条目、许可证（MIT）、维护承诺、支持的 DSH 版本。
3. 如果他们选择自己维护一份官方索引，你的条目进那个 JSON 即可，用户开箱就能搜到；如果要求以 `@deepseek-ai/*` 发布，那实质上等于把项目捐给官方，需要你决定。

## 路线 C：第三方社区市场

搜索结果里能看到一些声称接受插件提交的站点（如 `dshplugin.market`、`dshmarket.ai` 一类）。这些站点不是 DSH 官方产物，来源、安全性、是否会长期维护都无法保证；本机网络是代理环境，我无法验证它们的真伪。要用之前请人工核对：域名归属、是否只是 SEO 农场、索引是否 HTTPS、会不会要求把包的所有权交给对方。

## 发布前检查清单

- [ ] `npm login` 成功，包名未被占用
- [ ] `market/index.json` 用官方校验器跑通，0 校验错误
- [ ] 新版本已追加进 `versions`，`publishTimestamp` 是发布后的时间
- [ ] README 里的版本号、安装命令与实际发布一致
- [ ] 卸载与回滚步骤写在 README 里

## 索引不被收录时的兜底

市场只影响"发现"。即使不上任何索引，用户仍然可以在插件页 **添加插件 → 安装第三方插件** 里直接输入 `dsh-pen-dev`、Git 地址或本地路径安装。
