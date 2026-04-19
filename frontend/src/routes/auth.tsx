import { Routes, Route } from 'react-router-dom'
import { RegistrationProvider } from '../contexts/RegistrationContext'
import HomePage from '../pages/auth/HomePage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

function AuthRoutes() {
  return (
    <RegistrationProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </RegistrationProvider>
  )
}

export default AuthRoutes