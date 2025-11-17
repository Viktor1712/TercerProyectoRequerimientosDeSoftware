// src/pages/ActivitiesPage.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select(`
            id, title, description, start_at, duration_minutes, location, virtual, required_level, capacity, created_by, communities(name)
          `)
          .order('start_at', { ascending: true })
        if (error) throw error
        setActivities(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  if (loading) return <div className="text-center mt-5">Cargando actividades...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Actividades</h2>
      {activities.length === 0 && <div className="alert alert-info">No hay actividades disponibles</div>}
      <div className="row">
        {activities.map(a => (
          <div key={a.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{a.title}</h5>
                <p className="card-text">{a.description}</p>
                <p className="text-muted">Comunidad: {a.communities?.name || 'Sin comunidad'}</p>
                <p className="text-muted">Inicio: {new Date(a.start_at).toLocaleString()}</p>
                <p className="text-muted">Nivel requerido: {a.required_level}</p>
                <p className="text-muted">Capacidad: {a.capacity}</p>
                <p className="text-muted">{a.virtual ? 'Virtual' : 'Presencial'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
