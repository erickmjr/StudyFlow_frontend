import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './style.css'
import LoginPage from './pages/Login'
import SignUpPage from './pages/SignUp'
import MyAccountPage from './pages/MyAccount'
import TopicsPage from './pages/Topics'
import ForgotPsswdPage from './pages/ForgotPsswd'
import ResetPsswdPage from './pages/ResetPsswd'

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPsswdPage />} />
                <Route path="/reset-password" element={<ResetPsswdPage />} />
                <Route path="/my-account" element={<MyAccountPage />} />
                <Route path="/topics" element={<TopicsPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
