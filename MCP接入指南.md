# 我的视觉库 · 本地 MCP 接入指南

本项目内置了零外部依赖的标准 **stdio MCP Server**（`server/mcp-server.js`），直接联通本机 SQLite 数据库、全部 **1,216+ 视觉卡片**、**85 份完整 `DESIGN.md` 设计系统**（含本站蒸馏的「苹果暖瓷手账风」）与 **2 套可复用 Skill**。

接入后，你可以直接对任意 AI 编程工具说：
- 「帮我从我的视觉库里查一下 Raycast 或苹果暖瓷手账风的完整 DESIGN.md，按这套风格帮我做一个新网站」
- 「从我的视觉库里抽一组网页 UI 灵感盲盒，主题是 AI 播客工作台」
- 「把我现在这个网站的设计风格蒸馏成 DESIGN.md，并调用 visual-library MCP 存进我的视觉库」

---

## 暴露的 MCP 工具与资源

| 工具名 | 作用 |
| --- | --- |
| `search_visual_library` | 按中英文关键词、分类（参考/动效/风格）、赛道、来源检索全库（含你在网页端新建的卡片） |
| `get_card_detail` | 获取单卡完整 Prompt、配方、笔记，以及**完整原版 `DESIGN.md` 全文** |
| `list_design_systems` | 列出全部 85+ 套本地 `DESIGN.md` 设计系统（含本站蒸馏风） |
| `draw_inspiration_brief` | 按 `ui / graphic / cinema / ai-art` 场景生成 3 卡融合创作指令 |
| `get_skill_bundle` | 一键拉取 95%+ 还原度的完整风格包（`SKILL.md` + 完整 `DESIGN.md` + 可直接复用的 `tokens.css` + `motion-primitives.jsx` + 3D 贴纸生图配方） |
| `save_visual_card` | 直接向本地 SQLite 写入/更新卡片，并支持同步落地新的 `DESIGN.md` 文件 |
| `delete_visual_card` | 删除用户自建卡片或撤销内置卡片修改 |

**MCP Resources**：
- `visual-library://skill/porcelain-sticker-studio`（本站蒸馏风格 Skill）
- `visual-library://skill/visual-library-distill`（通用网站风格蒸馏工作流 Skill）
- `visual-library://design-md/<slug>`（全部 85+ 份完整 `DESIGN.md` 规范）

---

## 两种连接方式（优先推荐「界面授权 HTTP 模式」）

点击「我的视觉库」页面右上角的 **「MCP 接入」** 按钮，即可打开 **MCP 连接与授权中心**：
- 随时 **开启 / 暂停** 本地 HTTP 授权服务（`http://127.0.0.1:48138/mcp`）
- 自由切换 **只读模式** / **允许 AI 写入新卡片**
- 一键查看、复制或 **重置 Bearer Token**（重置后旧客户端立即失效）
- 实时查看外部 AI 的调用次数与最近一次使用的工具
- 按客户端（Antigravity / Cursor / Codex / Claude Code / WorkBuddy / DeepSeek）一键复制带真实密钥的配置文件

### 方式一：Streamable HTTP 授权连接（推荐）
将 `<你的 Bearer 密钥>` 替换为界面「MCP 接入」弹窗里复制的真实 `vl_mcp_...` 密钥：

- **Antigravity**（`~/.gemini/config/mcp_config.json`）：`url: "http://127.0.0.1:48138/mcp"` + `headers: { "Authorization": "Bearer <token>" }`
- **Cursor / WorkBuddy / DeepSeek**：`url: "http://127.0.0.1:48138/mcp"` + `headers: { "Authorization": "Bearer <token>" }`
- **Codex**：`url = "http://127.0.0.1:48138/mcp"` + `http_headers = { Authorization = "Bearer <token>" }`
- **Claude Code**：`claude mcp add --transport http visual-library "http://127.0.0.1:48138/mcp" --header "Authorization: Bearer <token>"`

---

## 方式二：本地 Stdio 离线配置（不开网页也能用）

> 注意：请将下方示例中的 `/path/to/my-visual-library/server/mcp-server.js` 替换为你本机克隆后的绝对路径（也可直接从网页右上角「MCP 接入」弹窗一键复制本机真实路径）；需使用支持内置 `node:sqlite` 的 Node.js 22.13 或更新版本。

### 1. Antigravity（`~/.gemini/config/mcp_config.json`）

```json
{
  "mcpServers": {
    "visual-library": {
      "command": "node",
      "args": ["/path/to/my-visual-library/server/mcp-server.js"]
    }
  }
}
```

### 2. Cursor（项目 `.cursor/mcp.json` 或全局 `~/.cursor/mcp.json`）

```json
{
  "mcpServers": {
    "visual-library": {
      "command": "node",
      "args": ["/path/to/my-visual-library/server/mcp-server.js"]
    }
  }
}
```

### 3. Codex CLI / Desktop（`~/.codex/config.toml`）

```toml
[mcp_servers.visual-library]
command = "node"
args = ["/path/to/my-visual-library/server/mcp-server.js"]
```

### 4. Claude Code（命令行一键添加）

```bash
claude mcp add visual-library -- node "/path/to/my-visual-library/server/mcp-server.js"
```

### 5. WorkBuddy / DeepSeek Harness / 其他标准 MCP 客户端

在客户端的 MCP 设置（`mcpServers` / Stdio Server）中填写：
- **Server Name**：`visual-library`
- **Transport**：`stdio`
- **Command**：`node`
- **Args**：`["/path/to/my-visual-library/server/mcp-server.js"]`

---

## 本地 Skill 复用路径

已从今天开发的网站蒸馏出两套标准 Agent Skill，可直接复制或软链到 Antigravity / Cursor / Codex / Claude Code 的 Skills 目录：
- 本站设计风格 Skill：`skills/porcelain-sticker-studio/SKILL.md`
- 通用网站蒸馏 Skill：`skills/visual-library-distill/SKILL.md`
- 本站完整规范文件：`图鉴素材/design-md/porcelain-sticker-studio.md`
