事件提醒 (Event Reminder) v5.4 - Cloudflare Workers 版
Language
Platform
License

这是一款功能强大且界面美观的事件提醒工具，完全部署在 Cloudflare Workers 上，实现了真正的 Serverless。它将前端 UI、后端 API 和定时任务逻辑整合在单个文件中，无需任何外部服务器或数据库，仅依赖 Cloudflare 生态系统。

你可以用它来追踪各种需要定期或一次性处理的事件，例如：

服务器、域名续费提醒
信用卡、账单还款日
Google Voice 等账号的保号任务
各种订阅服务的到期日
✨ 功能特性
无服务器架构: 无需购买 VPS，完全运行在 Cloudflare 的全球网络上，稳定、高效且免费额度充足。
一体化设计: 单个 JS 文件包含前端 UI、后端 API 和定时任务，部署极其简单。
数据持久化: 使用 Cloudflare KV 作为数据库，安全存储您的事件数据。
精美响应式 UI:
支持浅色/深色模式，并能根据系统设置自动切换。
采用卡片式布局，直观展示每个事件的剩余天数、状态和备注。
状态自动判断（良好、临近、紧急、逾期）并以不同颜色高亮。
移动端优先，在手机和桌面端均有优秀体验。
两种提醒模式:
循环重复: 适用于如“每3个月”或“每年”的周期性任务。完成任务后点击“刷新”即可重置计时器。
单次提醒: 适用于有明确截止日期的一次性事件。
多渠道通知:
Telegram Bot: 通过您自己的机器人即时发送提醒。
Email (Resend): 通过 Resend 服务发送格式精美的 HTML 邮件提醒。
可为每个事件独立开关不同的通知渠道。
高度自定义:
可自定义提醒规则，例如在到期前 30、15、7、3、1、0 天发送通知。
可自定义每日发送通知的具体时间（例如 10:00）。
周期模式支持“月”和“天”为单位的自定义周期。
安全与管理:
通过密码保护您的应用访问。
支持对事件进行“归档”和“激活”，方便管理已完成或暂不需要的事件。
提供“发送测试”功能，方便验证通知渠道是否配置正确。
🚀 部署指南
部署过程非常简单，主要分为配置和上传两个步骤。

1. 准备工作
一个 Cloudflare 账号。

在本地安装 Node.js 和 Wrangler CLI。

<BASH>
npm install -g wrangler
登录 Wrangler：

<BASH>
wrangler login
2. 获取代码
将本仓库的代码克隆或下载到本地。

3. 创建 KV 存储空间
我们需要一个 KV 命名空间来存储事件数据。执行以下命令创建，并记下返回的 id。

<BASH>
# 将 "KEEP_ALIVE_DB" 替换为你喜欢的名字
wrangler kv:namespace create "KEEP_ALIVE_DB"
执行后会返回类似下面的信息，复制 id 的值。

<TEXT>
✨ Successfully created namespace "KEEP_ALIVE_DB" with ID: 0e5c15689c2545d8b8a829107955b4a9
4. 配置 wrangler.toml
在项目根目录创建一个 wrangler.toml 文件，这是 Worker 的核心配置文件。将以下内容复制进去，并根据你的信息进行修改。

<TOML>
name = "event-reminder" # 你的 Worker 名字，会成为 URL 的一部分
main = "index.js"      # 入口文件，请将下载的代码命名为 index.js
compatibility_date = "2023-10-30"
# 绑定刚才创建的 KV
[[kv_namespaces]]
binding = "KEEP_ALIVE_DB"         # 这个名字必须和代码中的 env.KEEP_ALIVE_DB 保持一致
id = "0e5c15689c2545d8b8a829107955b4a9" # 粘贴你上一步获取的 ID
# 配置定时任务，每天执行一次
[triggers]
crons = ["0 2 * * *"] # UTC 时间，表示每天 02:00 执行。可自行修改为北京时间上午10点等。
# [vars]
# 这里可以放非敏感信息，但为了统一管理，我们推荐使用 secrets
注意: crons 使用 UTC 时间。"0 2 * * *" 对应世界标准时间凌晨2点，即北京时间上午10点。

5. 配置环境变量 (Secrets)
这是最关键的一步，你需要将所有敏感信息（如密码、API Key）通过 Wrangler 命令安全地配置。

必须配置的：

<BASH>
# 设置你的访问密码
wrangler secret put AUTH_PASSWORD
可选配置的（根据你的需要选择）：

Telegram Bot 配置 (如何创建机器人和获取信息?)

<BASH>
wrangler secret put TG_BOT_TOKEN
wrangler secret put TG_CHAT_ID
Resend 邮件配置 (登录 Resend 获取 API Key)

<BASH>
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_TO  # 接收邮件的邮箱，多个用逗号分隔
wrangler secret put RESEND_FROM # 发件人地址 (可选, 默认为 onboarding@resend.dev)
在执行每个 wrangler secret put 命令后，它会提示你输入相应的值。

6. 部署
完成以上所有配置后，执行一条命令即可部署！

<BASH>
wrangler deploy
部署成功后，Wrangler 会输出你的 Worker 访问地址 https://event-reminder.<YOUR_SUBDOMAIN>.workers.dev。现在你可以打开它开始使用了！

🛠️ 环境变量说明
变量名	是否必须	说明
AUTH_PASSWORD	是	访问此应用的密码。
KEEP_ALIVE_DB	是	KV 存储空间的绑定名称，在 wrangler.toml 中配置。
TG_BOT_TOKEN	否	Telegram Bot 的 Token，格式如 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11。
TG_CHAT_ID	否	接收通知的 Telegram 用户或频道的 Chat ID。
RESEND_API_KEY	否	Resend 服务的 API Key，格式如 re_12345678_AbcDEF1234。
RESEND_TO	否	接收提醒邮件的邮箱地址。如果需要发送给多个地址，用逗号 , 分隔。
RESEND_FROM	否	发送提醒邮件时显示的发件人地址。必须是你在 Resend 验证过的域名邮箱。如果留空，默认为 onboarding@resend.dev。
📝 使用方法
打开你的 Worker URL (例如: https://event-reminder.xxx.workers.dev)。
输入你在部署时设置的 AUTH_PASSWORD 密码，点击“进入”。
点击右下角的 + 按钮，开始创建你的第一个事件提醒。
根据表单提示填写信息，选择模式、周期、通知方式等。
保存后，你就可以在主界面看到卡片，并等待定时任务在指定时间为你发送通知。
📄 代码结构
整个应用被整合在一个 index.js 文件中，其主要逻辑分为三部分：

前端应用 (UI): HTML_CONTENT 常量包含了一个完整的 HTML 页面，内含 CSS 和 JavaScript 逻辑，负责页面的渲染和用户交互。
后端逻辑 (API): export default { fetch(...) } 部分处理所有网络请求。
/: 返回前端 UI 页面。
/api/*: 提供 RESTful API 接口（如列表、更新、删除），并进行密码验证。
/api/test-single: 提供单项测试功能。
核心通知逻辑: export default { scheduled(...) } 部分处理由 Cron 触发的定时任务，它会遍历所有事件，计算到期日，并决定是否发送通知。辅助函数 calculateDueDate, runSchedule, sendNotification 等实现了具体的通知逻辑。
📜 授权 (License)
本项目采用 MIT License 授权。