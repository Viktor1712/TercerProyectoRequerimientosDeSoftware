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

// Convierte niveles a ranking numérico para comparar
const levelRank = {
  principiante: 1,
  intermedio: 2,
  avanzado: 3
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
    required_level: ''
  })

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // =====================================================
  //   Cargar comunidades y, si hay usuario, sus hobbies
  // =====================================================
  useEffect(() => {
    let mounted = true

    const fetchAll = async () => {
      try {
        // 1) cargar comunidades
        const { data: commData, error: commError } = await supabase
          .from('communities')
          .select(`
            id,
            name,
            description,
            slug,
            created_by,
            required_level,
            hobby_id,
            hobbies ( name )
          `)
          .order('created_at', { ascending: true })

        if (commError) throw commError
        if (!mounted) return
        setCommunities(commData || [])

        // 2) si hay usuario, cargar sus hobbies (proficiency)
        if (user) {
          const { data: uhData, error: uhError } = await supabase
            .from('user_hobbies')
            .select('hobby_id, proficiency, hobbies(name)')
            .eq('user_id', user.id)

          if (uhError) {
            console.warn('No se pudieron obtener user_hobbies:', uhError)
            // no throw para no romper la UI
          } else {
            if (!mounted) return
            setUserHobbies(uhData || [])
          }
        } else {
          // si no hay usuario, vaciar array
          setUserHobbies([])
        }
      } catch (err) {
        console.error('Error cargando comunidades / hobbies:', err)
        setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    setLoading(true)
    fetchAll()

    return () => { mounted = false }
  }, [user])

  // =====================================================
  //   Manejar inputs
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // =====================================================
  //   Crear comunidad (admin)
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!user) { setError('Debes iniciar sesión'); return }

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

      const { error: insertError } = await supabase.from('communities').insert([insertData])
      if (insertError) throw insertError

      setSuccess('Comunidad creada correctamente')
      setCreating(false)
      setFormData({ name: '', description: '', hobby_id: '', required_level: '' })

      // refrescar lista
      const { data } = await supabase
        .from('communities')
        .select(`id, name, description, slug, created_by, required_level, hobby_id, hobbies(name)`)
        .order('created_at', { ascending: true })
      setCommunities(data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || String(err))
    }
  }

  // =====================================================
  //   Validación de nivel para unirse
  // =====================================================
  function userHasRequiredLevel(required, userLevel) {
    if (!required) return true // si la comunidad no exige nivel
    if (!userLevel) return false // no tiene nivel declarado
    const r = levelRank[required] ?? 0
    const u = levelRank[userLevel] ?? 0
    return u >= r
  }

  // =====================================================
  //   Unirse a comunidad
  // =====================================================
  const joinCommunity = async (community) => {
    if (!user) return alert('Debes iniciar sesión.')

    // Si la comunidad está ligada a un hobby, verifica que el usuario tenga ese hobby
    if (community.hobby_id) {
      const owned = userHobbies.find(h => h.hobby_id === community.hobby_id)
      if (!owned) {
        return alert('Para unirte debes primero indicar que practicas ese hobby.')
      }
      // si la comunidad exige nivel, comparar
      if (community.required_level) {
        if (!userHasRequiredLevel(community.required_level, owned.proficiency)) {
          return alert(`No cumples el nivel requerido (${community.required_level}). Tu nivel: ${owned.proficiency}.`)
        }
      }
    } else {
      // comunidad no ligada a hobby: si exige nivel, sólo comprobar si user tiene ANY hobby with sufficient level? 
      // decisión: si comunidad no tiene hobby_id pero sí required_level, exigimos que el usuario tenga al menos un hobby con ese nivel
      if (community.required_level) {
        const ok = userHobbies.some(h => userHasRequiredLevel(community.required_level, h.proficiency))
        if (!ok) {
          return alert(`Esta comunidad requiere nivel ${community.required_level}. No tienes un hobby con ese nivel.`)
        }
      }
    }

    // Intentar insertar rol
    try {
      const { error } = await supabase
        .from('community_roles')
        .insert({
          user_id: user.id,
          community_id: community.id,
          role: 'miembro'
        })

      if (error) {
        // 23505 = unique violation (ya miembro)
        if (error.code === '23505') {
          return alert('Ya eres miembro de esta comunidad.')
        }
        throw error
      }

      alert('Te has unido correctamente!')
      // opcional: refrescar lista de roles/hobbies si hace falta
    } catch (err) {
      console.error('Error al unirse:', err)
      alert('Ocurrió un error al intentar unirte: ' + (err.message || err))
    }
  }

  if (loading || authLoading) return <div className="text-center mt-5">Cargando comunidades...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Comunidades</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* ADMIN */}
      {user?.is_admin && (
        <Button className="mb-3" onClick={() => setCreating(!creating)}>
          {creating ? 'Cancelar' : 'Crear nueva comunidad'}
        </Button>
      )}

      {/* FORMULARIO */}
      {creating && user?.is_admin && (
        <Form onSubmit={handleSubmit} className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>Nombre</Form.Label>
            <Form.Control name="name" value={formData.name} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Descripción</Form.Label>
            <Form.Control name="description" value={formData.description} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>ID de hobby (opcional)</Form.Label>
            <Form.Control name="hobby_id" value={formData.hobby_id} onChange={handleChange} />
            <Form.Text className="text-muted">Dejar vacío si la comunidad no está ligada a un hobby concreto.</Form.Text>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nivel requerido (opcional)</Form.Label>
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
                <p className="card-text">{c.description}</p>
                <p className="text-muted">Hobby: {c.hobbies?.name || 'Sin hobby asignado'}</p>
                <p className="text-muted">Nivel requerido: <strong>{c.required_level || 'Ninguno'}</strong></p>

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
