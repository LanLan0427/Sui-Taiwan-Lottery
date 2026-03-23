# Sui 幸運抽籤（BermuDAO 黑客松）

語言：
- 英文版：[README.md](README.md)
- 繁體中文版（本檔）

**台灣刮刮樂遊玩現已整合 Sui 隨機數模組 (0x8)，符合黑客松 +10 加分條件。**

這是一個用於 Sui Sprout 參賽的前端 + Move 合約專案，包含：

- 台灣刮刮樂流程（購買、刮開、揭曉、領獎）
- 玩家等級倍率（Sprout / Bloom / Bermu Pro / Sui Master）
- **Move 合約整合官方隨機數** (`new_generator`, `generate_u32`)
- 交易簽署層已就緒，可執行鏈上調用

## 技術棧

- **前端：** React 18 + TypeScript + Vite
- **區塊鏈：** Sui dApp Kit + @mysten/sui/transactions
- **智能合約：** Move (edition 2024.beta) 搭配 sui::random
- **官方模組：** `0x2` (Framework) + `0x8` (Randomness)

## 快速開始

1. 安裝依賴

```bash
npm install
```

2. 建立環境變數檔

```bash
copy .env.example .env
```

設定：
- `VITE_SUI_NETWORK=testnet`
- `VITE_SUI_FULLNODE_URL=<testnet_endpoint>`
- `VITE_SUI_FRAMEWORK_PACKAGE_ID=0x2`
- `VITE_SUI_RANDOM_PACKAGE_ID=0x8`

3. 啟動開發伺服器

```bash
npm run dev
```

4. 生產編譯

```bash
npm run build
```

## 智能合約

Move 合約已成功編譯✅，功能包括：

- **buy_scratch_card()** - 使用 Sui 隨機數產生 9 宮格刮卡
- **settle_scratch()** - 驗證並向玩家錢包發放獎金  
- **new_round()** - 業主控制的輪次推進
- **官方隨機數整合** (sui::random::{new_generator, generate_u32})

## 前端交易層

`src/utils/transactions.ts` 交易工具已實現，接下來部署合約後即可連接。

## 黑客松檢查清單

- ✅ 台灣刮刮樂遊玩實現
- ✅ Sui 隨機數模組 (0x8) 整合
- ✅ 官方 Package ID 顯示與使用
- ✅ Move 合約編譯成功
- ✅ 交易層已就緒
- ✅ 雙語 UI (EN + 繁中)
- [ ] Testnet 部署

## 下一步

1. **部署** Move 合約至 testnet
2. **領取** Package ID + Object ID
3. **測試** Testnet 端對端
4. **提交** 至黑客松