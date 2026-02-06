import './App.css'
import './index.css'
import './assets/variables.css'
import StartForm from './StartForm'
import ObservationScreen from './ObservationScreen'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './LoginScreen'
import CreateAccountScreen from './CreateAccountScreen'
import SessionOptionsScreen from './SessionOptionsScreen'
import JoinExistingSessionScreen from './JoinExistingSessionScreen'
import CreateNewSessionScreen from './CreateNewSessionScreen'
import CustomizeSessionScreen from './CustomizeSessionScreen'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/signup" element={<CreateAccountScreen />} />
        <Route path="/observation" element={<ObservationScreen />} />
        <Route path="/session-options" element={<SessionOptionsScreen />} />
        <Route path="/join-existing" element={<JoinExistingSessionScreen />} />
        <Route path="/create-new" element={<CreateNewSessionScreen />} />
        <Route path="/customize-session" element={<CustomizeSessionScreen />} />
      </Routes>
    </Router>
  )
}

export default App
