import { Routes, Route } from 'react-router-dom'
import { RegistrationProvider } from '../contexts/RegistrationContext'
import HomePage from '../pages/auth/HomePage'

function AuthRoutes() {
  return (
    <RegistrationProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </RegistrationProvider>
  )
}

export default AuthRoutes