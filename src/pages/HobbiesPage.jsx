// src/pages/HobbiesPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth.jsx';
import { Button, Alert, Form, Modal } from "react-bootstrap";

export default function HobbiesPage() {
  const { user, loading: authLoading } = useAuth();

  const [hobbies, setHobbies] = useState([]);
  const [userHobbies, setUserHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newHobby, setNewHobby] = useState({ name: '', description: '' });

  // Estados para el modal de autoevaluación
  const [showAssessment, setShowAssessment] = useState(false);
  const [selectedHobby, setSelectedHobby] = useState(null);
  const [assessment, setAssessment] = useState({
    experience: 1, // 1-5
    frequency: 1,  // 1-5
    knowledge: 1   // 1-5
  });
  const [suggestedLevel, setSuggestedLevel] = useState('');

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
          .select('hobby_id, proficiency')
          .eq('user_id', user.id);

        if (userError) throw userError;
        setUserHobbies(myHobbies);
      } catch (err) {
        console.error(err);
        setMessage({ type: "danger", text: "Error cargando hobbies" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calcular nivel sugerido basado en la autoevaluación
  const calculateLevel = (exp, freq, know) => {
    const average = (exp + freq + know) / 3;
    
    if (average <= 2) return 'principiante';
    if (average <= 3.5) return 'intermedio';
    return 'avanzado';
  };

  // Actualizar nivel sugerido cuando cambian los valores
  useEffect(() => {
    const level = calculateLevel(
      assessment.experience,
      assessment.frequency,
      assessment.knowledge
    );
    setSuggestedLevel(level);
  }, [assessment]);

  // Abrir modal de autoevaluación
  const openAssessment = (hobby, isRecalibration = false) => {
    setSelectedHobby({ ...hobby, isRecalibration });
    
    // Si es recalibración, cargar valores previos si existen
    if (isRecalibration) {
      const userHobby = userHobbies.find(uh => uh.hobby_id === hobby.id);
      if (userHobby) {
        // Valores por defecto basados en el nivel actual
        const defaultValues = {
          principiante: { experience: 1, frequency: 2, knowledge: 1 },
          intermedio: { experience: 3, frequency: 3, knowledge: 3 },
          avanzado: { experience: 5, frequency: 4, knowledge: 5 }
        };
        setAssessment(defaultValues[userHobby.proficiency] || { experience: 3, frequency: 3, knowledge: 3 });
      }
    } else {
      setAssessment({ experience: 1, frequency: 1, knowledge: 1 });
    }
    
    setShowAssessment(true);
  };

  // Cerrar modal
  const closeAssessment = () => {
    setShowAssessment(false);
    setSelectedHobby(null);
    setAssessment({ experience: 1, frequency: 1, knowledge: 1 });
  };

  // Confirmar y guardar la evaluación
  const submitAssessment = async () => {
    if (!user || !selectedHobby) return;

    try {
      const level = calculateLevel(
        assessment.experience,
        assessment.frequency,
        assessment.knowledge
      );

      if (selectedHobby.isRecalibration) {
        // Actualizar nivel existente
        const { error } = await supabase
          .from('user_hobbies')
          .update({ proficiency: level })
          .eq('user_id', user.id)
          .eq('hobby_id', selectedHobby.id);

        if (error) throw error;

        // Actualizar estado local
        setUserHobbies(userHobbies.map(uh => 
          uh.hobby_id === selectedHobby.id 
            ? { ...uh, proficiency: level }
            : uh
        ));

        setMessage({ type: "success", text: `Nivel recalibrado a: ${level}` });
      } else {
        // Crear nueva relación con el hobby
        const { error } = await supabase
          .from('user_hobbies')
          .insert({
            user_id: user.id,
            hobby_id: selectedHobby.id,
            proficiency: level
          });

        if (error) throw error;

        setUserHobbies([...userHobbies, { hobby_id: selectedHobby.id, proficiency: level }]);
        setMessage({ type: "success", text: `Te uniste al hobby con nivel: ${level}` });
      }

      closeAssessment();
    } catch (err) {
      console.error(err);
      setMessage({ type: "danger", text: "Error al guardar la evaluación" });
    }
  };

  // Crear nuevo hobby (solo admin)
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

  // Obtener el nivel actual del usuario para un hobby
  const getUserLevel = (hobbyId) => {
    const userHobby = userHobbies.find(uh => uh.hobby_id === hobbyId);
    return userHobby?.proficiency;
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

        {hobbies.map(hobby => {
          const userLevel = getUserLevel(hobby.id);
          const isJoined = userHobbies.some(uh => uh.hobby_id === hobby.id);

          return (
            <div
              key={hobby.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>{hobby.name}</strong>
                <br />
                <small>{hobby.description || "Sin descripción"}</small>
                {isJoined && (
                  <div className="mt-2">
                    <span className="badge bg-success me-2">Nivel: {userLevel}</span>
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                {isJoined ? (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => openAssessment(hobby, true)}
                  >
                    Recalibrar nivel
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => openAssessment(hobby, false)}
                  >
                    Unirme
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE AUTOEVALUACIÓN */}
      <Modal show={showAssessment} onHide={closeAssessment} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedHobby?.isRecalibration ? 'Recalibrar nivel' : 'Autoevaluación'} - {selectedHobby?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-4">
            Responde estas preguntas para determinar tu nivel en este hobby.
          </p>

          {/* Experiencia */}
          <Form.Group className="mb-4">
            <Form.Label>
              <strong>1. ¿Cuánta experiencia tienes?</strong>
            </Form.Label>
            <div className="mb-2">
              <small className="text-muted">
                1 = Ninguna | 2 = Muy poca | 3 = Algo de experiencia | 4 = Bastante | 5 = Experto
              </small>
            </div>
            <Form.Range
              value={assessment.experience}
              onChange={(e) => setAssessment({...assessment, experience: parseInt(e.target.value)})}
              min="1"
              max="5"
              step="1"
            />
            <div className="d-flex justify-content-between">
              <span>Ninguna</span>
              <strong className="text-primary">{assessment.experience}</strong>
              <span>Experto</span>
            </div>
          </Form.Group>

          {/* Frecuencia */}
          <Form.Group className="mb-4">
            <Form.Label>
              <strong>2. ¿Con qué frecuencia practicas?</strong>
            </Form.Label>
            <div className="mb-2">
              <small className="text-muted">
                1 = Nunca | 2 = Rara vez | 3 = Ocasionalmente | 4 = Frecuentemente | 5 = Diariamente
              </small>
            </div>
            <Form.Range
              value={assessment.frequency}
              onChange={(e) => setAssessment({...assessment, frequency: parseInt(e.target.value)})}
              min="1"
              max="5"
              step="1"
            />
            <div className="d-flex justify-content-between">
              <span>Nunca</span>
              <strong className="text-primary">{assessment.frequency}</strong>
              <span>Diariamente</span>
            </div>
          </Form.Group>

          {/* Conocimiento */}
          <Form.Group className="mb-4">
            <Form.Label>
              <strong>3. ¿Qué tan profundo es tu conocimiento?</strong>
            </Form.Label>
            <div className="mb-2">
              <small className="text-muted">
                1 = Básico | 2 = Limitado | 3 = Moderado | 4 = Amplio | 5 = Experto
              </small>
            </div>
            <Form.Range
              value={assessment.knowledge}
              onChange={(e) => setAssessment({...assessment, knowledge: parseInt(e.target.value)})}
              min="1"
              max="5"
              step="1"
            />
            <div className="d-flex justify-content-between">
              <span>Básico</span>
              <strong className="text-primary">{assessment.knowledge}</strong>
              <span>Experto</span>
            </div>
          </Form.Group>

          {/* Nivel sugerido */}
          <Alert variant="info" className="mt-4">
            <strong>Nivel sugerido:</strong>{' '}
            <span className="text-capitalize fs-5">{suggestedLevel}</span>
            <div className="mt-2">
              <small>
                Basado en tus respuestas, te recomendamos comenzar en el nivel <strong>{suggestedLevel}</strong>.
                Podrás recalibrarlo más adelante según tu participación.
              </small>
            </div>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAssessment}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submitAssessment}>
            {selectedHobby?.isRecalibration ? 'Actualizar nivel' : 'Confirmar y unirme'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}