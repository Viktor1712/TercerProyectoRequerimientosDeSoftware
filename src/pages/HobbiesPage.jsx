// src/pages/HobbiesPage.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'

export default function HobbiesPage() {
  const { user } = useAuth()
  const [userHobbies, setUserHobbies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchHobbies = async () => {
      try {
        const { data, error } = await supabase
          .from('user_hobbies')
          .select('id, proficiency, hobbies(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
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

  if (!user) return <div className="text-center mt-5">Debes iniciar sesión</div>
  if (loading) return <div className="text-center mt-5">Cargando tus hobbies...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Mis Hobbies</h2>
      <div className="list-group">
        {userHobbies.length === 0 && <div className="alert alert-info">No tienes hobbies registrados</div>}
        {userHobbies.map(uh => (
          <div key={uh.id} className="list-group-item d-flex justify-content-between align-items-center">
            {uh.hobbies.name}
            <span className="badge bg-primary rounded-pill">{uh.proficiency}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
