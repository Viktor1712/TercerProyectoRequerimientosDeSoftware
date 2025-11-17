// src/pages/ActivitiesPage.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import { Form, Button, Alert } from 'react-bootstrap'

export default function ActivitiesPage() {
  const { user, loading: authLoading } = useAuth()
  const [activities, setActivities] = useState([])
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_at: '',
    duration_minutes: '',
    location: '',
    virtual: false,
    required_level: '', // ahora es texto libre
    capacity: 1,
    community_id: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Cargar actividades y comunidades
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select(`id, title, description, start_at, duration_minutes, location, virtual, required_level, capacity, created_by, communities(name)`)
          .order('start_at', { ascending: true })
        if (activitiesError) throw activitiesError
        setActivities(activitiesData)

        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name')
          .order('created_at', { ascending: true })
        if (communitiesError) throw communitiesError
        setCommunities(communitiesData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const insertData = {
        ...formData,
        created_by: user.id
      }

      if (!formData.community_id) delete insertData.community_id

      const { error } = await supabase.from('activities').insert([insertData])
      if (error) throw error

      setSuccess('Actividad creada correctamente')
      setFormData({
        title: '',
        description: '',
        start_at: '',
        duration_minutes: '',
        location: '',
        virtual: false,
        required_level: '', // vacío de nuevo
        capacity: 1,
        community_id: ''
      })

      // Refrescar actividades
      const { data } = await supabase.from('activities')
        .select(`id, title, description, start_at, duration_minutes, location, virtual, required_level, capacity, created_by, communities(name)`)
        .order('start_at', { ascending: true })
      setActivities(data)
      setCreating(false)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading || authLoading) return <div className="text-center mt-5">Cargando actividades...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Actividades</h2>

      {user?.is_admin && (
        <div className="mb-3">
          <Button onClick={() => setCreating(!creating)}>
            {creating ? 'Cancelar' : 'Crear nueva actividad'}
          </Button>
        </div>
      )}

      {creating && user?.is_admin && (
        <Form onSubmit={handleSubmit} className="mb-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form.Group className="mb-2">
            <Form.Label>Título</Form.Label>
            <Form.Control name="title" value={formData.title} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Descripción</Form.Label>
            <Form.Control name="description" value={formData.description} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Fecha y hora de inicio</Form.Label>
            <Form.Control type="datetime-local" name="start_at" value={formData.start_at} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Duración (minutos)</Form.Label>
            <Form.Control type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Ubicación</Form.Label>
            <Form.Control name="location" value={formData.location} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Check type="checkbox" label="Virtual" name="virtual" checked={formData.virtual} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nivel requerido</Form.Label>
            <Form.Control
              type="text"
              name="required_level"
              value={formData.required_level}
              onChange={handleChange}
              placeholder="Escribe el nivel requerido"
              required
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Capacidad</Form.Label>
            <Form.Control type="number" name="capacity" value={formData.capacity} onChange={handleChange} min={1} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Comunidad (opcional)</Form.Label>
            <Form.Select name="community_id" value={formData.community_id} onChange={handleChange}>
              <option value="">Sin comunidad</option>
              {communities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button type="submit" className="mt-2">Crear actividad</Button>
        </Form>
      )}

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
