import logo from './logo.svg';
import './App.css';
import Header from './components/header';
import Analyzer from './pages/analyzer';
import YandexGPTForm from './components/YandexGPTForm';
function App() {
  return (
    <div className="App">
      <Header />
      <Analyzer />
    </div>
  );
}

export default App;
