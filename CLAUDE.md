# To-Do List App — Project Context

## 概述
一个移动端优先的协作待办清单 PWA，支持微信分享邀请好友。无需微信开发者账号。
适合小团体（微信群）共享任务、个人管理、每日正能量语录、留言板。

## 技术栈
- **前端**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **后端/数据库**: Supabase (Postgres + Auth + Realtime + Storage)
- **托管**: Vercel (Hobby free tier)
- **语录 API**: Hitokoto (一言) — https://v1.hitokoto.cn/ (分类: d=文学, k=哲学, i=诗词, max_length=60)

## 四大板块
1. **共享List** (`/app/shared`) — Realtime 多人协作清单，所有成员可添加/勾选
2. **个人List** (`/app/personal`) — 个人私有，RLS 严格隔离
3. **每日寄语** (`/app/inspiration`) — Hitokoto 每日自动获取，Vercel Cron 16:00 UTC (00:00 北京时间) 触发
4. **留言板** (`/app/board`) — 自定义气泡色的留言板，Realtime 实时更新

## 用户身份模型
- Supabase 匿名登录（首次访问自动创建，无需注册）
- profiles 表存储昵称 + 头像URL + 气泡色
- 邀请制加入共享清单（UUID token，7天有效期）
- 无微信 API 集成（用户自行设置身份信息）

## 邀请系统
- POST `/api/invite/create` → 生成 UUID token，存入 invite_tokens 表
- 分享链接: `https://[domain]/invite/[token]`
- 接收方访问 → 匿名登录 → onboarding → 验证 token → 加入 list_members → 跳转共享清单

## 数据库表
profiles, shared_lists, list_members, shared_list_items,
personal_list_items, daily_quotes, board_messages, invite_tokens

## RLS 规则摘要
- personal_list_items: 仅本人 (owner only)
- shared_list_items: 清单成员可读写 (通过 list_members 关联)
- board_messages: 清单成员可读写
- daily_quotes: 公开读取
- profiles: 已认证可读，本人可写

## 设计规范
- 配色: 白色/米色背景 (background: #FAF8F5)
- 强调色: mint #A8D8EA, peach #FFB7B2, lavender #C3B1E1, sage #B5EAD7
- 辅色: sky #E2F0CB, coral #FFDAC1, lilac #E0BBE4, cream #FDFD96
- 字体: system-ui (iOS: PingFang SC, Android: Noto Sans SC)
- 布局: 固定底部导航栏，safe-area-inset-bottom 适配 iPhone 刘海

## 环境变量
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, 不可暴露给客户端
CRON_SECRET=                    # 保护 /api/quote/fetch cron 端点
```

## 文件结构
```
src/
├── app/
│   ├── layout.tsx              # 根布局 (PWA meta, OG tags)
│   ├── page.tsx                # 入口 (匿名登录 + 路由)
│   ├── globals.css             # 全局样式
│   ├── onboarding/page.tsx     # 首次设置昵称/头像/颜色
│   ├── app/
│   │   ├── layout.tsx          # 底部导航栏外壳
│   │   └── shared|personal|inspiration|board/page.tsx
│   ├── invite/[token]/page.tsx # 邀请链接落地页
│   └── api/
│       ├── quote/today/route.ts
│       ├── quote/fetch/route.ts
│       ├── invite/create/route.ts
│       └── invite/validate/route.ts
├── components/
│   ├── layout/BottomNav.tsx
│   ├── shared-list/SharedList.tsx (Realtime)
│   ├── personal-list/PersonalList.tsx
│   ├── inspiration/DailyQuoteCard.tsx
│   └── board/MessageBoard.tsx + MessageBubble.tsx
├── lib/
│   ├── supabase/client.ts      # 浏览器端 Supabase 客户端
│   ├── supabase/server.ts      # 服务端 Supabase 客户端 (SSR cookies)
│   ├── supabase/admin.ts       # 管理员客户端 (service role)
│   └── hitokoto.ts             # Hitokoto API 封装
├── hooks/
│   ├── useSharedList.ts
│   ├── usePersonalList.ts
│   └── useMessageBoard.ts
├── types/database.types.ts
└── middleware.ts                # 路由保护 + 匿名登录引导
```

## 常用命令
- `npm run dev` → 本地开发 (localhost:3000)
- `npm run build` → 生产构建
- `npx supabase gen types typescript --project-id [id] > src/types/database.types.ts`

## 部署
- Vercel: 连接 GitHub 仓库自动部署
- Supabase: 在 dashboard 中运行 SQL migration
- Cron: vercel.json 已配置每日 01:00 UTC 触发 /api/quote/fetch
