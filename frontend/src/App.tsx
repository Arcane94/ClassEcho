import './App.css'
import './index.css'
import './assets/styles/variables.css'
import ObservationScreen from './ObservationScreen'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './LoginScreen'
import CreateAccountScreen from './CreateAccountScreen'
import SessionOptionsScreen from './SessionOptionsScreen'
import JoinExistingSessionScreen from './JoinExistingSessionScreen'
import CreateNewSessionScreen from './CreateNewSessionScreen'
import CustomizeSessionScreen from './CustomizeSessionScreen'
import ObservationSessionScreen from './ObservationSessionScreen'
import ViewSessionsScreen from './ViewSessionsScreen'
import ForgotPasswordScreen from './ForgotPassword'
import ResetPasswordScreen from './ResetPassword'
import ManageSessionsScreen from './ManageSessionsScreen'
import ManageIndividualSessionScreen from './ManageIndividualSessionScreen'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/signup" element={<CreateAccountScreen />} />
        <Route path="/observation" element={<ObservationScreen />} />
        <Route path="/observation-session" element={<ObservationSessionScreen />} />
        <Route path="/session-options" element={<SessionOptionsScreen />} />
        <Route path="/join-existing" element={<JoinExistingSessionScreen />} />
        <Route path="/create-new" element={<CreateNewSessionScreen />} />
        <Route path="/customize-session" element={<CustomizeSessionScreen />} />
        <Route path="/view-sessions" element={<ViewSessionsScreen />} />
        <Route path="/manage-sessions" element={<ManageSessionsScreen />} />
        <Route path="/manage-session" element={<ManageIndividualSessionScreen />} />
      </Routes>
    </Router>
  )
}

export default App
