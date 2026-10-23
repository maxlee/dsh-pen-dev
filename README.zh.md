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

## 配置

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `PEN_MCP_BIN` | — | pen.dev MCP server 二进制的绝对路径，用于非标准安装位置或其他平台。 |
| `PEN_APP_PATH` | `/Applications/Pen.app` | pen.dev 应用目录的绝对路径。 |
| `PEN_MCP_SERVER_NAME` | `pen` | MCP 命名空间，即 `mcp__<name>__*` 前缀。 |

二进制路径在 profile 激活时计算（YAML 无法读取文件系统）：patch 由 `PEN_APP_PATH` 推出
`Contents/Resources/app.asar.unpacked/out/mcp-server-<platform>-<arch>`，所以非标准安装位置改
`PEN_APP_PATH` 即可。路径不存在时，mcp-client 会报 spawn 失败、不挂任何工具，harness 其余部分
照常运行。

## 注意事项

- `.pen` 文件是加密的。只有 MCP 工具能读写它，**不要**用文件系统工具去打开。
- 工具改的是用户正在看的文档。`execute` 要当作可见的、有破坏性的操作来处理。
- 一张画布同一时间只让一个 agent 写：如果 Claude Code 也连着 Pen，不要让两边同时改。
- `PEN_MCP_BIN` 需要由启动应用的外层把变量传进去。macOS 的 GUI 应用不继承 shell 环境，
  `PEN_APP_PATH` 主要服务于会传环境的启动器。
- Windows / Linux：目前只支持 `PEN_MCP_BIN`，平台路径未经验证。

## 卸载

把该组合包从 profile 移除（插件面板，或 `dsh plugin --profile <profile> remove dsh-pen-dev`）。
如果之前有手写的 `mcp-pen` 行，把它恢复回去。

## 许可

MIT。非官方社区包，见上文声明。
