import CreateRestore from './pages/create-restore'
import ListAccounts from './pages/list-accounts'
import logo from './commons/assets/img/logo512.png'
import './app.css'

const App = ({appHasAccounts}) => {
  const Home = appHasAccounts ? ListAccounts : CreateRestore

  return (
    <main className="App">
      <img className="logo" src={logo} alt="Mojito logo" />
      <Home />
    </main>
  )
}

export default App
