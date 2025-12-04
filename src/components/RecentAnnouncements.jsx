import React from 'react';
import { Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function RecentAnnouncements({ announcements, limit = 3 }) {
  if (!announcements || announcements.length === 0) return null;

  const recentAnnouncements = announcements.slice(0, limit);

  return (
    <div className="mb-4">
      <h5>📢 Avisos Recientes</h5>
      {recentAnnouncements.map(a => (
        <Alert key={a.id} variant="light" className="mb-2 py-2">
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <strong>{a.title}</strong>
              <br />
              <small className="text-muted">
                {a.target_name || 'General'} • {new Date(a.created_at).toLocaleDateString()}
              </small>
            </div>
            <Badge bg={a.priority === 'urgent' ? 'danger' : 'primary'}>
              {a.priority}
            </Badge>
          </div>
        </Alert>
      ))}
      <Link to="/announcements" className="btn btn-sm btn-outline-primary">
        Ver todos los avisos →
      </Link>
    </div>
  );
}