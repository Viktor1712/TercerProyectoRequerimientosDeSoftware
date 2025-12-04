import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Navbar() {
  const { session, user, signOut, loading } = useAuth()

  if (loading) return <div className="text-center mt-5">Cargando usuario...</div>

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">HobbyHub</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink className="nav-link" to="/hobbies">Hobbies</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/communities">Comunidades</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/activities">Actividades</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/announcements">Avisos</NavLink></li>

            {/* Solo los admins ven este link */}
            {user?.is_admin && (
              <li className="nav-item"><NavLink className="nav-link" to="/moderation">Moderación</NavLink></li>
            )}
          </ul>

          <ul className="navbar-nav ms-auto">
            {session ? (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/profile">Perfil</NavLink></li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm" onClick={signOut}>Cerrar sesión</button>
                </li>
              </>
            ) : (
              <li className="nav-item"><NavLink className="nav-link" to="/auth">Ingresar</NavLink></li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
