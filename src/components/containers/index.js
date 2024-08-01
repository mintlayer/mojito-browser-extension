import CreateAccount from './CreateAccount/CreateAccount'
import RestoreAccount from './RestoreAccount/RestoreAccount'

import LoginContainer from './Login/Login'
import SetPassword from './Login/SetPassword'

import ShowAddress from './Wallet/ShowAddress'
import Transaction from './Wallet/Transaction'
import TransactionButton from './Wallet/TransactionButton'
import TransactionDetails from './Wallet/TransactionDetails'
import TransactionsList from './Wallet/TransactionsList'

import DelegationList from './Wallet/DelegationList'
import DelegationDetails from './Wallet/DelegationDetails'

import SendTransaction from './SendTransaction/SendTransaction'

import CryptoSharesChart from './Dashboard/CryptoSharesChart'
import Statistics from './Dashboard/Statistics'
import CryptoList from './Dashboard/CryptoList'

import DeleteAccount from './DeleteAccount/DeleteAccount'
import SettingsDelete from './Settings/SettingsDelete/SettingsDelete'
import SettingsTestnet from './Settings/SettingsTestnet/SettingsTestnet'
import SettingsAPI from './Settings/SettingsAPI/SettingsAPI'

/* istanbul ignore next */
const Wallet = {
  ShowAddress,
  Transaction,
  TransactionButton,
  TransactionDetails,
  TransactionsList,
  DelegationList,
  DelegationDetails,
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
  CryptoList,
}

const Settings = {
  SettingsTestnet,
  SettingsDelete,
  SettingsAPI,
}

export {
  CreateAccount,
  RestoreAccount,
  DeleteAccount,
  Wallet,
  Login,
  SendTransaction,
  Dashboard,
  Settings,
}
