import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { supabase } from "../supabaseClient";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [userHobbies, setUserHobbies] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------
  // Cargar hobbies
  // ----------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const fetchHobbies = async () => {
      try {
        const { data, error } = await supabase
          .from("user_hobbies")
          .select("hobby_id, proficiency, hobbies(name)")
          .eq("user_id", user.id);

        if (error) throw error;

        setUserHobbies(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHobbies();
  }, [user]);

  // ----------------------------------------------------
  // Cargar actividades a las que el usuario se ha unido
  // ----------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("registrations")
          .select(`
            activity_id,
            activities (
              title,
              description,
              start_at
            )
          `)
          .eq("user_id", user.id);

        if (error) throw error;

        setUserActivities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  if (loading || authLoading)
    return <div className="text-center mt-5">Cargando perfil...</div>;

  return (
    <div className="container mt-4">
      {/* ------------------------------- */}
      {/* INFORMACIÓN DEL USUARIO */}
      {/* ------------------------------- */}
      <h2 className="mb-4">Perfil de {user.display_name || user.username}</h2>

      <div className="card mb-4">
        <div className="card-body">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Bio:</strong> {user.bio || "Sin bio"}</p>
          <p>
            <strong>Avatar:</strong>{" "}
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" width={50} />
            ) : (
              "Sin avatar"
            )}
          </p>
          <p><strong>Admin:</strong> {user.is_admin ? "Sí" : "No"}</p>
        </div>
      </div>

      {/* ------------------------------- */}
      {/* HOBBIES DEL USUARIO */}
      {/* ------------------------------- */}
      <h4>Hobbies</h4>
      {userHobbies.length === 0 && <p>No tienes hobbies registrados.</p>}

      <ul className="list-group mb-4">
        {userHobbies.map((h) => (
          <li
            key={h.hobby_id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            {h.hobbies?.name || "Hobby desconocido"}
            <span className="badge bg-primary rounded-pill">
              {h.proficiency}
            </span>
          </li>
        ))}
      </ul>

      {/* ------------------------------- */}
      {/* ACTIVIDADES DEL USUARIO */}
      {/* ------------------------------- */}
      <h4>Actividades en las que estás registrado</h4>
      {userActivities.length === 0 && <p>No estás inscrito en ninguna actividad.</p>}

      <ul className="list-group">
        {userActivities.map((a) => (
          <li
            key={a.activity_id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{a.activities?.title}</strong>
              <br />
              <small className="text-muted">{a.activities?.description}</small>
              <br />
              <small className="text-muted">
                Inicio:{" "}
                {a.activities?.start_at
                  ? new Date(a.activities.start_at).toLocaleString()
                  : "Fecha no disponible"}
              </small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}