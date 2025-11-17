import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { Form, Button, Alert } from 'react-bootstrap'

export default function AuthPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { error } = await signInWithEmail(email)
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 480 }}>
      <h2>Ingresar</h2>
      {sent ? (
        <Alert variant="success">Te enviamos un correo para iniciar sesión.</Alert>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button type="submit">Enviar enlace</Button>
        </Form>
      )}
    </div>
  )
}
