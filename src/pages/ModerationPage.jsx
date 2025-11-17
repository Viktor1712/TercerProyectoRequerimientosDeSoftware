// src/pages/ModerationPage.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../supabaseClient'

export default function ModerationPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id, reason, status, reporter_id, reported_user_id, reported_activity_id, created_at
          `)
          .order('created_at', { ascending: false })
        if (error) throw error
        setReports(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [user])

  if (loading) return <div className="text-center mt-5">Cargando reportes...</div>

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Moderación</h2>
      {reports.length === 0 && <div className="alert alert-info">No hay reportes pendientes.</div>}
      <div className="list-group">
        {reports.map(r => (
          <div key={r.id} className="list-group-item mb-2">
            <p><strong>Motivo:</strong> {r.reason}</p>
            <p><strong>Estado:</strong> {r.status}</p>
            <p><strong>Reportado a usuario ID:</strong> {r.reported_user_id || 'N/A'}</p>
            <p><strong>Actividad ID:</strong> {r.reported_activity_id || 'N/A'}</p>
            <p><small className="text-muted">Creado: {new Date(r.created_at).toLocaleString()}</small></p>
          </div>
        ))}
      </div>
    </div>
  )
}
