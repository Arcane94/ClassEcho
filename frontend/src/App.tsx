import './App.css'
import './index.css'
import './assets/variables.css'
import StartForm from './StartForm'
import ObservationScreen from './ObservationScreen'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartForm />} />
        <Route path="/observation" element={<ObservationScreen />} />
      </Routes>
    </Router>
  )
}

export default App
