// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../supabaseClient'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [userHobbies, setUserHobbies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profileError) throw profileError
        setProfile(profileData)

        const { data: hobbiesData, error: hobbiesError } = await supabase
          .from('user_hobbies')
          .select('hobby_id, proficiency, hobbies(name)')
          .eq('user_id', user.id)
        if (hobbiesError) throw hobbiesError
        setUserHobbies(hobbiesData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  if (loading) return <div className="text-center mt-5">Cargando perfil...</div>

  if (!profile) return <div className="text-center mt-5">No se encontró el perfil</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Perfil de {profile.display_name || profile.username}</h2>
      <div className="card mb-4">
        <div className="card-body">
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Bio:</strong> {profile.bio || 'Sin bio'}</p>
          <p><strong>Avatar:</strong> {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" width={50} /> : 'Sin avatar'}</p>
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
