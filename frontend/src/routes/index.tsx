import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";


export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}