import { Transaction } from "@mysten/sui/transactions";

export interface BuyScratchCardParams {
  lotteryObjectId: string;
  randomObjectId: string;
  paymentCoinObjectId: string;
  ticketTier: number; // 0, 1, 2
  playerTier: number; // 0, 1, 2, 3
  packageId: string;
}

export interface SettleScratchParams {
  lotteryObjectId: string;
  scratchCardObjectId: string;
  packageId: string;
}

/**
 * 構建購買刮卡交易
 */
export function buildBuyScratchCardTx(
  params: BuyScratchCardParams
): Transaction {
  const tx = new Transaction();

  // 從錢包選取支付幣
  const [coin] = tx.splitCoins(
    tx.object(params.paymentCoinObjectId),
    [
      getPriceByTier(params.ticketTier)
    ]
  );

  // 調用 Move 合約 buy_scratch_card
  tx.moveCall({
    target: `${params.packageId}::scratch::buy_scratch_card`,
    arguments: [
      tx.object(params.lotteryObjectId),
      tx.object(params.randomObjectId),
      coin,
      tx.pure.u64(params.ticketTier),
      tx.pure.u64(params.playerTier),
    ],
  });

  return tx;
}

/**
 * 構建結算刮卡交易
 */
export function buildSettleScratchTx(
  params: SettleScratchParams
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${params.packageId}::scratch::settle_scratch`,
    arguments: [
      tx.object(params.lotteryObjectId),
      tx.object(params.scratchCardObjectId),
    ],
  });

  return tx;
}

/**
 * 根據票券等級返回價格 (mist)
 */
function getPriceByTier(tier: number): bigint {
  switch (tier) {
    case 0:
      return BigInt(20_000_000); // 0.02 SUI
    case 1:
      return BigInt(50_000_000); // 0.05 SUI
    case 2:
      return BigInt(100_000_000); // 0.1 SUI
    default:
      return BigInt(50_000_000);
  }
}

/**
 * 從環境變數取得部署的合約 ID
 */
export function getContractIds() {
  return {
    framework: import.meta.env.VITE_SUI_FRAMEWORK_PACKAGE_ID || "0x2",
    randomness: import.meta.env.VITE_SUI_RANDOM_PACKAGE_ID || "0x8",
    lottery: import.meta.env.VITE_LOTTERY_PACKAGE_ID,
    lotteryObject: import.meta.env.VITE_LOTTERY_OBJECT_ID,
  };
}
