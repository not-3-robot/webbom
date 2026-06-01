# WebBOM 開發進度

最後更新：2026-05-23

---

## 已完成功能

### 核心系統
- [x] **模板化查看器** (`viewer.html`) — 通過 `?product=xxx` URL 參數動態加載產品數據
- [x] **產品清單頁** (`index.html`) — 從 `products.json` 讀取產品列表，點擊進入查看器
- [x] **產品設定檔** (`products.json`) — 集中管理所有產品（SVG 路徑、BOM 路徑、名稱、型號）
- [x] **標準 BOM 格式** — CSV 含 Id, ItemNo, PartNumber, Name, Quantity 欄位
- [x] **CSV 相容性** — 同時支援中英文欄位名（Id/標籤ID、PartNumber/料品編號等）
- [x] **靜態檔案架構** — 無後端，純前端 + 靜態 JSON/CSV/SVG，HTTP Server 即可運行

### SVG 爆炸圖交互
- [x] **SVG 載入** — 從外部路徑動態 fetch SVG 並注入 DOM
- [x] **零件自動識別** — 解析 `inkscape:label="P01-零件名"` 屬性，匹配 BOM 數據
- [x] **hover 放大 1.1 倍** — 純 CSS 實現，無 JS 延遲（0.12s transition）
- [x] **hover 變色** — stroke 變 #D97757 + 淺色 fill
- [x] **點擊選中** — 選中後保持高亮 + 1.1x 放大
- [x] **浮動標籤** — 滑鼠懸停時顯示零件編號，位置跟隨零件坐標
- [x] **標籤坐標映射** — SVG viewBox 坐標正確轉換為 CSS 像素坐標
- [x] **resize 重新定位** — 視窗縮放時標籤重新計算位置
- [x] **SVG label ID 修復** — 原 P26 重複問題（一個 C 型扣環、一個油蓋）已修正

### BOM 清單功能
- [x] **零件列表渲染** — 從 CSV 數據動態生成
- [x] **搜索過濾** — 按零件編號或名稱即時過濾
- [x] **全選 / 清除** — 批量操作
- [x] **統計面板** — 已選種數、總數量
- [x] **可編輯數量** — 已選清單中可直接修改詢價數量
- [x] **雙向選擇** — 點擊清單或 SVG 均可選中/取消，兩者同步
- [x] **去重保護** — 防止 initBOMList 重複調用導致列表重複

### 詢價輸出
- [x] **mailto 發送** — 打開系統郵件客戶端，自動填入主題和正文
- [x] **自定義數量** — 詢價數量可逐項調整
- [x] **發送確認** — 彈窗確認後再打開郵件

### 手機端適配
- [x] **響應式佈局** — <=768px 改為上下切換，底部 Tab 欄
- [x] **Tab 切換** — 「爆炸圖」/「零件清單」兩個 Tab
- [x] **SVG 填滿螢幕** — 手機上 SVG 面板佔 60vh
- [x] **雙指縮放** — 允許 pinch zoom（移除 user-scalable=no）
- [x] **觸控延遲消除** — touch-action: manipulation
- [x] **點擊反饋** — 手機點擊零件顯示標籤 1.2 秒 + 短暫高亮動畫
- [x] **產品列表手機適配** — 單列卡片佈局，無 SVG 預載加快速度

---

## 當前狀態

可正常使用的核心流程：
```
index.html → 點擊產品 → viewer.html?product=p-type
                         ├── 載入 SVG + CSV
                         ├── 爆炸圖 hover/點擊選零件
                         ├── BOM 清單搜索/全選
                         └── 發送詢價郵件
```

目前只有一個產品（P 型齒輪箱），但架構已準備好擴充。

---

## 待開發 / 已知問題

### P1 - 影響使用
- [ ] SVG 零件標籤位置在某些縮放比例下仍然偏移（getBBox 在嵌套 transform 下不穩定）
- [ ] 手機上 SVG 零件太小，精準點擊困難（需要點擊輔助或放大鏡功能）

### P2 - 功能缺失
- [ ] **匯出報價單**（PDF / Excel / 純文字）— 目前只有 mailto
- [ ] **產品分類** — 上百種產品時需要分類/標籤過濾
- [ ] **BOM 編輯** — 直接在網頁上編輯零件數據（目前需改 CSV）
- [ ] **歷史記錄** — 已發送的詢價記錄保存

### P3 - 改進
- [ ] **批量添加產品** — 腳本掃描目錄自動生成 products.json
- [ ] **DWG → SVG 轉換** — 參考圖紙中有 .dwg 文件，目前無法直接使用
- [ ] **多語系** — 目前僅繁體中文
- [ ] **啟動腳本** — 一鍵啟動 + QR Code 生成
- [ ] **離線 PWA** — Service Worker 快取 SVG/CSV，無網路可用

### 採購統計（新增）
- [x] **採購記錄格式** — `data/purchases/<產品ID>.csv`，含日期、客戶、料號、數量、單價
- [x] **統計生成腳本** — `data/generate_stats.py`，一鍵計算 top 零件、客戶排名、月度趨勢
- [x] **前端統計 Tab** — viewer.html 第三個 Tab「採購統計」，顯示高頻零件、客戶排名、長條圖
- [ ] **自動定期更新** — cron 每週跑 generate_stats.py
- [ ] **採購記錄在線錄入** — 網頁表單新增採購記錄，暫存 localStorage

---

## 如何新增一個產品

```json
// products.json 加一行：
{
  "id": "k-type",
  "name": "K型齒輪箱",
  "model": "K-TYPE",
  "svg": "參考圖紙/k_type.svg",
  "bom": "products/k-type/bom.csv"
}
```

CSV 格式（複製 `products/p-type/bom.csv` 修改）：
```csv
Id,ItemNo,PartNumber,Name,Quantity
P01,1,400001,零件A,1
P02,2,400002,零件B,2
```

SVG 要求：Inkscape 導出的 SVG，每個零件的 `<g>` 要有 `inkscape:label="P01-零件名"` 這樣的屬性。

---

## 技術棧

- 純前端（HTML + CSS + Vanilla JS）
- 無任何依賴庫
- 運行只需要：`python3 -m http.server 8000 --bind 0.0.0.0`
- 數據格式：JSON（products.json）+ CSV（BOM 數據）
- SVG：Inkscape 導出格式，inkscape:label 屬性做零件標記
