import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import './App.css'
import { getContractIds } from './utils/transactions'
import { AnimatedNumber } from './AnimatedNumber'
import { playCoinSound, playScratchSound, playWinSound } from './utils/audio'

const SCRATCH_THRESHOLD_PERCENT = 56
const SCRATCH_SAMPLE_STRIDE = 8
const SCRATCH_LINE_WIDTH = 38
const SCRATCH_DOT_RADIUS = 18
const RESULT_SYMBOLS = ['7', 'BAR', 'DIAMOND', 'CLOVER', 'COIN', 'STAR']

type Locale = 'en' | 'zh'
type TicketId = 't200' | 't500' | 't1000'

const content = {
  en: {
    eyebrow: 'Sui Sprout Hackathon Build',
    title: 'Taiwan Scratch Lottery: On-chain Edition',
    currentJackpot: 'Community Prize Pool',
    drawCadence: 'Scratch result uses frontend demo randomness for now',
    yourLevel: 'Your Level',
    prizeMultiplier: 'Prize multiplier',
    winningOdds: 'Estimated Win Rate',
    oddsHint: 'Tier bonus improves expected payout',
    buyTickets: 'Buy Scratch Ticket',
    ticketPrice: 'Ticket price',
    connectedButton: 'Buy & Generate Scratch Card',
    disconnectedButton: 'Connect Wallet to Buy',
    ticketsOwned: 'Cards purchased',
    selectTicket: 'Ticket Type',
    scratchBoard: 'Scratch Board',
    scratchOne: 'Scratch naturally on the card',
    scratchAll: 'Reveal result now',
    newCard: 'Generate New Card',
    noCard: 'Buy one scratch ticket to create your card.',
    statusReady: 'Card ready. Start scratching.',
    statusInProgress: 'Keep scratching to reveal all symbols.',
    statusLose: 'No prize this round. Try another card.',
    statusWin: 'Winning card! Claim your payout.',
    claimPrize: 'Claim Prize',
    claimedPrize: 'Prize claimed',
    yourPayout: 'Round payout',
    totalWon: 'Total won',
    totalSpent: 'Total spent',
    modeTitle: 'Current Mode',
    modeDemo: 'Guided demo mode: numbers and card flow update in real time, but no on-chain transaction is sent yet.',
    modeHelp: 'New players can safely learn the full buy -> scratch -> claim flow first.',
    stepTitle: 'How To Play',
    step1: 'Step 1: Choose a ticket and buy one card',
    step2: 'Step 2: Scratch cells until all symbols are revealed',
    step3: 'Step 3: If you win, claim your prize',
    step4: 'Step 4: Start a new card for next round',
    boardHint: 'Drag with mouse or finger to scratch the silver coating.',
    scratchProgress: 'Scratch progress',
    scratchThresholdHint: 'Once progress reaches 56%, the remaining layer auto-reveals.',
    winBanner: 'YOU WIN',
    loseBanner: 'TRY AGAIN',
    pendingBanner: 'REVEALING...',
    revealHint: 'Scratch complete. Claim to settle reward.',
    flowNow: 'Current step',
    flowBuy: 'Buying',
    flowScratch: 'Scratching',
    flowClaim: 'Claiming',
    flowDone: 'Round complete',
    roundResult: 'Round result',
    roundWin: 'Winning round',
    roundLose: 'No prize',
    roundPending: 'Not finished yet',
    hotGames: 'Hot Scratch Games',
    searchTicket: 'Search by game keyword',
    searchPlaceholder: 'Try: lucky, gold, fortune...',
    filterPrice: 'Filter by price (SUI)',
    allPrice: 'All SUI prices',
    totalOddsLabel: 'Total odds',
    maxPrizeLabel: 'Max payout',
    selectThisTicket: 'Select this ticket',
    selectedTicketLabel: 'Current selection',
    mustFinishCurrentCard: 'Please finish scratching your current card before buying a new one.',
    abandonUnclaimedPrize: 'You have an unclaimed winning card. Start a new card and give up this prize?',
    langEn: 'EN',
    langZh: '繁中',
  },
  zh: {
    eyebrow: 'Sui Sprout 黑客松作品',
    title: '台灣刮刮樂：鏈上版本',
    currentJackpot: '社群獎池',
    drawCadence: '目前先用前端隨機模擬刮卡結果',
    yourLevel: '你的等級',
    prizeMultiplier: '獎勵倍率',
    winningOdds: '預估中獎率',
    oddsHint: '等級加成會提高期望回饋',
    buyTickets: '購買刮刮樂',
    ticketPrice: '票價',
    connectedButton: '購買並產生刮卡',
    disconnectedButton: '請先連接錢包',
    ticketsOwned: '已購買張數',
    selectTicket: '票種',
    scratchBoard: '刮卡區',
    scratchOne: '在卡片上滑動刮除銀漆',
    scratchAll: '立即揭曉結果',
    newCard: '產生新卡',
    noCard: '先購買一張刮刮樂，就會產生刮卡。',
    statusReady: '卡片已建立，開始刮吧。',
    statusInProgress: '持續刮開，直到全部格子揭曉。',
    statusLose: '這回沒有中獎，再來一張。',
    statusWin: '恭喜中獎，請領取獎金。',
    claimPrize: '領取獎金',
    claimedPrize: '已領取獎金',
    yourPayout: '本輪獎金',
    totalWon: '累計中獎',
    totalSpent: '累計花費',
    modeTitle: '目前模式',
    modeDemo: '這是引導式體驗模式：畫面流程與數字會即時更新，但目前不會送出鏈上交易。',
    modeHelp: '新玩家可以先熟悉完整流程：買票 -> 刮卡 -> 領獎。',
    stepTitle: '新手操作步驟',
    step1: '步驟 1：選票種並購買一張',
    step2: '步驟 2：持續刮開，直到九宮格全揭曉',
    step3: '步驟 3：若中獎，按下領獎',
    step4: '步驟 4：開始下一張新卡',
    boardHint: '用滑鼠或手指拖曳，刮開上層銀色塗層。',
    scratchProgress: '刮除進度',
    scratchThresholdHint: '進度達到 56% 後，會自動揭曉剩餘塗層。',
    winBanner: '恭喜中獎',
    loseBanner: '再接再厲',
    pendingBanner: '刮開中...',
    revealHint: '已揭曉，請按領獎完成結算。',
    flowNow: '目前步驟',
    flowBuy: '購票中',
    flowScratch: '刮卡中',
    flowClaim: '領獎中',
    flowDone: '本輪完成',
    roundResult: '本輪結果',
    roundWin: '中獎',
    roundLose: '未中獎',
    roundPending: '尚未完成',
    hotGames: '熱賣中刮刮樂',
    searchTicket: '請搜尋遊戲關鍵字',
    searchPlaceholder: '例如：幸運、財神、金幣...',
    filterPrice: '請選擇 SUI 票價',
    allPrice: '全部 SUI 票價',
    totalOddsLabel: '總中獎率',
    maxPrizeLabel: '最高可得',
    selectThisTicket: '選擇這張',
    selectedTicketLabel: '目前選擇',
    mustFinishCurrentCard: '請先刮完目前這張卡，再買新卡。',
    abandonUnclaimedPrize: '你有一張尚未領獎的中獎卡，確定要直接開新卡並放棄這筆獎金嗎？',
    langEn: 'EN',
    langZh: '繁中',
  },
} as const

type Tier = {
  key: 'sprout' | 'bloom' | 'bermuPro' | 'suiMaster'
  multiplier: number
  requiredTickets: number
}

const tiers: Tier[] = [
  { key: 'sprout', multiplier: 1.0, requiredTickets: 0 },
  { key: 'bloom', multiplier: 1.1, requiredTickets: 20 },
  { key: 'bermuPro', multiplier: 1.25, requiredTickets: 50 },
  { key: 'suiMaster', multiplier: 1.5, requiredTickets: 100 },
]

type GameType = 'match3' | 'beat_score' | 'match_number'

type TicketType = {
  id: TicketId
  gameType: GameType
  title: {
    en: string
    zh: string
  }
  priceSui: number
  winRate: string
  maxPayoutSui: number
}

type BoardData = 
  | { type: 'match3'; symbols: string[] }
  | { type: 'beat_score'; rows: { yours: number; opponent: number; prize: number; isWin: boolean }[] }
  | { type: 'match_number'; winningNumber: number; yourNumbers: { num: number; prize: number; isWin: boolean }[] }

type ScratchSession = {
  id: number
  boardData: BoardData
  payoutSui: number
  isFinished: boolean
  isClaimed: boolean
}

const ticketTypes: TicketType[] = [
  {
    id: 't200',
    gameType: 'match3',
    title: { en: 'Fortune Line', zh: '出棋制勝' },
    priceSui: 0.02,
    winRate: '30.10%',
    maxPayoutSui: 0.4,
  },
  {
    id: 't500',
    gameType: 'beat_score',
    title: { en: 'Fishing Master', zh: '釣魚高手' },
    priceSui: 0.05,
    winRate: '40.14%',
    maxPayoutSui: 1,
  },
  {
    id: 't1000',
    gameType: 'match_number',
    title: { en: 'Lucky Star', zh: '幸運號碼' },
    priceSui: 0.1,
    winRate: '25.10%',
    maxPayoutSui: 2,
  },
]

function drawMultiplier(): number {
  const roll = Math.random()
  if (roll < 0.03) return 20
  if (roll < 0.12) return 6
  if (roll < 0.32) return 1.5
  return 0
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

function chooseRandomSymbol(excluded: string[] = []): string {
  const pool = RESULT_SYMBOLS.filter((item) => !excluded.includes(item))
  return pool[randomInt(pool.length)]
}

const spawnParticle = (x: number, y: number, container: HTMLElement) => {
  const particle = document.createElement('div')
  particle.className = 'scratch-dust'
  particle.style.left = `${x}px`
  particle.style.top = `${y}px`
  const size = Math.random() * 4 + 2
  particle.style.width = `${size}px`
  particle.style.height = `${size}px`
  particle.style.transform = `rotate(${Math.random() * 360}deg)`
  
  container.appendChild(particle)
  
  const angle = Math.random() * Math.PI
  const distance = Math.random() * 60 + 30
  const fallY = Math.random() * 120 + 80
  
  particle.animate([
    { transform: `translate(0, 0) rotate(0deg) scale(1)`, opacity: 0.9 },
    { transform: `translate(${Math.cos(angle) * distance}px, ${fallY}px) rotate(${Math.random() * 720}deg) scale(0.2)`, opacity: 0 }
  ], {
    duration: Math.random() * 400 + 400,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fill: 'forwards'
  }).onfinish = () => {
    particle.remove()
  }
}

function buildBoardData(gameType: GameType, isWinner: boolean, payoutSui: number): BoardData {
  if (gameType === 'match_number') {
    const winningNumber = randomInt(99) + 1;
    let yourNumbers = Array.from({ length: 6 }, () => ({
      num: randomInt(99) + 1,
      prize: randomInt(10) > 5 ? Number((0.02 * randomInt(5)).toFixed(3)) : 0, 
      isWin: false
    }));
    
    // ensure no accidental wins
    yourNumbers.forEach(n => { if (n.num === winningNumber) n.num = (winningNumber % 98) + 1; });
    
    if (isWinner) {
      const winIdx = randomInt(6);
      yourNumbers[winIdx].num = winningNumber;
      yourNumbers[winIdx].isWin = true;
      yourNumbers[winIdx].prize = payoutSui;
    }
    return { type: 'match_number', winningNumber, yourNumbers };
  }
  
  if (gameType === 'beat_score') {
    let rows = Array.from({ length: 4 }, () => {
      const opponent = randomInt(15) + 5;
      let yours = randomInt(opponent); // lose by default
      return { yours, opponent, prize: randomInt(10) > 5 ? Number((0.02 * randomInt(5)).toFixed(3)) : 0, isWin: false };
    });
    
    if (isWinner) {
      const winIdx = randomInt(4);
      const opponent = rows[winIdx].opponent;
      rows[winIdx].yours = opponent + randomInt(5) + 1; // higher!
      rows[winIdx].isWin = true;
      rows[winIdx].prize = payoutSui;
    }
    return { type: 'beat_score', rows };
  }
  
  if (!isWinner) {
    const counts = new Map<string, number>()
    const symbols = Array.from({ length: 9 }, () => {
      const available = RESULT_SYMBOLS.filter((item) => (counts.get(item) ?? 0) < 2)
      const symbol = available[randomInt(available.length)]
      counts.set(symbol, (counts.get(symbol) ?? 0) + 1)
      return symbol
    })
    return { type: 'match3', symbols }
  }

  const winSymbol = chooseRandomSymbol()
  const symbols = Array.from({ length: 9 }, () => chooseRandomSymbol([winSymbol]))
  const slots = Array.from({ length: 9 }, (_, i) => i)
  for (let i = slots.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }

  for (const idx of slots.slice(0, 3)) {
    symbols[idx] = winSymbol
  }
  return { type: 'match3', symbols }
}

function App() {
  const account = useCurrentAccount()
  const { isPending: isExecuting } = useSignAndExecuteTransaction()
  
  const [locale, setLocale] = useState<Locale>('zh')
  const [selectedTicket, setSelectedTicket] = useState<TicketId>('t500')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [priceFilter, setPriceFilter] = useState<'all' | '0.02' | '0.05' | '0.1'>('all')
  const [myTickets, setMyTickets] = useState(0)
  const [totalSpentSui, setTotalSpentSui] = useState(0)
  const [totalWonSui, setTotalWonSui] = useState(0)
  const [session, setSession] = useState<ScratchSession | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scratchPercent, setScratchPercent] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isScratchingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const autoRevealRef = useRef(false)
  const lastMeasureTsRef = useRef(0)

  const t = content[locale]
  const activeTicket = ticketTypes.find((item) => item.id === selectedTicket) ?? ticketTypes[1]
  const filteredTickets = useMemo(() => {
    return ticketTypes.filter((item) => {
      const passKeyword =
        searchKeyword.trim().length === 0 ||
        item.title.en.toLowerCase().includes(searchKeyword.trim().toLowerCase()) ||
        item.title.zh.includes(searchKeyword.trim())
      const passPrice = priceFilter === 'all' || String(item.priceSui) === priceFilter
      return passKeyword && passPrice
    })
  }, [priceFilter, searchKeyword])

  const currentTier = useMemo(() => {
    const next = [...tiers].reverse().find((tier) => myTickets >= tier.requiredTickets)
    return next ?? tiers[0]
  }, [myTickets])

  const getGameRule = (type: GameType) => {
    if (locale === 'en') {
      if (type === 'match3') return 'Match 3 identical symbols anywhere on the board to win the prize listed.'
      if (type === 'beat_score') return 'Compare your score to the opponent in each row. If yours is higher, you win that row\'s prize!'
      if (type === 'match_number') return 'Match any of YOUR NUMBERS to the WINNING NUMBER to win the prize shown below it.'
    } else {
      if (type === 'match3') return '任一刮區內刮出 3 個相同符號，即得該獎金。'
      if (type === 'beat_score') return '在任一局中，若「您的分數」大於「對手分數」，即得該局獎金。'
      if (type === 'match_number') return '任一個「您的號碼」對中「幸運號碼」，即得該號碼對應的獎金。'
    }
  }

  const toCanvasPoint = useCallback((canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const measureScratchPercent = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    const margin = 20
    const w = canvas.width - margin * 2
    const h = canvas.height - margin * 2
    if (w <= 0 || h <= 0) return 0

    const { data } = ctx.getImageData(margin, margin, w, h)
    let transparent = 0
    let sampled = 0
    const step = 4 * SCRATCH_SAMPLE_STRIDE

    for (let i = 3; i < data.length; i += step) {
      sampled += 1
      if (data[i] < 20) {
        transparent += 1
      }
    }

    if (sampled === 0) return 0
    return (transparent / sampled) * 100
  }, [])

  const revealRemainingLayer = useCallback(() => {
    if (!session) return
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.classList.add('fade-out')
    window.setTimeout(() => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      setSession((prev) => {
        if (!prev) return prev
        return { ...prev, isFinished: true }
      })
      setScratchPercent(100)
    }, 220)
  }, [session])

  const scratchAtPoint = useCallback((clientX: number, clientY: number) => {
    if (!session || session.isFinished || autoRevealRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const point = toCanvasPoint(canvas, clientX, clientY)
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)'
    ctx.shadowBlur = 12

    if (lastPointRef.current) {
      ctx.lineWidth = SCRATCH_LINE_WIDTH
      ctx.beginPath()
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(point.x, point.y, SCRATCH_DOT_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    lastPointRef.current = point

    const now = performance.now()
    if (now - lastMeasureTsRef.current < 90) return
    playScratchSound()

    if (Math.random() > 0.3) {
      const count = randomInt(4) + 1;
      for (let i = 0; i < count; i++) {
        spawnParticle(point.x + randomInt(20) - 10, point.y + randomInt(20) - 10, canvas.parentElement as HTMLElement);
      }
    }

    const percent = measureScratchPercent(canvas)
    setScratchPercent(percent)
    lastMeasureTsRef.current = now

    if (percent >= SCRATCH_THRESHOLD_PERCENT) {
      autoRevealRef.current = true
      revealRemainingLayer()
    }
  }, [measureScratchPercent, revealRemainingLayer, session, toCanvasPoint])

  const resetScratchCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    gradient.addColorStop(0, '#d5d9de')
    gradient.addColorStop(0.5, '#aab1ba')
    gradient.addColorStop(1, '#cdd2d8')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, rect.width, rect.height)

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imgData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise))
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise))
    }
    ctx.putImageData(imgData, 0, 0)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    for (let i = 0; i < 7; i += 1) {
      const y = 16 + i * 26
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(66, 74, 84, 0.75)'
    ctx.font = '700 22px Segoe UI'
    ctx.textAlign = 'center'
    ctx.fillText(locale === 'zh' ? '刮開看結果' : 'SCRATCH TO REVEAL', rect.width / 2, rect.height / 2)

    canvas.classList.remove('fade-out')
    autoRevealRef.current = false
    setScratchPercent(0)
    lastPointRef.current = null
    lastMeasureTsRef.current = 0
  }, [locale])

  const buyScratchCard = async (ticket: TicketType) => {
    setSelectedTicket(ticket.id)
    if (session && !session.isClaimed && isModalOpen) return

    const multiplier = drawMultiplier() * currentTier.multiplier
    const payout = Number((ticket.priceSui * multiplier).toFixed(3))
    const nextSession: ScratchSession = {
      id: Date.now(),
      boardData: buildBoardData(ticket.gameType, payout > 0, payout),
      payoutSui: payout,
      isFinished: false,
      isClaimed: false,
    }

    setSession(nextSession)
    setMyTickets((prev) => prev + 1)
    setTotalSpentSui((prev) => Number((prev + ticket.priceSui).toFixed(3)))
    playCoinSound()
    setIsModalOpen(true)

    // Try on-chain transaction if contract is deployed
    if (account) {
      const ids = getContractIds()
      if (ids.lottery && ids.lotteryObject) {
        try {
          console.log('Would call buy_scratch_card on testnet', { ids, ticket: ticket.id })
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  const scratchAll = () => {
    if (!session || session.isFinished) return
    autoRevealRef.current = true
    revealRemainingLayer()
  }

  const claimPrize = async () => {
    if (!session || !session.isFinished || session.isClaimed || session.payoutSui <= 0) return
    
    setSession({ ...session, isClaimed: true })
    setTotalWonSui((prev) => Number((prev + session.payoutSui).toFixed(3)))
    playWinSound()

    // Try on-chain settlement if contract is deployed
    if (account) {
      const ids = getContractIds()
      if (ids.lottery && ids.lotteryObject) {
        try {
          console.log('Would call settle_scratch on testnet', { ids })
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  useEffect(() => {
    if (!session || session.isFinished) return
    resetScratchCanvas()
  }, [resetScratchCanvas, session?.id, session?.isFinished])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !session || session.isFinished) return

    const onMouseDown = (event: MouseEvent) => {
      isScratchingRef.current = true
      scratchAtPoint(event.clientX, event.clientY)
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!isScratchingRef.current) return
      scratchAtPoint(event.clientX, event.clientY)
    }

    const onMouseUp = () => {
      isScratchingRef.current = false
      lastPointRef.current = null
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 0) return
      event.preventDefault()
      isScratchingRef.current = true
      const touch = event.touches[0]
      scratchAtPoint(touch.clientX, touch.clientY)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!isScratchingRef.current || event.touches.length === 0) return
      event.preventDefault()
      const touch = event.touches[0]
      scratchAtPoint(touch.clientX, touch.clientY)
    }

    const onTouchEnd = () => {
      isScratchingRef.current = false
      lastPointRef.current = null
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [scratchAtPoint, session])

  const scratchStatus = useMemo(() => {
    if (!session) return t.noCard
    if (!session.isFinished) {
      return scratchPercent < 2 ? t.statusReady : t.statusInProgress
    }
    return session.payoutSui > 0 ? t.statusWin : t.statusLose
  }, [scratchPercent, session, t])
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
        </div>
        <div className="topbar-controls">
          <div className="lang-switch" role="group" aria-label="Language Switch">
            <button
              type="button"
              className={locale === 'en' ? 'lang-btn active' : 'lang-btn'}
              onClick={() => setLocale('en')}
            >
              {t.langEn}
            </button>
            <button
              type="button"
              className={locale === 'zh' ? 'lang-btn active' : 'lang-btn'}
              onClick={() => setLocale('zh')}
            >
              {t.langZh}
            </button>
          </div>
          <ConnectButton />
        </div>
      </header>

      <section className="market-section">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: '1.5rem', marginTop: '1rem'}}>
          <h2 style={{fontSize: '2rem', margin: 0, color: '#333'}}>{t.buyTickets}</h2>
          <div style={{display:'flex', gap:'1.5rem', fontSize:'0.9rem', color:'#666'}}>
            <div>{t.totalSpent}: <AnimatedNumber value={totalSpentSui} decimals={3}/> SUI</div>
            <div>{t.totalWon}: <AnimatedNumber value={totalWonSui} decimals={3}/> SUI</div>
            <div>{t.ticketsOwned}: <AnimatedNumber value={myTickets} duration={400}/></div>
          </div>
        </div>
        
        <div className="market-controls" style={{marginBottom: '2rem'}}>
          <div className="search-bar">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
          <div className="filter-pills">
            <button className={priceFilter === 'all' ? 'pill active' : 'pill'} onClick={() => setPriceFilter('all')}>
              {locale === 'zh' ? '全部' : 'All'}
            </button>
            <button className={priceFilter === '0.02' ? 'pill active' : 'pill'} onClick={() => setPriceFilter('0.02')}>
              0.02 SUI
            </button>
            <button className={priceFilter === '0.05' ? 'pill active' : 'pill'} onClick={() => setPriceFilter('0.05')}>
              0.05 SUI
            </button>
            <button className={priceFilter === '0.1' ? 'pill active' : 'pill'} onClick={() => setPriceFilter('0.1')}>
              0.1 SUI
            </button>
          </div>
        </div>

        <div className="ticket-wall">
          {filteredTickets.map((item) => (
            <div
              key={item.id}
              className={selectedTicket === item.id ? 'ticket-card active' : 'ticket-card'}
            >
              <div className="ticket-art" onClick={() => setSelectedTicket(item.id)}>
                <span className="ticket-art-title">{item.title[locale]}</span>
                <span className="ticket-art-rule">{getGameRule(item.gameType)}</span>
              </div>
              <div className="ticket-info">
                <p className="ticket-title">{item.title[locale]}</p>
                <p className="ticket-meta" style={{marginTop: '0.4rem'}}>{t.totalOddsLabel}: {item.winRate}</p>
                <p className="ticket-meta">{t.maxPrizeLabel}: {item.maxPayoutSui} SUI</p>
                
                <button 
                  className="buy-btn"
                  onClick={(e) => { e.stopPropagation(); buyScratchCard(item); }}
                  disabled={isExecuting || isModalOpen || !account}
                >
                  {isExecuting ? '⏳ Processing...' : `💳 ${locale === 'zh' ? '購買' : 'Buy'} (${item.priceSui} SUI)`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen && session && (
        <div className="scratch-modal-overlay">
          <div className="scratch-modal-content card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{margin: 0, fontSize: '2rem'}}>{activeTicket.title[locale]}</h2>
              <div style={{fontWeight: 800, color: '#e60012', background: '#fff0f0', padding: '0.6rem 1.2rem', borderRadius: '16px', fontSize: '1.2rem'}}>
                {locale === 'zh' ? '⭐ 遊玩中' : '⭐ PLAYING'}
              </div>
            </div>
            
            <p className="hint" style={{lineHeight: 1.6, marginTop: '1rem'}}>
              {t.boardHint}<br/>
              <strong style={{color: '#e60012', fontSize: '1.15rem', marginTop:'0.8rem', display:'inline-block'}}>
                👉 {locale === 'zh' ? '本區玩法' : 'How to win'}: {getGameRule(session.boardData.type)}
              </strong>
            </p>
            
            <div 
              className="scratch-stage"
              onMouseMove={(e) => {
                 const card = e.currentTarget;
                 const rect = card.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const y = e.clientY - rect.top;
                 const rx = ((y - rect.height/2) / (rect.height/2)) * -8;
                 const ry = ((x - rect.width/2) / (rect.width/2)) * 8;
                 card.style.setProperty('--rx', `${rx}deg`);
                 card.style.setProperty('--ry', `${ry}deg`);
                 card.style.setProperty('--px', `${x}px`);
                 card.style.setProperty('--py', `${y}px`);
                 card.style.setProperty('--glare', '1');
              }}
              onMouseLeave={(e) => {
                 const card = e.currentTarget;
                 card.style.setProperty('--rx', `0deg`);
                 card.style.setProperty('--ry', `0deg`);
                 card.style.setProperty('--px', `50%`);
                 card.style.setProperty('--py', `50%`);
                 card.style.setProperty('--glare', '0');
              }}
            >
              <div className="result-layer pending">
                <div className="result-content">
                  {session.boardData.type === 'match3' && (
                    <div className="result-grid">
                      {session.boardData.symbols.map((symbol, idx) => (
                        <div key={`${symbol}-${idx}`} className="result-cell">{symbol}</div>
                      ))}
                    </div>
                  )}
                  {session.boardData.type === 'beat_score' && (
                    <div className="result-fishing">
                      <div style={{display:'flex', justifyContent:'space-between', padding:'0 0.5rem', marginBottom: '0.8rem', fontSize:'1rem', color:'#666'}}>
                        <span>{locale === 'zh' ? '您的分數' : 'Your Score'}</span>
                        <span>{locale === 'zh' ? '對手分數' : 'Opponent'}</span>
                        <span>{locale === 'zh' ? '獎金' : 'Prize'}</span>
                      </div>
                      {session.boardData.rows.map((row, idx) => (
                         <div key={idx} className={`result-fishing-row ${row.isWin ? 'win' : ''}`}>
                           <div><span>{row.yours}</span></div>
                           <div><span>{row.opponent}</span></div>
                           <div>{row.prize > 0 ? `${row.prize} SUI` : '-'}</div>
                         </div>
                      ))}
                    </div>
                  )}
                  {session.boardData.type === 'match_number' && (
                    <div className="result-numbers-wrap">
                      <div className="result-numbers-top">
                        <div style={{fontWeight: 800, color: '#333'}}>
                          {locale === 'zh' ? '幸運號碼' : 'Winning Number'}
                        </div>
                        <div className="winning-num">{session.boardData.winningNumber}</div>
                      </div>
                      <div className="result-numbers-grid">
                        {session.boardData.yourNumbers.map((item, idx) => (
                          <div key={idx} className={`result-cell ${item.isWin ? 'win' : ''}`} style={item.isWin ? {borderColor: '#e60012', background: '#fff0f0'} : {}}>
                            <span>{item.num}</span>
                            <span style={{fontSize: '0.95rem', color: '#666', marginTop: '0.2rem'}}>{item.prize > 0 ? `${item.prize} SUI` : '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <canvas
                ref={canvasRef}
                className={session.isFinished ? 'scratch-canvas hidden' : 'scratch-canvas'}
                aria-label={t.scratchBoard}
              />
            </div>
            
            <div className="scratch-progress-wrap" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scratchPercent)}>
              <span>{t.scratchProgress}: {Math.round(scratchPercent)}%</span>
              <div className="scratch-progress-fill" style={{ width: `${Math.min(100, Math.max(0, scratchPercent))}%` }} />
            </div>
            
            {!session.isFinished ? (
              <p className="hint">{scratchStatus}</p>
            ) : (
              <div className={`status-banner ${session.payoutSui > 0 ? 'win' : 'lose'}`}>
                {session.payoutSui > 0 ? (
                  <>
                    <div className="status-icon">🏆</div>
                    <div className="status-text">{locale === 'zh' ? '恭喜中獎！' : 'WINNER!'}</div>
                    <div className="status-prize">{session.payoutSui} SUI</div>
                  </>
                ) : (
                  <>
                    <div className="status-icon">💨</div>
                    <div className="status-text">{locale === 'zh' ? '未中獎' : 'No Prize'}</div>
                  </>
                )}
              </div>
            )}
            
            <div className="buy-row" style={{marginTop: '2rem'}}>
              {!session.isFinished ? (
                <>
                  <button 
                    onClick={scratchAll} 
                    className="secondary-btn"
                    disabled={session.isFinished}
                  >
                    {t.scratchAll}
                  </button>
                  <button 
                    className="secondary-btn"
                    onClick={() => { setIsModalOpen(false); setTimeout(() => setSession(null), 300); }} 
                  >
                    {locale === 'zh' ? '稍後刮卡 (關閉)' : 'Close'}
                  </button>
                </>
              ) : (
                <>
                  {session.payoutSui > 0 && !session.isClaimed ? (
                    <button 
                      className="primary-btn"
                      onClick={claimPrize} 
                      disabled={isExecuting}
                    >
                      {isExecuting ? '⏳' : t.claimPrize}
                    </button>
                  ) : (
                    <div style={{display: 'flex', gap: '1rem', width: '100%'}}>
                      <button 
                        className="secondary-btn"
                        onClick={() => { setIsModalOpen(false); setTimeout(() => setSession(null), 300); }} 
                        style={{flex: 1}}
                      >
                        {locale === 'zh' ? '回大廳' : 'Back to Market'}
                      </button>
                      <button 
                        className="primary-btn"
                        onClick={() => buyScratchCard(activeTicket)} 
                        disabled={isExecuting || !account}
                        style={{flex: 1}}
                      >
                        {isExecuting ? '⏳ processing...' : locale === 'zh' ? `再來一張 (${activeTicket.priceSui} SUI)` : `Play Again (${activeTicket.priceSui} SUI)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
