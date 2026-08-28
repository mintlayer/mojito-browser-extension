import CreateAccount from './CreateAccount/CreateAccount.tsx'
import RestoreAccountMnemonic from './RestoreAccount/RestoreAccountMnemonic/RestoreAccountMnemonic'
import RestoreAccountJson from './RestoreAccount/RestoreAccountJson/RestoreAccountJson'

import LoginContainer from './Login/Login.tsx'
import SetPassword from './Login/SetPassword.tsx'

import ShowAddress from './Wallet/ShowAddress'
import Transaction from './Wallet/Transaction'
import TransactionButton from './Wallet/TransactionButton'
import TransactionDetails from './Wallet/TransactionDetails'
import TransactionsList from './Wallet/TransactionsList'
import TransactionAmount from './Wallet/TransactionAmount'

import NftList from './Wallet/Nft/NftList'

import DelegationList from './Wallet/Delegation/DelegationList'
import DelegationDetails from './Wallet/Delegation/DelegationDetails'

import OrderList from './Wallet/Orders/OrderList/OrderList'
import OrderDetails from './Wallet/Orders/OrderDetails/OrderDetails'

import SendBtcTransaction from './SendTransaction/SendBtcTransaction'
import SendMlTransaction from './SendTransaction/SendMlTransaction'

import CryptoSharesChart from './Dashboard/CryptoSharesChart'
import Statistics from './Dashboard/Statistics'
import CryptoList from './Dashboard/CryptoList'

import DeleteAccount from './DeleteAccount/DeleteAccount'
import SettingsDelete from './Settings/SettingsDelete/SettingsDelete'
import SettingsTestnet from './Settings/SettingsTestnet/SettingsTestnet.tsx'
import SettingsAbout from './Settings/SettingsAbout/SettingsAbout.tsx'
import SettingsBackup from './Settings/SettingsBackup/SettingsBackup'
import SettingsSection from './Settings/SettingsSection/SettingsSection.tsx'
import SettingsConnections from './Settings/SettingsConnections/SettingsConnections.tsx'

import SignMessage from './Message/SignMessage/SignMessage'
import VerifyMessage from './Message/VerifyMessage/VerifyMessage'

import ExternalTransactionPreview from './SignTransaction/ExternalTransactionPreview/ExternalTransactionPreview'
import InternalTransactionPreview from './SignTransaction/InternalTransactionPreview/InternalTransactionPreview'
import JsonPreview from './SignTransaction/JsonPreview/JsonPreview'

/* istanbul ignore next */
const Wallet = {
  ShowAddress,
  Transaction,
  TransactionButton,
  TransactionAmount,
  TransactionDetails,
  TransactionsList,
  DelegationList,
  DelegationDetails,
  NftList,
  OrderList,
  OrderDetails,
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
  SettingsAbout,
  SettingsTestnet,
  SettingsDelete,
  SettingsBackup,
  SettingsSection,
  SettingsConnections,
}

const RestoreAccount = {
  RestoreAccountMnemonic,
  RestoreAccountJson,
}

const Message = {
  SignMessage,
  VerifyMessage,
}

const SignTransaction = {
  ExternalTransactionPreview,
  InternalTransactionPreview,
  JsonPreview,
}

export {
  CreateAccount,
  RestoreAccount,
  DeleteAccount,
  Wallet,
  Login,
  SendBtcTransaction,
  SendMlTransaction,
  Dashboard,
  Settings,
  Message,
  SignTransaction,
}
