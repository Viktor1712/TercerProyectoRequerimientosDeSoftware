// src/pages/AnnouncementsPage.jsx
import React, { useEffect, useState } from 'react'
import { Modal, Button, Form, Alert, Badge, Card } from 'react-bootstrap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'

export default function AnnouncementsPage() {
  const { session, user: authUser, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null) // perfil desde tabla profiles
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    scope: 'all', // all | community | activity
    target_name: '',
    priority: 'normal', // low | normal | high | urgent
  })

  // cargar perfil (para is_admin, display_name)
  useEffect(() => {
    if (!authUser) {
      setProfile(null)
      return
    }

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, username, is_admin')
          .eq('id', authUser.id)
          .single()

        if (error && error.code !== 'PGRST116') { // some projects may not have profile row
          throw error
        }
        setProfile(data ?? null)
      } catch (err) {
        console.error('Error cargando perfil:', err)
      }
    }

    loadProfile()
  }, [authUser])

  // cargar avisos desde la tabla notifications
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, user_id, title, body, data, read, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        setAnnouncements(data || [])
      } catch (err) {
        console.error('Error cargando avisos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()

    // opcional: suscribirse a cambios en notifications para actualizar en tiempo real
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        // recargar lista - aquí hacemos fetch simple al recibir cambios
        fetchAnnouncements()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const canCreate = () => {
    return profile?.is_admin === true
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (!canCreate()) {
      setMessage({ type: 'danger', text: 'No tienes permisos para crear avisos.' })
      return
    }
    if (!formData.title.trim() || !formData.body.trim()) {
      setMessage({ type: 'danger', text: 'Título y mensaje son requeridos.' })
      return
    }

    try {
      const insertRow = {
        user_id: authUser.id,
        title: formData.title,
        body: formData.body,
        data: {
          scope: formData.scope,
          target_name: formData.target_name || null,
          priority: formData.priority
        },
        read: false
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([insertRow])
        .select() // devolver fila insertada

      if (error) throw error

      setMessage({ type: 'success', text: 'Aviso publicado correctamente.' })
      setShowModal(false)
      setFormData({ title: '', body: '', scope: 'all', target_name: '', priority: 'normal' })

      // actualizar lista localmente (la suscripción también actualizará)
      setAnnouncements(prev => [ ...(data ?? []), ...prev ])
    } catch (err) {
      console.error('Error creando aviso:', err)
      setMessage({ type: 'danger', text: err.message || 'Error creando aviso' })
    }
  }

  const handleDelete = async (id) => {
    if (!profile?.is_admin) {
      alert('No tienes permisos para eliminar este aviso.')
      return
    }
    if (!window.confirm('¿Eliminar este aviso?')) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAnnouncements(prev => prev.filter(a => a.id !== id))
      setMessage({ type: 'success', text: 'Aviso eliminado.' })
    } catch (err) {
      console.error('Error eliminando aviso:', err)
      setMessage({ type: 'danger', text: err.message || 'Error al eliminar aviso' })
    }
  }

  if (authLoading || loading) return <div className="text-center mt-5">Cargando...</div>
  if (!authUser) return <div className="text-center mt-5">Debes iniciar sesión para ver los avisos</div>

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low': return 'secondary'
      case 'normal': return 'primary'
      case 'high': return 'warning'
      case 'urgent': return 'danger'
      default: return 'primary'
    }
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📢 Avisos</h2>
        {canCreate() && (
          <Button onClick={() => setShowModal(true)}>+ Nuevo Aviso</Button>
        )}
      </div>

      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>
      )}

      <div className="row">
        {announcements.length === 0 && (
          <div className="col-12">
            <Alert variant="info">No hay avisos aún.</Alert>
          </div>
        )}

        {announcements.map(a => {
          const priority = (a.data && a.data.priority) || 'normal'
          const scopeText = a.data?.scope === 'all' 
            ? 'Global' 
            : (a.data?.scope === 'community' 
                ? `Comunidad: ${a.data?.target_name || 'N/A'}` 
                : `Actividad: ${a.data?.target_name || 'N/A'}`)

          return (
            <div className="col-12 mb-3" key={a.id}>
              <Card 
                className={`border-${getPriorityBadge(priority)}`} 
                style={{ borderLeftWidth: 6 }}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="mb-1">{a.title}</h5>
                      <small className="text-muted">
                        Por: {a.user_id} • {new Date(a.created_at).toLocaleString()}
                      </small>
                      <div className="mt-1">
                        <Badge bg={getPriorityBadge(priority)} className="me-2">
                          {priority}
                        </Badge>
                        <small className="text-muted">{scopeText}</small>
                      </div>
                    </div>

                    <div>
                      {(profile?.is_admin || a.user_id === authUser.id) && (
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDelete(a.id)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="mb-0">{a.body}</p>
                </Card.Body>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Modal crear */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nuevo aviso</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Título</Form.Label>
              <Form.Control 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                required 
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Mensaje</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                name="body" 
                value={formData.body} 
                onChange={handleChange} 
                required 
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Prioridad</Form.Label>
              <Form.Select 
                name="priority" 
                value={formData.priority} 
                onChange={handleChange}
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Alcance</Form.Label>
              <Form.Select 
                name="scope" 
                value={formData.scope} 
                onChange={handleChange}
              >
                <option value="all">Global</option>
                <option value="community">Comunidad</option>
                <option value="activity">Actividad</option>
              </Form.Select>
            </Form.Group>

            {(formData.scope === 'community' || formData.scope === 'activity') && (
              <Form.Group className="mb-2">
                <Form.Label>
                  Nombre de la {formData.scope === 'community' ? 'comunidad' : 'actividad'}
                </Form.Label>
                <Form.Control 
                  name="target_name" 
                  value={formData.target_name} 
                  onChange={handleChange} 
                  placeholder="Nombre de referencia (opcional)" 
                />
                <Form.Text className="text-muted">
                  Solo referencial — sirve para mostrar a qué objetivo corresponde el aviso.
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Publicar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}