# Hackathon 評審玩家操作流程（5-8 分鐘）

這份文件是給評審直接照著操作，快速完成一輪「買票 -> 刮卡 -> 領獎」並看到鏈上證據。

## 目標

1. 完成一輪鏈上刮刮樂交易
2. 若中獎，完成領獎交易
3. 看到官方模組整合證據（Randomness 0x8 與 onchain_invoice）

## 前置條件（開始前 1 分鐘確認）

1. 錢包使用 Sui Testnet
2. 錢包至少有 0.2 SUI 作為測試與 gas
3. 前端已啟動在 http://localhost:5173/
4. .env 已設定下列值
- VITE_SUI_NETWORK=testnet
- VITE_SUI_FULLNODE_URL=https://fullnode.testnet.sui.io:443
- VITE_LOTTERY_PACKAGE_ID=你的 lottery package id
- VITE_LOTTERY_OBJECT_ID=你的 ScratchLottery object id

## 評審實際操作流程

1. 連接錢包
- 在首頁點 Connect Wallet
- 預期結果：頁面顯示已連線地址與餘額

2. 先補測試幣（建議）
- 點上方的 🚰 補測試幣 按鈕
- 預期結果：系統送出 Testnet faucet 請求，數秒後餘額增加
- 若自動請求失敗：會自動開啟官方 faucet 網站做備援

3. 選擇票種
- 建議先選 0.05 SUI 票種（中間價位）
- 預期結果：票種被高亮顯示為目前選擇

4. 送出購票交易
- 點「購買並產生刮卡」
- 在錢包確認交易
- 預期結果：交易成功後會開啟刮卡視窗，並建立一個 ScratchCard 鏈上物件

5. 刮開卡面
- 用滑鼠或手指拖曳刮開銀漆
- 進度超過 56% 會自動揭曉
- 預期結果：顯示中獎或未中獎

6. 若中獎，送出領獎交易
- 點「領取獎金」
- 在錢包確認交易
- 預期結果：鏈上執行 settle_scratch，獎金發到玩家地址

7. 若未中獎，直接再買一張
- 重複步驟 2 到步驟 4
- 建議評審實測 2 到 3 張即可觀察完整體驗

## onchain_invoice 加分流程（系統自動嘗試）

1. 玩家購票成功後，前端會額外嘗試一筆 One-Stop 發票交易
2. 這筆交易會做三件事
- faucet USDC
- buy_quota（USDC 轉 TAX_COIN）
- init_invoice（開立鏈上發票）
3. 這筆交易失敗不會影響刮刮樂主流程，屬於加分項

## 評審可驗證的鏈上證據

1. 買票交易 target
- lottery::scratch::buy_scratch_card

2. 領獎交易 target
- lottery::scratch::settle_scratch

3. 官方隨機數整合（在 Move 合約）
- sui::random::new_generator
- sui::random::generate_u32

4. onchain_invoice 交易 target（若成功）
- onchain_invoice::usdc::faucet
- onchain_invoice::tax_coin::buy_quota
- onchain_invoice::invoice::init_invoice

## 常見狀況與排查

1. 按購買沒反應
- 檢查是否已連錢包
- 檢查 .env 的 VITE_LOTTERY_PACKAGE_ID、VITE_LOTTERY_OBJECT_ID 是否正確

2. 餘額不足
- 先點 🚰 補測試幣
- 若按鈕失敗，使用自動開啟的官方 faucet 網頁領取

3. 錢包跳錯網路
- 切到 Sui Testnet 後重試

4. 發票流程失敗
- 這是非阻斷路徑，不影響主遊戲評測
- 先以刮刮樂主流程完成評審

## 評審快速結論模板（可直接貼）

1. 我已完成連錢包、購票、刮卡流程
2. 我已看到鏈上 buy_scratch_card 呼叫
3. 我已驗證專案使用官方 random 模組（0x8）
4. 我已成功或嘗試 onchain_invoice 一站式流程
5. 專案符合官方 package 串接與可操作性要求
