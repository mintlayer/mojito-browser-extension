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

export { CreateAccount, RestoreAccount, Wallet, Login, SendTransaction }
