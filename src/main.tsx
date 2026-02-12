import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import LoginPage from './pages/Login'

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <LoginPage />
    </React.StrictMode>
)
