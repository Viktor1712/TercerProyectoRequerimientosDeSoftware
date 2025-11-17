// src/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export default function Home() {
  const [hobbies, setHobbies] = useState([])
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: hobbiesData } = await supabase.from('hobbies').select('*')
        const { data: communitiesData } = await supabase.from('communities').select('*')
        setHobbies(hobbiesData)
        setCommunities(communitiesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="text-center mt-5">Cargando...</div>

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Bienvenido a HobbyHub</h1>

      <h3>Hobbies disponibles</h3>
      <div className="row mb-4">
        {hobbies.map(hobby => (
          <div key={hobby.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{hobby.name}</h5>
                <p className="card-text">{hobby.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3>Comunidades</h3>
      <div className="row">
        {communities.map(com => (
          <div key={com.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{com.name}</h5>
                <p className="card-text">{com.description}</p>
                <Link to={`/communities`} className="btn btn-primary btn-sm">
                  Ver Comunidad
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
