import { useCallback, useEffect, useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { getContractIds, buildTopUpTx, buildWithdrawTx } from './utils/transactions'

type Locale = 'en' | 'zh'

interface LotteryStats {
  vault: number
  totalRevenue: number
  totalPayouts: number
  round: number
  cardCount: number
  owner: string
}

interface AdminPanelProps {
  locale: Locale
  onClose: () => void
  onBalanceChange?: () => void
}

export function AdminPanel({ locale, onClose, onBalanceChange }: AdminPanelProps) {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction()

  const [stats, setStats] = useState<LotteryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpAmount, setTopUpAmount] = useState('1')
  const [withdrawAmount, setWithdrawAmount] = useState('0.5')
  const [txStatus, setTxStatus] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  const fetchLotteryData = useCallback(async () => {
    const ids = getContractIds()
    if (!ids.lotteryObject) {
      setLoading(false)
      return
    }

    try {
      const obj = await suiClient.getObject({
        id: ids.lotteryObject,
        options: { showContent: true },
      })

      if (obj.data?.content?.dataType === 'moveObject') {
        const fields = obj.data.content.fields as any
        const vaultMist = Number(fields.vault || '0')
        const newStats: LotteryStats = {
          vault: vaultMist / 1_000_000_000,
          totalRevenue: Number(fields.total_revenue || '0') / 1_000_000_000,
          totalPayouts: Number(fields.total_payouts || '0') / 1_000_000_000,
          round: Number(fields.round || '1'),
          cardCount: Number(fields.card_count || '0'),
          owner: fields.owner || '',
        }
        setStats(newStats)
        setIsOwner(account?.address === newStats.owner)
      }
    } catch (err) {
      console.error('Failed to fetch lottery data:', err)
    } finally {
      setLoading(false)
    }
  }, [suiClient, account?.address])

  useEffect(() => {
    fetchLotteryData()
    const interval = setInterval(fetchLotteryData, 10000)
    return () => clearInterval(interval)
  }, [fetchLotteryData])

  const handleTopUp = async () => {
    const ids = getContractIds()
    if (!ids.lottery || !ids.lotteryObject) return

    const amountSui = parseFloat(topUpAmount)
    if (isNaN(amountSui) || amountSui <= 0) return

    try {
      setTxStatus(locale === 'zh' ? '⏳ 正在充值...' : '⏳ Topping up...')
      const tx = buildTopUpTx({
        lotteryObjectId: ids.lotteryObject,
        amount: BigInt(Math.round(amountSui * 1_000_000_000)),
        packageId: ids.lottery,
      })
      const result = await signAndExecute({ transaction: await tx.toJSON() })
      setTxStatus(locale === 'zh' ? `✅ 充值成功！TX: ${result.digest.slice(0, 12)}...` : `✅ Top-up success! TX: ${result.digest.slice(0, 12)}...`)
      fetchLotteryData()
      onBalanceChange?.()
    } catch (err: any) {
      setTxStatus(locale === 'zh' ? `❌ 充值失敗：${err.message?.slice(0, 60)}` : `❌ Failed: ${err.message?.slice(0, 60)}`)
    }
  }

  const handleWithdraw = async () => {
    const ids = getContractIds()
    if (!ids.lottery || !ids.lotteryObject) return

    const amountSui = parseFloat(withdrawAmount)
    if (isNaN(amountSui) || amountSui <= 0) return

    try {
      setTxStatus(locale === 'zh' ? '⏳ 正在提取...' : '⏳ Withdrawing...')
      const tx = buildWithdrawTx({
        lotteryObjectId: ids.lotteryObject,
        amount: BigInt(Math.round(amountSui * 1_000_000_000)),
        packageId: ids.lottery,
      })
      const result = await signAndExecute({ transaction: await tx.toJSON() })
      setTxStatus(locale === 'zh' ? `✅ 提取成功！TX: ${result.digest.slice(0, 12)}...` : `✅ Withdraw success! TX: ${result.digest.slice(0, 12)}...`)
      fetchLotteryData()
      onBalanceChange?.()
    } catch (err: any) {
      setTxStatus(locale === 'zh' ? `❌ 提取失敗：${err.message?.slice(0, 60)}` : `❌ Failed: ${err.message?.slice(0, 60)}`)
    }
  }

  const handleNewRound = async () => {
    const ids = getContractIds()
    if (!ids.lottery || !ids.lotteryObject) return

    try {
      setTxStatus(locale === 'zh' ? '⏳ 新增輪次...' : '⏳ Advancing round...')

      const { Transaction } = await import('@mysten/sui/transactions')
      const tx = new Transaction()
      tx.moveCall({
        target: `${ids.lottery}::scratch::new_round`,
        arguments: [tx.object(ids.lotteryObject)],
      })
      const result = await signAndExecute({ transaction: await tx.toJSON() })
      setTxStatus(locale === 'zh' ? `✅ 輪次已更新！TX: ${result.digest.slice(0, 12)}...` : `✅ Round advanced! TX: ${result.digest.slice(0, 12)}...`)
      fetchLotteryData()
    } catch (err: any) {
      setTxStatus(locale === 'zh' ? `❌ 失敗：${err.message?.slice(0, 60)}` : `❌ Failed: ${err.message?.slice(0, 60)}`)
    }
  }

  const ids = getContractIds()

  return (
    <div className="scratch-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="scratch-modal-content card admin-panel" style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
          <h2 style={{margin: 0, fontSize: '1.8rem'}}>
            {locale === 'zh' ? '🛠️ 管理後台' : '🛠️ Admin Dashboard'}
          </h2>
          <button
            onClick={onClose}
            style={{background:'#f0f0f0', border:'none', borderRadius:'50%', width:'40px', height:'40px', fontSize:'1.2rem', cursor:'pointer'}}
          >✕</button>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:'3rem', color:'#999', fontSize:'1.2rem'}}>
            {locale === 'zh' ? '讀取鏈上資料中...' : 'Loading on-chain data...'}
          </div>
        ) : !stats ? (
          <div style={{textAlign:'center', padding:'3rem', color:'#e60012'}}>
            {locale === 'zh' ? '無法讀取合約資料，請檢查 .env 設定' : 'Cannot fetch contract data. Check .env config.'}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <StatCard
                label={locale === 'zh' ? '💰 獎金池餘額' : '💰 Vault Balance'}
                value={`${stats.vault.toFixed(4)} SUI`}
                highlight
              />
              <StatCard
                label={locale === 'zh' ? '📈 累計營收' : '📈 Total Revenue'}
                value={`${stats.totalRevenue.toFixed(4)} SUI`}
              />
              <StatCard
                label={locale === 'zh' ? '📤 累計派獎' : '📤 Total Payouts'}
                value={`${stats.totalPayouts.toFixed(4)} SUI`}
              />
              <StatCard
                label={locale === 'zh' ? '💵 淨利潤' : '💵 Net Profit'}
                value={`${(stats.totalRevenue - stats.totalPayouts).toFixed(4)} SUI`}
              />
              <StatCard
                label={locale === 'zh' ? '🎯 目前輪次' : '🎯 Current Round'}
                value={`#${stats.round}`}
              />
              <StatCard
                label={locale === 'zh' ? '🎫 已售卡片' : '🎫 Cards Sold'}
                value={`${stats.cardCount}`}
              />
            </div>

            {/* Contract Info */}
            <div style={{background:'#f8f4eb', borderRadius:'12px', padding:'1rem', marginBottom:'1.5rem', fontSize:'0.85rem', color:'#666'}}>
              <div style={{marginBottom:'0.4rem'}}>
                <strong>Package ID:</strong>{' '}
                <a href={`https://suiscan.xyz/testnet/object/${ids.lottery}`} target="_blank" rel="noreferrer" style={{color:'#00665b', wordBreak:'break-all'}}>
                  {ids.lottery?.slice(0, 20)}...{ids.lottery?.slice(-8)}
                </a>
              </div>
              <div style={{marginBottom:'0.4rem'}}>
                <strong>Lottery Object:</strong>{' '}
                <a href={`https://suiscan.xyz/testnet/object/${ids.lotteryObject}`} target="_blank" rel="noreferrer" style={{color:'#00665b', wordBreak:'break-all'}}>
                  {ids.lotteryObject?.slice(0, 20)}...{ids.lotteryObject?.slice(-8)}
                </a>
              </div>
              <div>
                <strong>Owner:</strong>{' '}
                <span style={{wordBreak:'break-all'}}>{stats.owner.slice(0, 20)}...{stats.owner.slice(-8)}</span>
                {isOwner && <span style={{marginLeft:'0.5rem', background:'#00665b', color:'#fff', padding:'0.15rem 0.5rem', borderRadius:'4px', fontSize:'0.75rem'}}>YOU</span>}
              </div>
            </div>

            {/* Admin Actions */}
            {isOwner ? (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Top Up */}
                <div style={{background:'#f0faf8', borderRadius:'12px', padding:'1.2rem', border:'1px solid #d0e8e4'}}>
                  <h3 style={{margin:'0 0 0.8rem', fontSize:'1.1rem', color:'#00665b'}}>
                    {locale === 'zh' ? '➕ 充值獎金池' : '➕ Top Up Vault'}
                  </h3>
                  <div style={{display:'flex', gap:'0.8rem', alignItems:'center'}}>
                    <input
                      type="number"
                      step="0.1"
                      min="0.01"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      style={{flex:1, padding:'0.7rem', borderRadius:'8px', border:'1px solid #ccc', fontSize:'1rem'}}
                      placeholder="SUI"
                    />
                    <span style={{color:'#666', fontWeight:700}}>SUI</span>
                    <button
                      onClick={handleTopUp}
                      disabled={isPending}
                      style={{background:'#00665b', color:'#fff', border:'none', padding:'0.7rem 1.5rem', borderRadius:'8px', fontWeight:800, cursor:'pointer', whiteSpace:'nowrap'}}
                    >
                      {isPending ? '⏳' : locale === 'zh' ? '充值' : 'Top Up'}
                    </button>
                  </div>
                </div>

                {/* Withdraw */}
                <div style={{background:'#fef7f0', borderRadius:'12px', padding:'1.2rem', border:'1px solid #f0dcc8'}}>
                  <h3 style={{margin:'0 0 0.8rem', fontSize:'1.1rem', color:'#d48806'}}>
                    {locale === 'zh' ? '➖ 提取資金' : '➖ Withdraw Funds'}
                  </h3>
                  <div style={{display:'flex', gap:'0.8rem', alignItems:'center'}}>
                    <input
                      type="number"
                      step="0.1"
                      min="0.01"
                      max={stats.vault.toString()}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      style={{flex:1, padding:'0.7rem', borderRadius:'8px', border:'1px solid #ccc', fontSize:'1rem'}}
                      placeholder="SUI"
                    />
                    <span style={{color:'#666', fontWeight:700}}>SUI</span>
                    <button
                      onClick={handleWithdraw}
                      disabled={isPending}
                      style={{background:'#d48806', color:'#fff', border:'none', padding:'0.7rem 1.5rem', borderRadius:'8px', fontWeight:800, cursor:'pointer', whiteSpace:'nowrap'}}
                    >
                      {isPending ? '⏳' : locale === 'zh' ? '提取' : 'Withdraw'}
                    </button>
                  </div>
                </div>

                {/* New Round */}
                <div style={{background:'#f0f0f8', borderRadius:'12px', padding:'1.2rem', border:'1px solid #d0d0e4'}}>
                  <h3 style={{margin:'0 0 0.8rem', fontSize:'1.1rem', color:'#556'}}>
                    {locale === 'zh' ? '🔄 推進輪次' : '🔄 Advance Round'}
                  </h3>
                  <p style={{margin:'0 0 0.8rem', fontSize:'0.9rem', color:'#888'}}>
                    {locale === 'zh'
                      ? `目前第 ${stats.round} 輪。推進後將開始新一輪。`
                      : `Currently round ${stats.round}. Advance to start a new one.`}
                  </p>
                  <button
                    onClick={handleNewRound}
                    disabled={isPending}
                    style={{background:'#556', color:'#fff', border:'none', padding:'0.7rem 1.5rem', borderRadius:'8px', fontWeight:800, cursor:'pointer'}}
                  >
                    {isPending ? '⏳' : locale === 'zh' ? `開始第 ${stats.round + 1} 輪` : `Start Round ${stats.round + 1}`}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{textAlign:'center', padding:'2rem', color:'#999', background:'#f8f8f8', borderRadius:'12px'}}>
                {locale === 'zh'
                  ? '⚠️ 你不是合約擁有者，僅可查看數據，無法執行管理操作。'
                  : '⚠️ You are not the contract owner. View-only mode.'}
              </div>
            )}

            {/* TX Status */}
            {txStatus && (
              <div style={{marginTop:'1.5rem', padding:'1rem', borderRadius:'8px', background: txStatus.includes('✅') ? '#f0faf8' : txStatus.includes('❌') ? '#fef0f0' : '#fffbe6', fontSize:'0.9rem', fontWeight:700, color:'#333'}}>
                {txStatus}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg, #00665b, #008577)' : '#fff',
      color: highlight ? '#fff' : '#333',
      borderRadius: '12px',
      padding: '1.2rem',
      border: highlight ? 'none' : '1px solid #eee',
      boxShadow: highlight ? '0 4px 15px rgba(0,102,91,0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.4rem', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</div>
    </div>
  )
}
