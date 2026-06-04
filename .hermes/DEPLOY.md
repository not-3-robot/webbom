# WebBOM 部署文件

最後更新：2026-06-04

---

## 正式網址

```
https://not-3-robot.github.io/webbom
```

## 部署平台

**GitHub Pages**（`not-3-robot/webbom` 倉庫，main 分支，root 目錄）

## 頁面路徑

| 頁面 | URL |
|------|-----|
| 產品列表 | `/` |
| 爆炸圖查看器 | `/viewer.html?product=p-type` |
| 管理儀表板 | `/admin.html`（密碼: `webom2024`） |

## 更新流程

```bash
cd /Users/zone/claudecode/WebBOM
git add -A
git commit -m "描述修改內容"
git push
```

GitHub Pages 會在 push 後自動重新部署，約 30 秒生效。

## 曾嘗試但未採用的方案

| 方案 | 結果 | 原因 |
|------|------|------|
| Vercel | `webbom.vercel.app` 曾部署成功 | 中國手機 4G 無法存取（CDN 全在美國） |
| Netlify | 未完成部署 | `netlify.app` 域名在中國被牆 |
| Gitee Pages | 多次嘗試 404 | 可能需實名認證或人工審核 |
| Cloudflare Pages | 未完成 | 需 Cloudflare API Token |
| serveo.net | ✅ 手機可存取 | 作為備用方案，URL 會變動 |

## 備用方案：serveo.net 隧道

本機執行 `node httpd.js`（埠 9001），再開 serveo 隧道：

```bash
ssh -R 80:localhost:9001 serveo.net
```

手機用終端顯示的 URL 開啟。隧道斷線後重連 URL 會變。

## 技術架構

```
GitHub Pages (靜態託管)
├── index.html           # 產品列表（QR Code、分享）
├── viewer.html          # SVG 爆炸圖 + BOM + 詢價
├── admin.html           # 管理儀表板
├── analytics.js         # localStorage 分析模組
├── products.json        # 產品設定
├── products/p-type/     # P型齒輪箱 SVG + CSV
└── data/
    ├── stats.json       # 採購統計（generate_stats.py 產生）
    ├── purchases/       # 採購記錄 CSV
    ├── generate_stats.py   # 統計生成器
    └── test_generate_stats.py  # 單元測試 (13 tests)
```

## 數據搜集

所有分析數據存在瀏覽器 **localStorage**（不經後端）：

- `webbom_analytics` key，上限 1000 筆
- 管理員可在 admin.html 匯出 CSV 或清除數據
- 每台設備獨立儲存，不跨設備同步
