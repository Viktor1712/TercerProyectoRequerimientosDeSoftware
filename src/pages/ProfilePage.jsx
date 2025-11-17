import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../supabaseClient'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [userHobbies, setUserHobbies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchHobbies = async () => {
      try {
        const { data, error } = await supabase
          .from('user_hobbies')
          .select('hobby_id, proficiency, hobbies(name)')
          .eq('user_id', user.id)
        if (error) throw error
        setUserHobbies(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHobbies()
  }, [user])

  if (loading || authLoading) return <div className="text-center mt-5">Cargando perfil...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Perfil de {user.display_name || user.username}</h2>
      <div className="card mb-4">
        <div className="card-body">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Bio:</strong> {user.bio || 'Sin bio'}</p>
          <p><strong>Avatar:</strong> {user.avatar_url ? <img src={user.avatar_url} alt="avatar" width={50} /> : 'Sin avatar'}</p>
          <p><strong>Admin:</strong> {user.is_admin ? 'Sí' : 'No'}</p>
        </div>
      </div>

      <h4>Hobbies</h4>
      {userHobbies.length === 0 && <p>No tienes hobbies registrados.</p>}
      <ul className="list-group">
        {userHobbies.map(h => (
          <li key={h.hobby_id} className="list-group-item d-flex justify-content-between align-items-center">
            {h.hobbies?.name || 'Hobby desconocido'}
            <span className="badge bg-primary rounded-pill">{h.proficiency}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
