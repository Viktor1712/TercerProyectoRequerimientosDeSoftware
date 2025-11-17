// src/pages/CommunitiesPage.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import { Form, Button, Alert } from 'react-bootstrap'

// Función simple para generar un slug a partir del nombre
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // espacios por guiones
    .replace(/[^\w\-]+/g, '') // eliminar caracteres no válidos
}

export default function CommunitiesPage() {
  const { user, loading: authLoading } = useAuth()
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hobby_id: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Cargar comunidades
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select(`id, name, description, slug, created_by, hobbies(name)`)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const insertData = {
        name: formData.name,
        description: formData.description,
        slug: generateSlug(formData.name),
        created_by: user.id
      }

      if (formData.hobby_id) insertData.hobby_id = formData.hobby_id

      const { error } = await supabase.from('communities').insert([insertData])
      if (error) throw error

      setSuccess('Comunidad creada correctamente')
      setFormData({ name: '', description: '', hobby_id: '' })
      setCreating(false)

      // Refrescar lista de comunidades
      const { data } = await supabase
        .from('communities')
        .select(`id, name, description, slug, created_by, hobbies(name)`)
        .order('created_at', { ascending: true })
      setCommunities(data)
    } catch (err) {
      setError(err.message)
    }
  }

// ================================
// 🚀 FUNCION PARA UNIRSE A COMUNIDAD
// ================================
const joinCommunity = async (communityId) => {
  if (!user) {
    alert("Debes iniciar sesión para unirte.");
    return;
  }

  try {
    const { error } = await supabase
      .from("community_roles")
      .insert({
        user_id: user.id,
        community_id: communityId,
        role: "miembro"
      });

    if (error) {
      if (error.code === "23505") {
        alert("Ya eres miembro de esta comunidad.");
      } else {
        console.error(error);
        throw error;
      }
    } else {
      alert("Te has unido correctamente.");
    }

  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al unirte.");
  }
};


  if (loading || authLoading) return <div className="text-center mt-5">Cargando comunidades...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Comunidades</h2>

      {user?.is_admin && (
        <div className="mb-3">
          <Button onClick={() => setCreating(!creating)}>
            {creating ? 'Cancelar' : 'Crear nueva comunidad'}
          </Button>
        </div>
      )}

      {creating && user?.is_admin && (
        <Form onSubmit={handleSubmit} className="mb-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form.Group className="mb-2">
            <Form.Label>Nombre de la comunidad</Form.Label>
            <Form.Control name="name" value={formData.name} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Descripción</Form.Label>
            <Form.Control name="description" value={formData.description} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>ID de hobby (opcional)</Form.Label>
            <Form.Control name="hobby_id" value={formData.hobby_id} onChange={handleChange} />
          </Form.Group>

          <Button type="submit" className="mt-2">Crear comunidad</Button>
        </Form>
      )}

      <div className="row">
        {communities.map(c => (
          <div key={c.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{c.name}</h5>
                <p className="card-text">{c.description}</p>
                <p className="text-muted">Hobby: {c.hobbies?.name || 'Sin hobby asignado'}</p>

                {/* BOTON PARA UNIRSE */}
                <Button onClick={() => joinCommunity(c.id)}>
                  Unirse
                </Button>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
