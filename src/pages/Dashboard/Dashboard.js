/* eslint-disable max-params */
import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { PopUp, AddWallet, TxRow, AssetRow } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { Account as AccountEntity } from '@Entities'

import {
  useExchangeRates,
  useBtcWalletInfo,
  useMlWalletInfo,
  useOneDayAgoExchangeRates,
} from '@Hooks'
import useOneDayAgoHist from 'src/hooks/UseOneDayAgoHist/useOneDayAgoHist'
import { NumbersHelper, ObjectHelpers, BTC, Transactions } from '@Helpers'

import {
  PageWrapper,
  Avatar,
  Counter,
  Eyebrow,
  Icon,
  LivePill,
  Seg,
} from '@BasicComponents'
const { adaptDesignTx } = Transactions

import { AppInfo } from '@Constants'

import styles from './Dashboard.module.css'

const DashboardPage = () => {
  const { addresses, accountName, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const [openConnectConfirmation, setOpenConnectConfirmation] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [account, setAccount] = useState(null)
  const [hideBalance, setHideBalance] = useState(false)
  const [tab, setTab] = useState('Tokens')

  const [connectedWalletType, setConnectedWalletType] = useState('')
  const {
    balance: btcBalance,
    fetchingBalances: btcFetchingBalances,
    btcApiAvailable,
    transactions: btcTransactions,
  } = useBtcWalletInfo()
  const {
    balance: mlBalance,
    tokenBalances,
    fetchingBalances: mlFetchingBalances,
    fetchingTokens: mlFetchingTokens,
    transactions: mlTransactions,
  } = useMlWalletInfo()
  const { exchangeRate: btcExchangeRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlExchangeRate } = useExchangeRates('ml', 'usd')
  const { yesterdayExchangeRate: btcYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('btc', 'usd')
  const { yesterdayExchangeRate: mlYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('ml', 'usd')
  const { historyRates: btcHistoryRates } = useOneDayAgoHist('btc', 'usd')
  const { historyRates: mlHistoryrates } = useOneDayAgoHist('ml', 'usd')
  const navigate = useNavigate()

  const yesterdayExchangeRateList = {
    btc: btcYesterdayExchangeRate,
    ml: mlYesterdayExchangeRate,
  }

  const cryptos = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: NumbersHelper.floatStringToNumber(btcBalance),
      exchangeRate: btcExchangeRate,
    },
    {
      name: 'Mintlayer',
      symbol: 'ML',
      balance: NumbersHelper.floatStringToNumber(mlBalance),
      exchangeRate: mlExchangeRate,
    },
  ]

  const { currentBalances, proportionDiffs, balanceDiffs } =
    BTC.calculateBalances(cryptos, yesterdayExchangeRateList)

  const stats = BTC.getStats(proportionDiffs, balanceDiffs, networkType)
  const stat = (name) => stats.find((s) => s.name === name)?.value ?? 0

  const getCryptoList = (addresses, network, tokenBalances) => {
    if (!addresses) return []
    const cryptos = []
    const addCrypto = (
      name,
      symbol,
      balance,
      exchangeRate,
      change24h,
      historyRates,
      network,
      id,
      fetchingBalances,
      disabled = false,
    ) => {
      cryptos.push({
        id,
        name,
        symbol,
        balance: NumbersHelper.floatStringToNumber(balance),
        exchangeRate,
        change24h,
        historyRates,
        network,
        fetchingBalances,
        disabled,
        type: 'coin',
      })
    }

    const addToken = (ticker, balance, id, fetchingBalances, isPlaceholder) => {
      cryptos.push({
        id,
        name: ticker,
        symbol: ticker,
        balance: NumbersHelper.floatStringToNumber(balance),
        exchangeRate: undefined,
        change24h: 0,
        historyRates: [],
        network: 'mintlayer',
        fetchingBalances,
        disabled: false,
        type: 'token',
        isPlaceholder,
      })
    }

    const btcAddress = addresses.btcAddresses
      ? BTC.getBtcAddressString(addresses.btcAddresses.btcReceivingAddresses[0])
      : false
    if (btcAddress) {
      // 24h change is only meaningful when yesterday's rate resolved.
      const change24h =
        network === AppInfo.NETWORK_TYPES.MAINNET && proportionDiffs.btc != null
          ? Number((proportionDiffs.btc - 1) * 100).toFixed(2)
          : 0
      addCrypto(
        'Bitcoin',
        'BTC',
        btcBalance,
        btcExchangeRate,
        change24h,
        btcHistoryRates,
        'bitcoin',
        'Bitcoin',
        btcFetchingBalances,
        !btcApiAvailable,
      )
    }

    const currentMlAddresses = addresses.mlAddresses
    const mlAddress =
      currentMlAddresses &&
      currentMlAddresses.mlReceivingAddresses &&
      currentMlAddresses.mlReceivingAddresses[0]

    const isTokensEmpty = ObjectHelpers.isObjEmpty(tokenBalances)

    if (mlAddress) {
      const change24h =
        network === AppInfo.NETWORK_TYPES.MAINNET && proportionDiffs.ml != null
          ? Number((proportionDiffs.ml - 1) * 100).toFixed(2)
          : 0
      addCrypto(
        'Mintlayer',
        'ML',
        mlBalance,
        mlExchangeRate,
        change24h,
        mlHistoryrates,
        'mintlayer',
        'Mintlayer',
        mlFetchingBalances,
      )
    }

    if (mlFetchingTokens && isTokensEmpty) {
      addToken('Token', 0, 'Mintlayer', mlFetchingTokens, true)
    }

    if (tokenBalances) {
      Object.keys(tokenBalances).forEach((token) => {
        addToken(
          tokenBalances[token].token_info.token_ticker.string,
          tokenBalances[token].balance,
          token,
          mlFetchingTokens,
        )
      })
    }

    return cryptos
  }

  const cryptoList = getCryptoList(addresses, networkType, tokenBalances)
  const coins = cryptoList.filter((c) => c.type === 'coin')
  const realTokens = cryptoList.filter(
    (c) => c.type === 'token' && !c.isPlaceholder,
  )
  const missingWalletTypes = AppInfo.walletTypes.filter(
    (walletType) =>
      !cryptoList.find((crypto) => crypto.name === walletType.name),
  )

  const coinAssets = coins
    .filter((c) => !c.isPlaceholder)
    .map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      chain: c.network === 'bitcoin' ? 'Bitcoin' : 'Mintlayer',
      amount: c.balance || 0,
      price: c.exchangeRate,
      change24h: Number(c.change24h) || 0,
      spark: Object.values(c.historyRates || {}),
      disabled: c.disabled,
    }))

  const onConnectItemClick = (walletType) => {
    setConnectedWalletType(walletType)
    setOpenConnectConfirmation(true)
    setAllowClosing(true)
  }

  const getCurrentAccount = async (accountID) => {
    const currentAccount = await AccountEntity.getAccount(accountID)
    return currentAccount
  }

  useEffect(() => {
    getCurrentAccount(accountID).then((account) => setAccount(account))
  }, [accountID])

  // Recent activity: real transactions first, a demo row as fallback.
  const adaptTx = (tx, sym, chain) => adaptDesignTx(tx, sym, chain)

  const recentTxs = [
    ...(btcTransactions || []).map((t) => adaptTx(t, 'BTC', 'Bitcoin')),
    ...(mlTransactions || []).map((t) => adaptTx(t, 'ML', 'Mintlayer')),
  ].slice(0, 3)

  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const renderAssetRow = (a, index) => (
    <div
      key={a.id}
      onClick={() => !a.disabled && navigate('/asset/' + a.id)}
      data-testid="crypto-item"
    >
      <div style={{ animationDelay: `${index * 50}ms` }}>
        <AssetRow a={a} />
      </div>
    </div>
  )

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div
        className={styles.page}
        data-testid="dashboard-page"
      >
        {/* Top bar: account + network + settings (design AppTop) */}
        <div className={styles.top}>
          <div
            className={styles.account}
            onClick={() => navigate('/settings')}
          >
            <Avatar
              name={accountName || 'M'}
              size={30}
            />
            <div className={styles.accountName}>{accountName}</div>
            <Icon
              name="chevron_r"
              size={12}
              color="var(--be-text-3)"
            />
          </div>
          <span
            className={`${styles.chip} ${isTestnet ? styles.chipAmber : styles.chipTeal}`}
            onClick={() => navigate('/settings')}
          >
            <span className={styles.dot} />
            {isTestnet ? 'Testnet' : 'Mainnet'}
          </span>
          <div
            className={styles.iconButton}
            onClick={() => navigate('/settings')}
          >
            <Icon
              name="settings"
              size={16}
            />
          </div>
        </div>

        <div className={styles.scroll}>
          {/* Total balance card */}
          <div className={styles.balanceCard}>
            <div
              className={styles.balanceHeader}
              onClick={() => setHideBalance(!hideBalance)}
            >
              <Eyebrow>Total balance</Eyebrow>
              <Icon
                name={hideBalance ? 'eye_off' : 'eye'}
                size={13}
                color="var(--be-text-2)"
              />
            </div>
            <div className={styles.balanceValue}>
              {hideBalance ? (
                '••••••'
              ) : (
                <>
                  <span className={styles.balanceSymbol}>$</span>
                  <Counter
                    value={currentBalances.total || 0}
                    decimals={2}
                  />
                </>
              )}
            </div>
            <div className={styles.balanceMeta}>
              <LivePill value={Number(stat('24h percent'))} />
              <span className={styles.fiat24h}>
                {hideBalance
                  ? '••••'
                  : `${Number(stat('24h fiat')) >= 0 ? '+' : '−'}$${Math.abs(
                      Number(stat('24h fiat')),
                    ).toFixed(2)}`}{' '}
                · 24h
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className={styles.quickActions}>
            <button
              onClick={() => navigate('/wallet/Mintlayer/send-ml-transaction')}
            >
              <Icon
                name="arrow_up"
                size={18}
              />
              <span>Send</span>
            </button>
            <button onClick={() => navigate('/receive')}>
              <Icon
                name="arrow_dn"
                size={18}
              />
              <span>Receive</span>
            </button>
            <button onClick={() => navigate('/staking')}>
              <Icon
                name="stake"
                size={18}
              />
              <span>Stake</span>
            </button>
            <button onClick={() => navigate('/activity')}>
              <Icon
                name="history"
                size={18}
                color="var(--be-teal)"
              />
              <span>Activity</span>
            </button>
          </div>

          {/* Assets */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Assets</span>
              <Seg
                value={tab}
                options={['Tokens', 'NFTs']}
                onChange={setTab}
              />
            </div>
            {tab === 'Tokens' ? (
              <div
                className={styles.card}
                data-testid="crypto-list"
              >
                {coinAssets.map((a, i) => renderAssetRow(a, i))}

                {realTokens.map((c, i) =>
                  renderAssetRow(
                    {
                      id: c.id,
                      name: c.name,
                      symbol: c.symbol,
                      chain: 'Mintlayer',
                      amount: c.balance || 0,
                      spark: [],
                      iconUri:
                        tokenBalances[c.id]?.token_info?.icon_uri?.string,
                    },
                    coinAssets.length + i,
                  ),
                )}

                {missingWalletTypes.map((walletType) => (
                  <div
                    key={walletType.name}
                    className={styles.addRow}
                    onClick={() => onConnectItemClick(walletType)}
                    data-testid="connect-item"
                  >
                    <Icon
                      name="plus"
                      size={18}
                      color="var(--be-amber)"
                    />
                    <span>Add {walletType.name} wallet</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.nftGrid}>
                {/* Real NFT rendering is a pending follow-up (see
                    REVIEW-PLAN.md): the provider exposes `nftData`. */}
                <div className={styles.empty}>
                  No NFTs yet — NFTs owned by this wallet will show here.
                </div>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Recent activity</span>
              <span
                className={styles.seeAll}
                onClick={() => navigate('/activity')}
              >
                See all →
              </span>
            </div>
            <div className={styles.card}>
              {recentTxs.length ? (
                recentTxs.map((t, i) => (
                  <TxRow
                    key={i}
                    t={t}
                  />
                ))
              ) : (
                <div className={styles.empty}>
                  No activity yet — transactions will show here.
                </div>
              )}
            </div>
          </div>
        </div>

        {openConnectConfirmation && (
          <PopUp
            setOpen={setOpenConnectConfirmation}
            allowClosing={allowClosing}
          >
            <AddWallet
              account={account}
              walletType={connectedWalletType}
              setAllowClosing={setAllowClosing}
              setOpenConnectConfirmation={setOpenConnectConfirmation}
            />
          </PopUp>
        )}
      </div>
    </PageWrapper>
  )
}

export default DashboardPage
