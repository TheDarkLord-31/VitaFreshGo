import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "/src/supabaseClient.js";
import Seo from "/src/Components/Seo.jsx";
import "/src/Pages/styles/itemdetails.css";
import { downloadRecipePdf } from "/src/Components/RecipePDF.jsx";


// помощни
const normalize = (s) => (s || "").toString().trim();
const splitList = (val) =>
  normalize(val)
    .split("&")
    .map((x) => x.trim())
    .filter(Boolean);

const ingredientCountOf = (ingredients) =>
  splitList(ingredients).length;


export default function ItemDetails() {
  const { slug } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👇 useRef трябва да е дефиниран ТУК — извън useEffect
  const countedRef = useRef(false);

  // 🥗 зареждане на рецептата
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("slug", slug)
        .single();
      if (!error) setRecipe(data);
      setLoading(false);
    })();
  }, [slug]);

  // 👁️ брояч на прегледите
  useEffect(() => {
    if (!slug) return;
    if (countedRef.current) return; // вече е броено
    countedRef.current = true;

    const increment = async () => {
      const { data, error } = await supabase.rpc("increment_recipe_views", { p_slug: slug });
      if (error) console.warn("⚠️ increment_recipe_views error:", error.message);
      else console.log(`👁️ Преглед записан: ${slug} → ${data}`);
    };

    increment();
  }, [slug]);



  const ingredients = useMemo(
    () => splitList(recipe?.ingredients),
    [recipe]
  );
  const instructions = useMemo(
    () => splitList(recipe?.instructions),
    [recipe]
  );
  const nutritionList = useMemo(
    () => splitList(recipe?.nutrition),
    [recipe]
  );

  if (loading) return <main className="container-narrow">Зареждане…</main>;
  if (!recipe)
    return (
      <main className="container-narrow">
        <h1>Рецептата не е намерена</h1>
        <Link className="btn-back" to="/recipes">← Назад към рецептите</Link>
      </main>
    );

  const ingCount = ingredientCountOf(recipe.ingredients);

  
  const optimizeImage = (url) => {
    if (!url) return "/placeholder.jpg";

    // ако е снимка от Supabase - остави я както е
    if (url.includes("supabase.co/storage/v1/object/")) {
      return url + "?t=" + Date.now(); // това само избягва кеш при промени
    }

    // иначе връщаме оригиналния линк
    return url;
  };

  const hpImg = (src, fallback = "/placeholder.jpg") => optimizeImage(src) || fallback;

  const handleDownloadPdf = async (e) => {
    const btn = e.currentTarget;               // хващаме референция към бутона
    btn.setAttribute("data-state", "loading");

    try {
      // махаме cache-buster-а от URL-а за PDF-а
      const cleanUrl = recipe.image_url ? recipe.image_url.split("?")[0] : undefined;

      await downloadRecipePdf({
        ...recipe,
        image_url: cleanUrl,
      });
    } catch (err) {
      console.error("PDF error:", err);
      alert("Не успях да създам PDF. Опитайте отново.");
    } finally {
      // ако бутонът вече е размонтиран (навигация), няма да хвърли грешка
      if (btn && btn.isConnected) btn.removeAttribute("data-state");
    }
  };



  return (

    <>
    {/* ✅ Seo компонентът е тук — вътре в return, преди съдържанието */}
      <Seo
        title={`${recipe.name} | VitaFreshGo`}
        description={recipe.description || "Бърза, лесна и здравословна рецепта от VitaFreshGo."}
        canonical={`https://vitafreshgo.com/recipes/${recipe.slug}`}
        image={recipe.image_url}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": recipe.name,
          "description": recipe.description || "Бърза, лесна и здравословна рецепта от VitaFreshGo.",
          "image": recipe.image_url,
          "recipeCategory": recipe.category,
          "recipeCuisine": "Healthy",
          "prepTime": recipe.prep_time,
          "keywords": `${recipe.purpose || ""}, ${recipe.category || ""}, здравословна рецепта`,
          "author": { "@type": "Organization", "name": "VitaFreshGo" },
          "totalTime": recipe.prep_time,
          "recipeYield": "1 порция",
          "nutrition": {
            "@type": "NutritionInformation",
            "calories": recipe.calories || "200 kcal"},
        }}
      />


    <main className="details-wrap">
      <article className="details-card">
        {/* горна част: снимка + инфо */}
        <div className="details-top">
          <div className="details-image">
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

          <div className="details-info">
            <h1 className="details-title">{recipe.name}</h1>

            <div className="info-table">
              <div className="info-row">
                <span className="label">🎯 Предназначение:</span>
                <span className="value">{recipe.purpose || "—"}</span>
              </div>
              <div className="info-row">
                <span className="label">🏷️ Категория:</span>
                <span className="value">{recipe.category || "—"}</span>
              </div>
              <div className="info-row">
                <span className="label">⏱️ Време за приготвяне:</span>
                <span className="value">{recipe.prep_time || "—"}</span>
              </div>
              <div className="info-row">
                <span className="label">🍽️ Част от деня:</span>
                <span className="value">{recipe.meal_time || "—"}</span>
              </div>
              <div className="info-row">
                <span className="label">🥣 Брой съставки:</span>
                <span className="value">{ingCount}</span>
              </div>
              <div className="info-row">
                <span className="label">📶 Ниво на трудност:</span>
                <span className="value">{recipe.level || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="details-divider" />

        {/* долна част: секции */}
        <section className="details-sections">
          <div className="section">
            <h2>📜 Съставки</h2>
            <ul className="bulleted">
              {ingredients.length ? (
                ingredients.map((x, i) => <li key={i}>{x}</li>)
              ) : (
                <li>Няма добавени съставки.</li>
              )}
            </ul>
          </div>

          <div className="section">
            <h2>👩‍🍳 Инструкции</h2>
            <ol className="numbered">
              {instructions.length ? (
                instructions.map((x, i) => <li key={i}>{x}</li>)
              ) : (
                <li>Няма добавени инструкции.</li>
              )}
            </ol>
          </div>

          <div className="section">
            <h2>🔋 Хранителни стойности</h2>
            <ul className="bulleted nutrition">
              {nutritionList.length ? (
                nutritionList.map((x, i) => <li key={i}>{x}</li>)
              ) : (
                <li>Няма добавена информация.</li>
              )}
            </ul>
          </div>
        </section>

        <hr className="details-divider" />

        <div className="details-actions">
          <Link className="btn-back" to="/recipes">← Назад към рецептите</Link>

          <button
            type="button"
            className="btn-download-pdf"
            onClick={handleDownloadPdf}
          >
            <span className="icon">📄</span>
            <span className="text">Изтегли PDF</span>
          </button>


        </div>
      </article>
    </main>
  </>
  );
}
