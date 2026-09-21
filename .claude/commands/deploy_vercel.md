---
description: 建置前端並部署到 Vercel（Preview），完成後把預覽網址交給使用者確認
allowed-tools: Bash(npm run build:*), Bash(npx vercel:*), Bash(vercel:*), Bash(ls:*), Bash(cat:*), Bash(test:*)
---

# 部署到 Vercel

目標：把這個專案的**前端**部署到 Vercel，取得一個可以打開來看的網址，交給使用者確認。**不要**自動 promote 成 production／設定自訂網域，除非使用者明確要求。

## 重要背景（來自 CLAUDE.md，執行前務必記住）

- 這是純前端 + 獨立後端的架構：`npm run build` 只會編譯 `src/` 到 `./build`（Vite `outDir` 設定為 `build`，不是預設的 `dist`）。`server/`（`node:http` + `node:sqlite` 寫的後端）**完全不會**被這個 build 指令處理。
- Vercel 的 Serverless Functions 不適合直接跑這個 repo 現有的 `server/index.ts`：它是一個長駐、手刻路由表的 `node:http` server，而且用 `node:sqlite` 把資料寫在本機檔案 `server/data/game.db`——這在 Vercel 的無狀態/短生命週期執行環境下**不會持久化**，登入、註冊、遊戲紀錄（History）等功能部署後會壞掉或行為不一致。
- 因此本指令的預設範圍是：**只部署前端靜態產物**（訪客模式的遊戲本身可以正常玩），並在部署前後明確提醒使用者「登入/歷史紀錄相關功能在這個 Vercel 部署上不會運作」，避免使用者誤以為完整功能都能用。
- 若使用者之後要連後端一起上線，那是另一個獨立、需要重新設計（例如換成無伺服器相容的資料庫）的任務，這個指令不處理，只需口頭提示、不要動手改架構。

## 執行步驟

1. **檢查 Vercel CLI**
   - 執行 `npx vercel --version`（不需要全域安裝，`npx` 會在需要時自動下載）。
   - 如果使用者已全域安裝 `vercel`，優先用該指令。

2. **本機先跑一次 build，確認不會建置失敗**
   - 執行 `npm run build`。
   - 若失敗，停下來回報錯誤內容給使用者，不要繼續部署一個壞掉的 build。

3. **確認 Vercel 專案設定會用對輸出目錄**
   - 這個 repo 目前沒有 `vercel.json`。Vercel 對 Vite 專案預設會找 `dist`，但這個專案輸出到 `build`。
   - 檢查是否已存在 `vercel.json`：
     - 若不存在，建立一個內容如下的 `vercel.json`（先讓使用者知道你要新增這個檔案）：
       ```json
       {
         "buildCommand": "npm run build",
         "outputDirectory": "build"
       }
       ```
     - 若已存在，讀取內容確認 `outputDirectory` 是 `build`，不要盲目覆寫使用者既有設定。

4. **部署 Preview（不要用 `--prod`）**
   - 執行 `npx vercel --yes`（首次執行會需要使用者用瀏覽器登入 Vercel 帳號並選擇/建立專案——這一步需要使用者互動，無法完全自動化，照實告知使用者）。
   - 這個指令預設會產生一個 **Preview 部署**，而不是 production，符合「先給網址確認、之後才決定要不要正式上線」的目的。

5. **回報結果**
   - 從 CLI 輸出中擷取部署完成的網址（Vercel CLI 會印出類似 `https://<project>-<hash>.vercel.app` 的行）。
   - 把這個網址直接貼給使用者，並附上提醒：
     - 這是 Preview 網址，不是 production。
     - 登入、註冊、History（分數歷史）功能在此部署上**不會正常運作**，因為後端 API 沒有一起部署。
     - 若確認沒問題要正式上線，需要使用者再明確要求（例如「promote 到 production」或 `vercel --prod`），這個指令本身不會自動做這件事。

## 注意事項

- 不要在使用者未確認前執行 `vercel --prod`、設定自訂網域，或修改 DNS。
- 不要為了讓後端「看起來能動」而臨時改架構（例如硬塞一個 serverless function 包住現有的 `server/index.ts`）——這會產生一個看似成功但資料不持久、行為不一致的部署，比明確告知限制更容易誤導使用者。
- 若 `npx vercel --version` 顯示找不到指令且網路環境無法下載套件，停下來回報，不要嘗試繞過（例如改用其他未經確認的部署方式）。
