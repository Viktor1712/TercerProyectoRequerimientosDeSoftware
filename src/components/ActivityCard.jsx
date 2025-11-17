import React from 'react'
import { Card, Button } from 'react-bootstrap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'

export default function ActivityCard({ activity }) {
  const { user } = useAuth()

  async function register() {
    if (!user) return alert('Primero debes iniciar sesión.')

    const { error } = await supabase.from('registrations').insert({
      activity_id: activity.id,
      user_id: user.id,
      status: 'pendiente'
    })

    if (error) alert(error.message)
    else alert('Solicitud enviada')
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>{activity.title}</Card.Title>

        <Card.Subtitle className="mb-2 text-muted">
          {activity.communities?.name ?? 'Comunidad desconocida'}
        </Card.Subtitle>

        <Card.Text>{activity.description}</Card.Text>

        <div className="d-flex justify-content-between">
          <small>{new Date(activity.start_at).toLocaleString()}</small>

          <Button onClick={register}>
            Inscribirme
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}
