import { Routes, Route } from 'react-router-dom'
import { RegistrationProvider } from '../contexts/RegistrationContext'
import HomePage from '../pages/auth/HomePage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import RegistrationCompletePage from '../pages/auth/RegistrationCompletePage'

function AuthRoutes() {
  return (
    <RegistrationProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/registration-complete" element={<RegistrationCompletePage />} />
      </Routes>
    </RegistrationProvider>
  )
}

export default AuthRoutes