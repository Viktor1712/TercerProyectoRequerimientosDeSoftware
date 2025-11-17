// src/pages/CommunitiesPage.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select(`
            id, name, description, created_by, hobbies(name)
          `)
          .order('created_at', { ascending: true })
        if (error) throw error
        setCommunities(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCommunities()
  }, [])

  if (loading) return <div className="text-center mt-5">Cargando comunidades...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Comunidades</h2>
      <div className="row">
        {communities.map(c => (
          <div key={c.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{c.name}</h5>
                <p className="card-text">{c.description}</p>
                <p className="text-muted">Hobby: {c.hobbies?.name || 'Sin hobby asignado'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
