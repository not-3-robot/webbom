# WebBOM — 齒輪箱零件詢價系統

靜態網頁 BOM 查看器，讓客戶透過爆炸圖選取零件、調整數量、發送詢價郵件。內建採購統計儀表板（管理員限定）。

## 專案結構

```
WebBOM/
├── index.html          # 產品列表首頁
├── viewer.html         # 爆炸圖查看器（HTML 結構）
├── viewer.css          # 查看器樣式表（從 viewer.html 拆分）
├── viewer.js           # 查看器核心邏輯（從 viewer.html 拆分）
├── sanitize.js         # XSS 防護共用模組
├── analytics.js        # 前端分析（localStorage 版）
├── admin.html          # 管理儀表板
├── products.json       # 產品清單設定（含收件信箱）
├── products/
│   └── p-type/
│       ├── drawing.svg # Inkscape 爆炸圖
│       └── bom.csv     # 零件清單
├── data/
│   ├── purchases/      # 採購記錄 CSV（供統計用）
│   │   └── p-type.csv
│   ├── stats.json      # 由 generate_stats.py 產生
│   ├── generate_stats.py
│   └── test_generate_stats.py
├── httpd.js            # 簡易 HTTP 伺服器（含 CSP 安全標頭）
├── serve.js            # HTTP 伺服器 + localtunnel 隧道
└── 參考文件/            # 原始參考資料
```

## 快速啟動

```bash
# 本地測試
cd WebBOM
node httpd.js
# 開啟 http://localhost:9001

# 建立公網隧道（給外地測試用）
node serve.js
# 查看 serve.log 取得公網網址
```

## 如何新增產品

1. 在 `products/` 下建立新目錄，放入 `drawing.svg`（Inkscape 匯出）和 `bom.csv`
2. 編輯 `products.json` 加入新產品
3. SVG 中的零件群組需有 `inkscape:label="P01-..."` 屬性（格式：`P<編號>-<名稱>`）

BOM CSV 格式：
```csv
Id,ItemNo,PartNumber,Name,Quantity
P01,1,400198,C型扣環<R-47>,1
```

## 管理員功能

採購統計受密碼保護。預設密碼：`webom2024`（使用 SHA-256 hash 儲存，不再明文）

修改密碼：
1. 產生新密碼的 SHA-256 hash：`echo -n '你的密碼' | shasum -a 256`
2. 編輯 `viewer.html` 和 `admin.html` 中的 `ADMIN_PASSWORD_HASH` 變數

## 採購統計

1. 在 `data/purchases/` 下放入 CSV（格式同 BOM，加上 Date/Customer/UnitPrice/OrderNo 欄位）
2. 執行 `python3 data/generate_stats.py` 產生 `stats.json`
3. 前端會自動讀取顯示

## 鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `↑` `↓` | BOM 清單上下導航 |
| `Enter` | 選取/取消當前零件 |
| `Ctrl+Z` | 復原上一步選擇 |
| `Ctrl+A` | 全選所有零件 |
| `Esc` | 清除全部選擇 |
| `/` | 聚焦搜尋框 |
| `Ctrl+Shift+D` | 切換暗色模式 |

## 安全功能

- **路徑遍歷防護**：伺服器端防止 `../` 攻擊
- **CSP 標頭**：防止 XSS 與資源注入
- **SHA-256 密碼**：管理員密碼使用 hash 儲存，不暴露明文
- **XSS 防護**：所有使用者可控資料經過 HTML 轉義

## 部署（永久網址）
```
