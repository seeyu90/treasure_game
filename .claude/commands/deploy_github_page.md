---
description: 把這個專案部署到 GitHub Pages（前端），需要時引導登入/建立 Repo，完成後把網址交給使用者確認
allowed-tools: Bash(gh:*), Bash(git:*), Bash(npm run build:*), Bash(npm install:*), Bash(npx gh-pages:*), Bash(ls:*), Bash(cat:*), Bash(test:*)
---

# 部署到 GitHub Pages

目標：把這個專案的**前端**部署到 GitHub Pages，取得一個可以打開來看的網址，交給使用者確認。**不要**在使用者未確認前建立新 repo、變更 repo 可見度（public/private）、或覆寫既有的 `gh-pages` 內容之外的其他分支。

## 重要背景（來自 CLAUDE.md，執行前務必記住）

- 這是純前端 + 獨立後端的架構：`npm run build` 只會把 `src/` 編譯到 `./build`（Vite `outDir` 設定為 `build`）。`server/`（`node:http` + `node:sqlite` 寫的後端）**完全不會**被這個 build 指令處理，也**不可能**跑在 GitHub Pages 上（GitHub Pages 只能放靜態檔案，沒有任何伺服器執行環境）。
- 因此本指令的範圍是：**只部署前端靜態產物**（訪客模式的遊戲本身可以正常玩），並在部署前後明確提醒使用者「登入/註冊/History（分數歷史）功能在 GitHub Pages 部署上不會運作」。
- GitHub Pages 的專案頁面（project site，網址形如 `https://<帳號>.github.io/<repo>/`）會把整個站台掛在 `/<repo>/` 這個子路徑下，**不是** `/`。若 `vite.config.ts` 沒有對應設定 `base: '/<repo>/'`，打包出來的資源路徑會是絕對路徑 `/`，部署後會出現整頁空白或資源 404——這是這個部署方式最容易踩的坑，執行前務必檢查並處理。
- 目前這個資料夾**還沒有初始化 git repository**（`git status` 會失敗）。第一次執行這個指令時，需要先 `git init` 才能繼續後面的步驟。

## 執行步驟

1. **檢查 GitHub CLI 是否已安裝與登入**
   - 執行 `gh --version` 確認已安裝；若找不到指令，停下來回報，請使用者自行安裝 `gh`（不要嘗試用其他方式繞過）。
   - 執行 `gh auth status` 檢查是否已登入。
     - 若**未登入**：告知使用者需要先登入 GitHub 帳號，請他們執行 `gh auth login` 並依照互動式提示完成（選擇 `github.com`、選 HTTPS 或 SSH、用瀏覽器或 token 登入）。這一步需要使用者親自操作，**不要**代為輸入帳密或 token。完成後再繼續下一步。

2. **檢查本機是否已是 git repository**
   - 執行 `git status`。
   - 若不是 git repo（目前這個專案就是這個狀況）：
     - 執行 `git init`。
     - 確認 `.gitignore` 已存在且涵蓋 `node_modules`、`build`、`server/data/*.db`、`.vercel`（目前已有，若使用者後續新增檔案類型再視情況補充，不要一次性亂加規則）。
     - 執行 `git add` 加入專案檔案（用 `git status` 先看過要加入的清單，不要盲目 `git add -A` 後就直接 commit，避免不小心加入不該進版控的檔案）。
     - 建立第一個 commit。
   - 若已經是 git repo，跳過初始化，直接看是否已有 commit 可以推送。

3. **確認 GitHub 上是否已有對應的 Repo**
   - 執行 `git remote -v` 看本機是否已設定 `origin`。
   - 若沒有 `origin`：
     - 詢問使用者要建立的 repo 名稱（預設可以用資料夾名稱 `treasure_game`）以及要 **public** 還是 **private**（GitHub Pages 在 free plan 上，private repo 也可以開啟 Pages，但確認一下使用者的意願）。
     - 用 `gh repo create <owner>/<repo> --public|--private --source=. --remote=origin` 建立（不要自動假設 public，一定要先問使用者）。
   - 若 `origin` 已存在，用 `gh repo view` 確認對應的 GitHub repo 存在且使用者有權限 push，不要盲目覆寫成別的 remote。

4. **處理 GitHub Pages 的 base path 設定**
   - 讀取 `vite.config.ts`，檢查 `build` 設定裡有沒有 `base`。
   - 如果沒有設定 `base`，且這是要部署成 `https://<帳號>.github.io/<repo>/` 的專案頁面（不是 `<帳號>.github.io` 這種帳號根頁面），需要加上 `base: '/<repo>/'`（`<repo>` 換成實際 repo 名稱）。
   - 修改前先告知使用者「要加這一行設定，否則部署後資源會 404」，改完再重新 `npm run build`。

5. **本機先跑一次 build，確認不會建置失敗**
   - 執行 `npm run build`。
   - 若失敗，停下來回報錯誤內容給使用者，不要繼續部署一個壞掉的 build。

6. **部署 `build/` 到 `gh-pages` 分支**
   - 檢查 `package.json` 是否已有 `gh-pages` 套件；若沒有，告知使用者要新增這個 devDependency，執行 `npm install -D gh-pages`。
   - 執行 `npx gh-pages -d build`，把 `build/` 目錄的內容推到 `gh-pages` 分支（這個工具會自動建立/更新該分支，不會動到目前所在的分支）。

7. **啟用 / 確認 GitHub Pages 設定**
   - 執行 `gh api repos/{owner}/{repo}/pages` 檢查是否已經設定過 Pages。
     - 若尚未設定（回應 404），執行 `gh api -X POST repos/{owner}/{repo}/pages -f "source[branch]=gh-pages" -f "source[path]=/"` 啟用，來源設為 `gh-pages` 分支的根目錄。
     - 若已經設定過，確認來源是不是 `gh-pages` 分支，不要覆寫成別的設定。
   - 第一次啟用 Pages 通常需要等待數分鐘才會生效；再次部署（分支已存在、Pages 已啟用）通常一兩分鐘內會更新。

8. **回報結果**
   - 網址格式為 `https://<帳號>.github.io/<repo>/`（注意結尾的 `/`，因為設定了 `base`）。
   - 把這個網址交給使用者確認，並附上提醒：
     - 這是**靜態前端**部署，登入、註冊、History（分數歷史）功能**不會正常運作**，因為後端 API 沒有一起部署。
     - 第一次啟用 Pages 可能需要等幾分鐘才能打開；如果一開啟是 404，先等一下再重整。

## 注意事項

- 不要在使用者未確認 repo 名稱與可見度（public/private）前執行 `gh repo create`。
- 不要對已存在的 git repo 執行會覆寫歷史的操作（例如 `git push --force`、`git reset --hard`）；`gh-pages` 這個工具本身只會更新 `gh-pages` 分支，不會動到使用者的主要分支，這是刻意選擇這個工具的原因。
- 不要嘗試把 `server/`（`node:http` + `node:sqlite` 後端）一起部署到 GitHub Pages——GitHub Pages 沒有任何伺服器執行環境，這麼做不會成功，只會產生誤導性的錯誤。
- 若 `gh auth status` 顯示未登入，且環境不允許互動式瀏覽器登入，停下來回報，不要嘗試用其他方式（例如貼上 token）代為完成登入。
