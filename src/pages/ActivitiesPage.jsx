// src/pages/ActivitiesPage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../hooks/useAuth.jsx";
import { Form, Button, Alert } from "react-bootstrap";

export default function ActivitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_at: "",
    duration_minutes: "",
    location: "",
    virtual: false,
    required_level: "",
    capacity: 1,
    community_id: "",
  });

  // ----------------------------------------------------
  //  Cargar actividades + comunidades
  // ----------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: activitiesData, error: actError } = await supabase
          .from("activities")
          .select(
            `id, title, description, start_at, duration_minutes, location, virtual, required_level, capacity, created_by, communities(name)`
          )
          .order("start_at", { ascending: true });

        if (actError) throw actError;
        setActivities(activitiesData);

        const { data: comData, error: comError } = await supabase
          .from("communities")
          .select("id, name");

        if (comError) throw comError;
        setCommunities(comData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ----------------------------------------------------
  //  Manejar inputs del formulario
  // ----------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ----------------------------------------------------
  //  Crear una nueva actividad (solo admins)
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const insertData = {
        ...formData,
        created_by: user.id,
      };

      if (!formData.community_id) delete insertData.community_id;

      const { error } = await supabase.from("activities").insert([insertData]);
      if (error) throw error;

      setSuccess("Actividad creada correctamente");
      setCreating(false);

      // refrescar actividades
      const { data } = await supabase
        .from("activities")
        .select(
          `id, title, description, start_at, duration_minutes, location, virtual, required_level, capacity, created_by, communities(name)`
        )
        .order("start_at");

      setActivities(data);

      setFormData({
        title: "",
        description: "",
        start_at: "",
        duration_minutes: "",
        location: "",
        virtual: false,
        required_level: "",
        capacity: 1,
        community_id: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // ----------------------------------------------------
  //  UNIRSE A UNA ACTIVIDAD  (registrations)
  // ----------------------------------------------------
  const joinActivity = async (activityId) => {
    if (!user) {
      alert("Debes iniciar sesión para unirte.");
      return;
    }

    try {
      const { error } = await supabase.from("registrations").insert([
        {
          activity_id: activityId,
          user_id: user.id,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          alert("Ya estás inscrito en esta actividad.");
        } else {
          throw error;
        }
        return;
      }

      alert("Te has unido a la actividad!");
    } catch (err) {
      console.error(err);
      alert("Error al unirte: " + err.message);
    }
  };

  if (loading || authLoading)
    return <div className="text-center mt-5">Cargando actividades...</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Actividades</h2>

      {/* SOLO ADMIN */}
      {user?.is_admin && (
        <Button className="mb-3" onClick={() => setCreating(!creating)}>
          {creating ? "Cancelar" : "Crear nueva actividad"}
        </Button>
      )}

      {/* FORMULARIO ADMIN */}
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
            <Form.Label>Inicio</Form.Label>
            <Form.Control type="datetime-local" name="start_at" value={formData.start_at} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Duración (min)</Form.Label>
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
            <Form.Control type="text" name="required_level" value={formData.required_level} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Capacidad</Form.Label>
            <Form.Control type="number" min="1" name="capacity" value={formData.capacity} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Comunidad</Form.Label>
            <Form.Select name="community_id" value={formData.community_id} onChange={handleChange}>
              <option value="">Sin comunidad</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button type="submit" className="mt-2">
            Crear actividad
          </Button>
        </Form>
      )}

      {/* LISTADO DE ACTIVIDADES */}
      <div className="row">
        {activities.map((a) => (
          <div key={a.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">

                <h5 className="card-title">{a.title}</h5>
                <p className="card-text">{a.description}</p>

                <p className="text-muted">Comunidad: {a.communities?.name || "Sin comunidad"}</p>
                <p className="text-muted">Inicio: {new Date(a.start_at).toLocaleString()}</p>
                <p className="text-muted">Nivel requerido: {a.required_level}</p>
                <p className="text-muted">Capacidad: {a.capacity}</p>
                <p className="text-muted">{a.virtual ? "Virtual" : "Presencial"}</p>

                {/* BOTÓN UNIRME */}
                <Button
                  className="mt-2 w-100"
                  variant="primary"
                  onClick={() => joinActivity(a.id)}
                >
                  Unirme
                </Button>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
