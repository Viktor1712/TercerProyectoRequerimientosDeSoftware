// src/App.jsx
import React from 'react'
import AppRouter from './routes/AppRouter.jsx'
import Navbar from './components/Navbar.jsx'

export default function App() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="container py-4">
        <AppRouter />
      </main>
      <footer className="bg-dark text-light text-center py-3 mt-auto">
        &copy; 2025 HobbyHub - Todos los derechos reservados
      </footer>
    </>
  )
}
