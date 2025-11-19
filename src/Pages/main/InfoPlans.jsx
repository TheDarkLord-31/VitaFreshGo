import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "/src/supabaseClient.js";
import "/src/Pages/styles/infoplans.css";
import { downloadPlanPdf } from "/src/Components/PlanPDF.jsx";
import Seo from "/src/Components/Seo.jsx"; // ✅ добавен импорт

const compact = (a) => a.filter(Boolean);
const byId = (arr) => Object.fromEntries(arr.map((r) => [r.id, r]));

export default function InfoPlans() {
  const { slug } = useParams();
  const [plan, setPlan] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState({});

  function toggleOpen(section) {
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  }


  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("plans").select("*").eq("slug", slug).single();
      setPlan(data);
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      if (!plan) return;
      const ids = compact([
        plan.breakfast_id,
        plan.lunch_id,
        plan.dinner_id,
        plan.anytime_1_id,
        plan.anytime_2_id,
      ]);
      if (ids.length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("recipes").select("*").in("id", ids);
      setRecipes(data || []);
      setLoading(false);
    })();
  }, [plan]);

  useEffect(() => {
    if (!recipes.length) return;

    // кеширане на снимките
    Object.values(recipes).forEach((recipe) => {
      if (recipe?.image_url) {
        const img = new Image();
        img.src = recipe.image_url;
      }
    });
  }, [recipes]);


  const optimizeImage = (url) => {
    if (!url) return "/placeholder.jpg";

    // ако е снимка от Supabase - остави я както е
    if (url.includes("supabase.co/storage/v1/object/")) {
      return url + "?t=" + Date.now(); // това само избягва кеш при промени
    }

    // иначе връщаме оригиналния линк
    return url;
  };


  const cleanImgUrl = (url) => (url ? url.split("?")[0] : undefined);
  const hpImg = (src, fallback = "/placeholder.jpg") => optimizeImage(src) || fallback;
 

  const handleDownloadPlanPdf = async (e) => {
    const btn = e.currentTarget;
    btn.setAttribute("data-state", "loading");

    try {
      // план с „чист“ image_url
      const planForPdf = { ...plan, image_url: cleanImgUrl(plan?.image_url) };

      // rmap с „чисти“ image_url-и за рецептите
      const rmapForPdf = Object.fromEntries(
        Object.entries(rmap || {}).map(([id, r]) => [
          id,
          r ? { ...r, image_url: cleanImgUrl(r.image_url) } : r,
        ])
      );

      await downloadPlanPdf(planForPdf, rmapForPdf);
    } catch (err) {
      console.error("PDF (plan) error:", err);
      alert("Не успях да създам PDF за плана. Опитайте отново.");
    } finally {
      if (btn && btn.isConnected) btn.removeAttribute("data-state");
    }
  };
  

  
  const rmap = useMemo(() => byId(recipes), [recipes]);
  if (!plan) return <main>Зареждане…</main>;

  const RecipeFull = ({ recipe }) => {
    if (!recipe) return null;

    const ingredients = recipe.ingredients?.split("&").filter(Boolean) || [];
    const instructions = recipe.instructions?.split("&").filter(Boolean) || [];
    const nutrition = recipe.nutrition?.split("&").filter(Boolean) || [];

    

    return (
      <article className="ip-recipe">
        <div className="ip-top">
          <div className="ip-image">
            <img 
              src={hpImg(recipe.image_url)}
              alt={recipe.name}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width="360"
              height="360"
              style={{ aspectRatio: "16/16" }}
              />
          </div>
          <div className="ip-info">
            <h2 className="ip-title">{recipe.name}</h2>
            <div className="ip-table">
              <div className="ip-row"><span className="ip-label">🎯 Предназначение:</span> <span className="ip-value">{recipe.purpose}</span></div>
              <div className="ip-row"><span className="ip-label">🏷️ Категория:</span> <span className="ip-value">{recipe.category}</span></div>
              <div className="ip-row"><span className="ip-label">⏱️ Време:</span> <span className="ip-value">{recipe.prep_time}</span></div>
              <div className="ip-row"><span className="ip-label">🍽️ Част:</span> <span className="ip-value">{recipe.meal_time}</span></div>
              <div className="ip-row"><span className="ip-label">🥣 Съставки:</span> <span className="ip-value">{ingredients.length}</span></div>
              <div className="ip-row"><span className="ip-label">📶 Ниво:</span> <span className="ip-value">{recipe.level}</span></div>
            </div>
          </div>
        </div>

        <div className="ip-sections">
          <div className="ip-section">
            <h3>📋 Съставки</h3>
            <ul className="ip-bulleted">
              {ingredients.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
          <div className="ip-section">
            <h3>👩‍🍳 Инструкции</h3>
            <ol className="ip-numbered">
              {instructions.map((x, i) => <li key={i}>{x}</li>)}
            </ol>
          </div>
          <div className="ip-section">
            <h3>🔋 Хранителни стойности</h3>
            <ul className="ip-bulleted">
              {nutrition.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        </div>
      </article>
    );
  };

  return (

    <>
      {/* ✅ SEO блок */}
      <Seo
        title={`${plan.name} | VitaFreshGo`}
        description={plan.notes || "Здравословен хранителен план от VitaFreshGo."}
        canonical={`https://vitafreshgo.com/infoplans/${plan.slug}`}
        image={plan.image_url}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Diet",
          "name": plan.name,
          "description": plan.notes || "Хранителен план за баланс и енергия.",
          "image": plan.image_url,
          "category": plan.category,
          "publisher": { "@type": "Organization", "name": "VitaFreshGo" },
          "about": "баланс, енергия, здравословно хранене",
          "hasPart": [
            { "@type": "Recipe", "name": rmap[plan.breakfast_id]?.name },
            { "@type": "Recipe", "name": rmap[plan.lunch_id]?.name }
          ],
        }}
      />

    
    <main className="ip-wrap">
      <div className="ip-card">

        {/* Горна зона: Име + Категория + Бележки */}
        <div className="ip-hero">
          <span className="ip-category">{plan.category}</span>
          <h1 className="ip-title">{plan.name}</h1>
          <p className="ip-action">{plan.action}</p>
          {plan.notes && <div className="ip-notes">ℹ️ {plan.notes}</div>}
        </div>

        {/* Секция рецепти */}
        {/* ---------- Accordion секции ---------- */}
        <section className="ip-sections">
          {[
            { key: "breakfast", label: "🧈 Закуска", id: plan.breakfast_id },
            { key: "lunch", label: "☀️ Обяд", id: plan.lunch_id },
            { key: "dinner", label: "🌙 Вечеря", id: plan.dinner_id },
            { key: "anytime1", label: "💫 По всяко време (1)", id: plan.anytime_1_id },
            { key: "anytime2", label: "✨ По всяко време (2)", id: plan.anytime_2_id },
          ].map(({ key, label, id }) => (
            <div className={`ip-section ${open[key] ? "open" : ""}`} key={key}>
              <div className="ip-section-header" onClick={() => toggleOpen(key)}>
                <span>{label}</span>
                <span className={`ip-arrow ${open[key] ? "open" : ""}`}>▼</span>
              </div>

              <div className="ip-section-body">
                <RecipeFull recipe={rmap[id]} />
              </div>
            </div>
          ))}
        </section>



        {/* Бутон назад */}
        <div className="ip-actions">
          <Link to="/plans" className="ip-btn-back">
            ← Назад към плановете
          </Link>

          <button
            type="button"
            className="ip-btn-download-pdf btn-download-pdf"
            onClick={handleDownloadPlanPdf}
            title="Изтегли плана като PDF"
            aria-label={`Изтегли „${plan?.name ?? "план"}“ като PDF`}
          >
            <span className="icon">📄</span>
            <span className="text">Изтегли PDF</span>
          </button>

        </div>
       

      </div>
    </main>
    </>
  );
}