// src/routes/AppRouter.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import ProfilePage from '../pages/ProfilePage.jsx'
import HobbiesPage from '../pages/HobbiesPage.jsx'
import CommunitiesPage from '../pages/CommunitiesPage.jsx'
import ActivitiesPage from '../pages/ActivitiesPage.jsx'
import ModerationPage from '../pages/ModerationPage.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function AppRouter() {
  const { session, loading } = useAuth()

  if (loading) return <div className="text-center mt-5">Cargando...</div>

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/" />} />
      <Route path="/hobbies" element={session ? <HobbiesPage /> : <Navigate to="/auth" />} />
      <Route path="/communities" element={session ? <CommunitiesPage /> : <Navigate to="/auth" />} />
      <Route path="/activities" element={session ? <ActivitiesPage /> : <Navigate to="/auth" />} />
      <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/auth" />} />
      <Route path="/moderation" element={session ? <ModerationPage /> : <Navigate to="/auth" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
