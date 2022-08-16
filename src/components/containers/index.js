import CreateAccount from './CreateAccount/CreateAccount'
import RestoreAccount from './RestoreAccount/RestoreAccount'

import LoginContainer from './Login/Login'
import SetPassword from './Login/SetPassword'

import ShowAddress from './Wallet/ShowAddress'
import Transaction from './Wallet/Transaction'
import TransactionButton from './Wallet/TransactionButton'
import TransactionDetails from './Wallet/TransactionDetails'
import TransactionsList from './Wallet/TransactionsList'

import SendTransaction from './SendTransaction/SendTransaction'

import CryptoSharesChart from './Dashboard/CryptoSharesChart'
import Statistics from './Dashboard/Statistics'

/* istanbul ignore next */
const Wallet = {
  ShowAddress,
  Transaction,
  TransactionButton,
  TransactionDetails,
  TransactionsList,
}

/* istanbul ignore next */
const Login = {
  Login: LoginContainer,
  SetPassword,
}

/* istanbul ignore next */
const Dashboard = {
  CryptoSharesChart,
  Statistics,
}

export {
  CreateAccount,
  RestoreAccount,
  Wallet,
  Login,
  SendTransaction,
  Dashboard,
}
