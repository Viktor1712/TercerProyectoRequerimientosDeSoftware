// src/pages/HobbiesPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth.jsx';
import { Button, Alert, Form } from "react-bootstrap";

export default function HobbiesPage() {
  const { user, loading: authLoading } = useAuth();

  const [hobbies, setHobbies] = useState([]);
  const [userHobbies, setUserHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newHobby, setNewHobby] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Obtener todos los hobbies
        const { data: allHobbies, error: hobbiesError } = await supabase
          .from('hobbies')
          .select('*')
          .order('name', { ascending: true });

        if (hobbiesError) throw hobbiesError;
        setHobbies(allHobbies);

        // 2. Obtener hobbies del usuario
        const { data: myHobbies, error: userError } = await supabase
          .from('user_hobbies')
          .select('hobby_id')
          .eq('user_id', user.id);

        if (userError) throw userError;
        setUserHobbies(myHobbies.map(h => h.hobby_id));
      } catch (err) {
        console.error(err);
        setMessage({ type: "danger", text: "Error cargando hobbies" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // --- Unirse a un hobby ---
  const joinHobby = async (hobbyId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_hobbies')
        .insert({
          user_id: user.id,
          hobby_id: hobbyId,
          proficiency: "principiante"
        });

      if (error) throw error;

      setUserHobbies([...userHobbies, hobbyId]);
      setMessage({ type: "success", text: "Te uniste al hobby correctamente" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "danger", text: "No se pudo unir al hobby" });
    }
  };

  // --- Crear nuevo hobby (solo admin) ---
  const handleCreateHobby = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!newHobby.name.trim()) {
      setMessage({ type: "danger", text: "El nombre del hobby es obligatorio" });
      return;
    }

    try {
      const { error } = await supabase
        .from('hobbies')
        .insert([{ name: newHobby.name, description: newHobby.description }]);

      if (error) throw error;

      setMessage({ type: "success", text: "Hobby creado correctamente" });
      setNewHobby({ name: '', description: '' });
      setCreating(false);

      // Refrescar lista de hobbies
      const { data: updatedHobbies } = await supabase
        .from('hobbies')
        .select('*')
        .order('name', { ascending: true });
      setHobbies(updatedHobbies);
    } catch (err) {
      console.error(err);
      setMessage({ type: "danger", text: "No se pudo crear el hobby" });
    }
  };

  if (!user) return <div className="text-center mt-5">Debes iniciar sesión</div>;
  if (loading || authLoading) return <div className="text-center mt-5">Cargando hobbies...</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Todos los Hobbies</h2>

      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      {/* BOTON CREAR NUEVO HOBBY (solo admin) */}
      {user?.is_admin && (
        <div className="mb-3">
          <Button onClick={() => setCreating(!creating)}>
            {creating ? 'Cancelar' : 'Crear nuevo hobby'}
          </Button>
        </div>
      )}

      {/* FORM CREAR HOBBY */}
      {creating && user?.is_admin && (
        <Form onSubmit={handleCreateHobby} className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>Nombre del hobby</Form.Label>
            <Form.Control
              name="name"
              value={newHobby.name}
              onChange={(e) => setNewHobby({ ...newHobby, name: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              name="description"
              value={newHobby.description}
              onChange={(e) => setNewHobby({ ...newHobby, description: e.target.value })}
            />
          </Form.Group>

          <Button type="submit" className="mt-2">Crear hobby</Button>
        </Form>
      )}

      <div className="list-group">
        {hobbies.length === 0 && (
          <div className="alert alert-info">No hay hobbies registrados</div>
        )}

        {hobbies.map(hobby => (
          <div
            key={hobby.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{hobby.name}</strong>
              <br />
              <small>{hobby.description || "Sin descripción"}</small>
            </div>

            {userHobbies.includes(hobby.id) ? (
              <span className="badge bg-success">Ya estás unido</span>
            ) : (
              <Button
                variant="primary"
                onClick={() => joinHobby(hobby.id)}
              >
                Unirme
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
