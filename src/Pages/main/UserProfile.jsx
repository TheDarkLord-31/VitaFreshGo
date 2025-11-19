// src/Pages/UserProfile.jsx
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "/src/supabaseClient";
import "/src/Pages/styles/userprofile.css";
import NiceSelect from "/src/Components/NiceSelect";
import Seo from "/src/Components/Seo.jsx";


export default function UserProfile() {
  const [upUser, setUpUser] = useState(null);
  const [upProfile, setUpProfile] = useState({});
  const [upDraft, setUpDraft] = useState(null);     // ← чернова за редакция
  const [upLoading, setUpLoading] = useState(true);
  const [upEditing, setUpEditing] = useState(false);
  const upDetailsRef = useRef(null);

  // Зареждане на потребител и профил
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUpUser(user);
        const { data } = await supabase
          .from("users_profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setUpProfile(data || {});
      }
      setUpLoading(false);
    })();
  }, []);

  // Старт на редакция: копие в чернова + отворен details
  function handleStartEdit() {
    setUpDraft({ ...(upProfile || {}) });
    setUpEditing(true);
    if (upDetailsRef.current) upDetailsRef.current.open = true;
  }

  // Запазване: изпращаме черновата в Supabase и я приемаме за истина
  async function handleSave() {
    if (!upUser || !upDraft) return;
    const { error } = await supabase
      .from("users_profiles")
      .update(upDraft)
      .eq("id", upUser.id);

    if (!error) {
      setUpProfile(upDraft);
      setUpDraft(null);
      setUpEditing(false);
    } else {
      alert("Грешка при запазване.");
    }
  }

  // Отказ: изхвърляме черновата и връщаме оригиналните данни
  function handleCancel() {
    setUpDraft(null);
    setUpEditing(false);
  }

  // Унифициран binder за всички полета
  const upBind = (key) => ({
    value: upEditing ? (upDraft?.[key] ?? "") : (upProfile?.[key] ?? ""),
    onChange: (e) =>
      setUpDraft((prev) => ({
        ...(prev ?? { ...(upProfile || {}) }),
        [key]: e.target.value,
      })),
    disabled: !upEditing,
  });

  if (upLoading) return <main className="up-wrap">Зареждане...</main>;
  if (!upUser) return <main className="up-wrap">Моля, влез в профила си.</main>;

  return (

    <>
      <Seo
        title="Моят профил | VitaFreshGo"
        description="Управлявай профила си, любими рецепти и планове. Персонализирай своето хранене с VitaFreshGo."
        canonical="https://vitafreshgo.com/profile"
        image="/favicon_v2.png"
      />
      
    <main className={`up-layout ${upEditing ? "up-editing" : ""}`}>
      <section className="up-card">
        <div className="up-head">
          <h1>
            <span className="up-emoji" aria-hidden="true">🪪</span>
            Моят профил
          </h1>
          <p>{upUser.email}</p>
        </div>

        <details ref={upDetailsRef} open>
          <summary>Лична информация</summary>
          <div className="up-info">
            <label>
              Прякор:
              <input type="text" {...upBind("nickname")} />
            </label>

            <label>
              Пол:
              <NiceSelect
                {...upBind("gender")}
                options={["-", "Мъж", "Жена"]}
                placeholder="– Избери –"
              />
            </label>

            <label>
              Възраст:
              <input type="number" min="1" {...upBind("age")} />
            </label>

            <label>
              Град/село:
              <input type="text" {...upBind("city")} />
            </label>

            <label>
              Цел:
              <input
                type="text"
                placeholder="Отслабване, енергия, тонус..."
                {...upBind("goal")}
              />
            </label>

            <label>
              Начин на живот:
              <input
                type="text"
                placeholder="Активен, заседнал..."
                {...upBind("lifestyle")}
              />
            </label>

            <label>
              Тип хранене:
              <input
                type="text"
                placeholder="Баланс, вегетарианец..."
                {...upBind("diet_type")}
              />
            </label>
          </div>
        </details>

        <div className="up-actions">
          {!upEditing ? (
            <button onClick={handleStartEdit}>✏️ Редактирай</button>
          ) : (
            <>
              <button onClick={handleSave}>🗂️ Запази</button>
              <button onClick={handleCancel}>❌ Отказ</button>
            </>
          )}
        </div>
      </section>
    </main>
    </>
  );
}
