# dsh-pen-dev

**非官方**的 [pen.dev](https://pen.dev) 接入插件，用于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)。

它把 pen.dev 桌面版自带的 MCP server 接到 DSH 会话里，让模型能在真实的 pen.dev 画布上设计、
读取 frame 与组件、把网页复刻成可编辑图层、调用 pen.dev 的风格原型；同时附带一个 `pen-dev`
技能，告诉模型画布工作流，并引导它去读 pen.dev 自己的 `read_skill` 文档。

本项目与 pen.dev 官方无关，也未获其背书。`pen.dev` 及其桌面应用归其作者所有；本包**不分发**
任何 pen.dev 二进制，只是在已安装的应用里定位 MCP server。

## 装好之后你会得到

| 工具 | 用途 |
| --- | --- |
| `mcp__pen__get_app_state` | 当前文档、选区、顶层 frame、组件、浏览器状态 |
| `mcp__pen__read_skill` | pen.dev 官方的画布 API 文档（`execute`、schema、各类指南） |
| `mcp__pen__execute` | 对当前打开的 `.pen` 执行画布操作 |
| `mcp__pen__get_style` | 载入视觉风格原型（字体、配色、图像方向） |
| `mcp__pen__browser` | 在应用内置浏览器打开真实网址，把页面复刻成可编辑图层 |

另外附带 `pen-dev` 技能。

## 前置条件

- **DeepSeek Harness**，且具备 `@deepseek-ai/dsh-mcp-client` 插件。开发与验证基于 DSH `0.2.1-rc.2`。
- **pen.dev 桌面应用**已安装。开发与验证基于 macOS（arm64）上的 Pen 1.2.19。
  应用内的 MCP server 位于
  `Pen.app/Contents/Resources/app.asar.unpacked/out/mcp-server-<platform>-<arch>`。

## 安装

### 在 DSH 应用里装（推荐）

侧栏 **插件 → 添加插件 → 安装第三方插件**，输入包名：

```
dsh-pen-dev
```

该对话框也接受本地路径或 Git 地址。

### 命令行安装

```bash
dsh plugin --profile <profile> add dsh-pen-dev
```

安装后会默认启用该组合包。开启 HMR 时无需重启即可看到工具；否则重启应用。

### 从插件市场安装

如果某个市场索引收录了本插件：插件 → **发现** → **添加索引源**，粘贴索引 URL 后即可在结果里安装。
[`market/index.json`](market/index.json) 是现成的 format-1 条目；
[`PUBLISHING.zh.md`](PUBLISHING.zh.md) 说明了怎么托管索引，以及这个 DSH 版本为什么还没有官方提交入口。

### 手动等价写法

如果你想直接看 YAML（例如包还没发布到 npm、用本地路径安装时），把它装进 profile 后，组合包
patch 会插入下面两行：

```yaml
- insert:
    - id: pen-dev
      name: dsh-pen-dev
    - id: pen-dev-skill
      name: dsh-pen-dev/skill
```

**如果你之前手写过 pen.dev 配置**，请先删掉那条手写的 `mcp-client` 行。两个 mcp-client 实例
不能共用同一个 `serverName`，后加载的那个会报 `serverName "pen" is already in use`。

## 与官方 MCP 配置的关系

pen.dev 官方的桌面接入配置是：

```json
{"name":"pencil","transport":"stdio","command":"…/mcp-server-<platform>-<arch>","args":["--app","desktop"],"env":{}}
```

本插件挂载的就是这个 server：同一个二进制、同样的 `--app desktop`、同样 5 个工具
（`browser`、`execute`、`get_app_state`、`get_style`、`read_skill`）。相比最小配置，它额外做了：

- 用 `node:fs` 在 `/Applications`、`~/Applications`、`/opt` 和 Windows 的 `%LOCALAPPDATA%\Programs`
  里探测二进制，非标准安装位置不用改配置
- 传 `--agent deepseekHarness`，让 pen.dev 区分这是 DSH 的连接（`PEN_MCP_AGENT` 可覆盖）
- 支持 `PEN_MCP_CONVERSATION_ID`，映射为 `--conversation_id`
- 把单次调用超时提到 120s，`execute` 和 `browser` 的较大操作常常超过默认 60s

**不**默认传 `--enable_spawn_agents`：那会让 pen.dev 在 DSH 之外再拉起它自己的 agent。确实需要时
设 `PEN_MCP_ENABLE_SPAWN_AGENTS=1`。

另外，`@pencil.dev/cli` npm 包里带的是**另一套** MCP server（9 个以 `filePath` 为参数的工具，
服务于它的无头 `.pen` 编辑器）。它不能替代本插件：连到桌面 app 时它调的 IPC 方法并不存在
（实测报 `No handler found for method 'get-editor-state'`）。

## 配置

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `PEN_MCP_BIN` | — | pen.dev MCP server 二进制的绝对路径，用于非标准安装位置或其他平台。 |
| `PEN_APP_PATH` | 自动探测 | pen.dev 应用目录的绝对路径，自动探测不到时用。 |
| `PEN_MCP_AGENT` | `deepseekHarness` | 传给 `--agent` 的值，pen.dev 用它区分连接来源。 |
| `PEN_MCP_CONVERSATION_ID` | — | 映射为 `--conversation_id`。 |
| `PEN_MCP_ENABLE_SPAWN_AGENTS` | 关 | 设为 `1` 或 `true` 时传 `--enable_spawn_agents`（多出 `spawn_agents` 工具）。 |
| `PEN_MCP_SERVER_NAME` | `pen` | MCP 命名空间，即 `mcp__<name>__*` 前缀。 |

二进制路径在 profile 激活时计算：patch 用 `node:fs` 探测常见安装根目录，只有装在非常规位置才需要
`PEN_APP_PATH`。全部找不到时，mcp-client 会报 spawn 失败、不挂任何工具，harness 其余部分照常运行。

## 注意事项

- `.pen` 文件是加密的。只有 MCP 工具能读写它，**不要**用文件系统工具去打开。
- 工具改的是用户正在看的文档。`execute` 要当作可见的、有破坏性的操作来处理。
- 一张画布同一时间只让一个 agent 写：如果 Claude Code 也连着 Pen，不要让两边同时改。
- `PEN_MCP_BIN` 需要由启动应用的外层把变量传进去。macOS 的 GUI 应用不继承 shell 环境，
  `PEN_APP_PATH` 主要服务于会传环境的启动器。
- Windows / Linux：路径探测按常见 Electron 布局写了，但只在 macOS 上验证过；`PEN_MCP_BIN` 始终优先。

## 卸载

把该组合包从 profile 移除（插件面板，或 `dsh plugin --profile <profile> remove dsh-pen-dev`）。
如果之前有手写的 `mcp-pen` 行，把它恢复回去。

## 许可

MIT。非官方社区包，见上文声明。
