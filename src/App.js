import CreateRestore from './pages/create-restore'
import ListAccounts from './pages/list-accounts'

const App = ({appHasAccounts}) => {
  const Home = appHasAccounts ? ListAccounts : CreateRestore
  
  return (
    <main className="App">
      <Home />
    </main>
  )
}

export default App
