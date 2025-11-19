import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "/src/supabaseClient.js";
import "/src/Pages/styles/plans.css";
import Seo from "/src/Components/Seo.jsx";


export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("Всички");

  // 1) Зареждане от Supabase
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, slug, name, category, action, notes")
        .order("category", { ascending: true });

      if (!error) setPlans(data || []);
      setLoading(false);
    })();
  }, []);

  // 2) Категории за чиповете (уникални, сортирани)
  const categories = Array.from(
    new Set(plans.map((p) => (p.category || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "bg"));

  // 3) Филтрирани планове
  const visiblePlans =
    activeCat === "Всички"
      ? plans
      : plans.filter(
          (p) => (p.category || "").toLowerCase() === activeCat.toLowerCase()
        );

  // 4) Оцветяване на .badge по категория (чрез клас върху .plan-card)
  useEffect(() => {
    if (loading) return; // стабилен ред на hooks в dev

    const map = {
      "имунитет": "cat--imunitet",
      "енергия": "cat--energia",
      "отслабване": "cat--otslabvane",
      "протеин": "cat--protein",
      "антистрес": "cat--antistres",
    };
    const known = Object.values(map);

    document.querySelectorAll(".plan-card").forEach((card) => {
      known.forEach((c) => card.classList.remove(c)); // чистим предишни
      const badge = card.querySelector(".badge");
      if (!badge) return;
      const t = (badge.textContent || "").trim().toLowerCase();
      for (const k in map) {
        if (t.includes(k)) {
          card.classList.add(map[k]);
          break;
        }
      }
    });
  }, [loading, visiblePlans]);
  

  return (

    <>
      <Seo
        title="Хранителни планове | VitaFreshGo"
        description="Избери своя хранителен план – за енергия, баланс или отслабване. Готово меню с рецепти, списък за пазаруване и ясни порции."
        canonical="https://vitafreshgo.com/plans"
        image="/favicon_v2.png"
      />
      
    <main className="container-wide">
      <h1 className="page-title">Планове</h1>

      {/* Кутия с филтри */}
      <section className="plan-filters" role="region" aria-label="Филтър по категории">
        <p className="filters-title">
          Търсете план по категория според вашите нужди…
        </p>

        <span className="filters-label">Категории:</span>
        <div className="filters-chips">
          <button
            type="button"
            className={`chip ${activeCat === "Всички" ? "is-active" : ""}`}
            data-cat="Всички"
            onClick={() => setActiveCat("Всички")}
            aria-pressed={activeCat === "Всички"}
            title="Покажи всички"
          >
            Всички
          </button>

          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              className={`chip ${activeCat === cat ? "is-active" : ""}`}
              data-cat={cat}
              onClick={() => setActiveCat(cat)}
              aria-pressed={activeCat === cat}
              title={"Покажи само: " + cat}
            >
              {cat}
            </button>
          ))}

          {activeCat !== "Всички" && (
            <button
              type="button"
              className="chip chip-clear"
              onClick={() => setActiveCat("Всички")}
              title="Изчисти филтъра"
            >
              Изчисти
            </button>
          )}
        </div>
      </section>
      
      {/* брояч между филтрите и картите */}
      <div className="plans-count">Намерени: {visiblePlans.length}</div>

      {/* Зона с планове */}
      {loading ? (
        <div className="container-narrow loading-inline">Зареждане…</div>
      ) : (
        <>
          <section className="plan-grid">
            {visiblePlans.map((p) => (
              <article key={p.id} className="plan-card">
                <div className="plan-card-head">
                  <span className="badge">{p.category || "—"}</span>
                  <h2 className="plan-name">{p.name}</h2>
                </div>

                <p className="plan-action">{p.action}</p>
                {p.notes ? <p className="plan-notes">ℹ️ {p.notes}</p> : null}

                <div className="plan-card-footer">
                  <Link className="btn-view-plan" to={`/infoplans/${p.slug}`}>
                    Виж плана
                  </Link>
                </div>
              </article>
            ))}
          </section>


          {visiblePlans.length === 0 && (
            <p className="empty-state">Няма планове за тази категория.</p>
          )}
        </>
      )}
    </main>
    </>
  );
}
