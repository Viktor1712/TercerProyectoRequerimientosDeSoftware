// src/pages/CommunitiesPage.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import { Form, Button, Alert } from 'react-bootstrap'

// Función simple para generar slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
}

export default function CommunitiesPage() {
  const { user, loading: authLoading } = useAuth()

  const [communities, setCommunities] = useState([])
  const [userHobbies, setUserHobbies] = useState([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hobby_id: '',
    required_level: '' // nuevo
  })

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // =====================================================
  //   Cargar comunidades
  // =====================================================
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select(`
            id,
            name,
            description,
            slug,
            created_by,
            required_level,
            hobbies(name)
          `)
          .order('created_at')

        if (error) throw error
        setCommunities(data)
      } catch (err) {
        console.error(err)
      }
    }

    const fetchUserHobbies = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('user_hobbies')
        .select(`
          hobby_id,
          proficiency,
          hobbies(name)
        `)
        .eq('user_id', user.id)

      if (!error) setUserHobbies(data)
    }

    Promise.all([fetchCommunities(), fetchUserHobbies()]).finally(() =>
      setLoading(false)
    )
  }, [user])

  // =====================================================
  //   Manejar inputs
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // =====================================================
  //   Crear comunidad
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const insertData = {
        name: formData.name,
        description: formData.description,
        slug: generateSlug(formData.name),
        created_by: user.id,
        required_level: formData.required_level || null
      }

      if (formData.hobby_id) {
        insertData.hobby_id = formData.hobby_id
      }

      const { error } = await supabase.from('communities').insert([insertData])
      if (error) throw error

      setSuccess('Comunidad creada correctamente')
      setCreating(false)
      setFormData({ name: '', description: '', hobby_id: '', required_level: '' })

      // Refrescar comunidades
      const { data } = await supabase
        .from('communities')
        .select(`
          id, name, description, slug, created_by, required_level, hobbies(name)
        `)
        .order('created_at')

      setCommunities(data)
    } catch (err) {
      setError(err.message)
    }
  }

  // =====================================================
  //   Validación de nivel para unirse
  // =====================================================
  const userHasRequiredLevel = (required, userLevel) => {
    const ranking = {
      "principiante": 1,
      "intermedio": 2,
      "avanzado": 3
    }

    return ranking[userLevel] >= ranking[required]
  }

  // =====================================================
  //   Unirse a comunidad
  // =====================================================
  const joinCommunity = async (community) => {
    if (!user) return alert("Debes iniciar sesión.")

    const userHobby = userHobbies.find(h => h.hobby_id === community.hobby_id)

    if (community.required_level && userHobby) {
      if (!userHasRequiredLevel(community.required_level, userHobby.proficiency)) {
        return alert(
          `No cumples el nivel requerido. Se requiere: ${community.required_level}.`
        )
      }
    }

    try {
      const { error } = await supabase
        .from("community_roles")
        .insert({
          user_id: user.id,
          community_id: community.id,
          role: "miembro"
        })

      if (error) {
        if (error.code === "23505") {
          alert("Ya eres miembro de esta comunidad.")
        } else throw error
      } else {
        alert("Te has unido correctamente!")
      }

    } catch (err) {
      console.error(err)
      alert("Error al unirte.")
    }
  }

  if (loading || authLoading)
    return <div className="text-center mt-5">Cargando comunidades...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Comunidades</h2>

      {/* ADMIN */}
      {user?.is_admin && (
        <Button className="mb-3" onClick={() => setCreating(!creating)}>
          {creating ? "Cancelar" : "Crear nueva comunidad"}
        </Button>
      )}

      {/* FORMULARIO */}
      {creating && user?.is_admin && (
        <Form onSubmit={handleSubmit} className="mb-4">

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form.Group className="mb-2">
            <Form.Label>Nombre</Form.Label>
            <Form.Control name="name" value={formData.name} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Descripción</Form.Label>
            <Form.Control name="description" value={formData.description} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>ID de hobby</Form.Label>
            <Form.Control name="hobby_id" value={formData.hobby_id} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nivel requerido</Form.Label>
            <Form.Select name="required_level" value={formData.required_level} onChange={handleChange}>
              <option value="">Sin nivel</option>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </Form.Select>
          </Form.Group>

          <Button type="submit" className="mt-2">Crear comunidad</Button>
        </Form>
      )}

      {/* LISTA */}
      <div className="row">
        {communities.map(c => (
          <div key={c.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">

                <h5 className="card-title">{c.name}</h5>
                <p>{c.description}</p>
                <p className="text-muted">Hobby: {c.hobbies?.name || "Sin hobby"}</p>

                <p className="text-muted">
                  Nivel requerido: <strong>{c.required_level || "Ninguno"}</strong>
                </p>

                <Button className="mt-2" onClick={() => joinCommunity(c)}>
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