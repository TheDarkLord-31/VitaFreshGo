import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "/src/supabaseClient.js";
import "/src/Pages/styles/recipes.css";
import NiceSelect from "/src/Components/NiceSelect.jsx";
import { Link } from "react-router-dom";
import Seo from "/src/Components/Seo.jsx";

/* интервали за време */
const PREP_RANGES = [
  { key: "all",   label: "Всички" },
  { key: "5-10",  label: "5–10 мин.",  min: 5.1,  max: 9.9 },
  { key: "10-15", label: "10–15 мин.", min: 10.1, max: 14.9 },
  { key: "15-20", label: "15–20 мин.", min: 15.1, max: 19.9 },
  { key: "20-30", label: "20–30 мин.", min: 20.1, max: 29.9 },
  { key: "30-45", label: "30–45 мин.", min: 30.1, max: 44.9 },
  { key: "45+",   label: "45+ мин.",   min: 45.1, max: 1000 },
];

const labelToKey = Object.fromEntries(PREP_RANGES.map(r => [r.label, r.key]));
const keyToLabel = Object.fromEntries(PREP_RANGES.map(r => [r.key, r.label]));

const ING_OPTIONS = ["Всички", "3", "4", "5", "6", "7", "8", "9", "10+"];

const normalize = (s) => (s || "").toString().toLowerCase().trim();
const ingredientCountOf = (ingredients) =>
  ingredients ? ingredients.split("&").map(x => x.trim()).filter(Boolean).length : 0;
const parsePrep = (prep) => {
  const nums = (prep || "").match(/\d+/g)?.map(Number) || [];
  if (nums.length === 0) return { min: null, max: null };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: nums[0], max: nums[1] };
};
const upToId = (x) => (x == null ? "" : String(x));

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // филтри
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("Всички");
  const [category, setCategory] = useState("Всички");
  const [mealTime, setMealTime] = useState("Всички");
  const [ingSel, setIngSel] = useState("Всички");
  const [prepSel, setPrepSel] = useState("all");
  const [level, setLevel] = useState("Всички");

  // любими
  const [upUser, setUpUser] = useState(null);
  const [upFavSet, setUpFavSet] = useState(new Set());
  const [upFavOnly, setUpFavOnly] = useState(false);
  const [upFavBusy, setUpFavBusy] = useState(null);

  /* Зареждане на рецепти (с кеш) */
  useEffect(() => {
    const cached = sessionStorage.getItem("recipesCache");
    if (cached) {
      setRecipes(JSON.parse(cached));
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data?.length) {
        setRecipes(data);
        sessionStorage.setItem("recipesCache", JSON.stringify(data));
      } else {
        console.error("Грешка при зареждане на рецепти:", error);
      }
      setLoading(false);
    })();
  }, []);

  /* Текущ потребител */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUpUser(user || null);
    })();
  }, []);

  /* Следим login/logout */
  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user ?? null;
        setUpUser(user);
        if (!user) {
          setUpFavSet(new Set());
          setUpFavOnly(false);
        }
      });

    return () => subscription?.unsubscribe();
  }, []);

  /* Любими за потребителя */
  useEffect(() => {
    if (!upUser) { setUpFavSet(new Set()); return; }

    (async () => {
      const { data, error } = await supabase
        .from("users_favourite_recipes")
        .select("recipe_id")
        .eq("user_id", upUser.id);

      if (!error) {
        setUpFavSet(new Set((data || []).map(r => upToId(r.recipe_id))));
      } else {
        console.error("Грешка при зареждане на любими:", error);
      }
    })();
  }, [upUser]);

  /* Toggle любими */
  async function upToggleFav(recipeId) {
    const rid = upToId(recipeId);
    if (!upUser || upFavBusy === rid) return;

    const wasFav = upFavSet.has(rid);
    setUpFavBusy(rid);

    const next = new Set(upFavSet);
    wasFav ? next.delete(rid) : next.add(rid);
    setUpFavSet(next);

    if (!wasFav) {
      const { error } = await supabase
        .from("users_favourite_recipes")
        .upsert(
          { user_id: upUser.id, recipe_id: rid },
          { onConflict: "user_id,recipe_id" }
        );
      if (error) {
        next.delete(rid);
        setUpFavSet(new Set(next));
        alert("Не успях да добавя в любими.");
      }
    } else {
      const { error } = await supabase
        .from("users_favourite_recipes")
        .delete()
        .eq("user_id", upUser.id)
        .eq("recipe_id", rid);
      if (error) {
        next.add(rid);
        setUpFavSet(new Set(next));
        alert("Не успях да махна от любими.");
      }
    }

    setUpFavBusy(null);
  }

  const getDifficultyColor = (lvl) => {
    switch ((lvl || "").toLowerCase()) {
      case "лесно": return "🟢";
      case "средно": return "🟡";
      case "трудно": return "🔴";
      default:       return "⚪";
    }
  };

  /* Динамични опции за селектите */
  const dynOptions = useMemo(() => {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    return {
      purposes:  ["Всички", ...uniq(recipes.map(r => r.purpose))],
      categories:["Всички", ...uniq(recipes.map(r => r.category))],
      mealTimes: ["Всички", ...uniq(recipes.map(r => r.meal_time))],
      levels:    ["Всички", ...uniq(recipes.map(r => r.level))],
    };
  }, [recipes]);

  /* Филтриране */
  const filtered = useMemo(() => {
    const range = PREP_RANGES.find(x => x.key === prepSel);

    return recipes.filter((r) => {
      if (!r.name) return false;
      if (upFavOnly && !upFavSet.has(upToId(r.id))) return false;

      const nameOk   = normalize(r.name).includes(normalize(search));
      const purposeOk  = purpose  === "Всички" || r.purpose   === purpose;
      const categoryOk = category === "Всички" || r.category  === category;
      const mealOk     = mealTime === "Всички" || r.meal_time === mealTime;
      const levelOk    = level    === "Всички" || normalize(r.level) === normalize(level);

      const ingCount = ingredientCountOf(r.ingredients);
      let ingOk = true;
      if (ingSel !== "Всички") {
        if (ingSel.endsWith("+")) {
          const min = Number(ingSel.replace("+", ""));
          ingOk = ingCount >= min;
        } else {
          ingOk = ingCount === Number(ingSel);
        }
      }

      let prepOk = true;
      if (range && range.key !== "all") {
        const { min, max } = parsePrep(r.prep_time);
        if (min == null && max == null) prepOk = false;
        else {
          const realMin = min ?? max ?? 0;
          const realMax = max ?? min ?? realMin;
          prepOk = !(range.max < realMin || range.min > realMax);
        }
      }

      return nameOk && purposeOk && categoryOk && mealOk && ingOk && prepOk && levelOk;
    });
  }, [
    recipes,
    search,
    purpose,
    category,
    mealTime,
    ingSel,
    prepSel,
    level,
    upFavOnly,
    upFavSet
  ]);

  const resetFilters = () => {
    setSearch("");
    setPurpose("Всички");
    setCategory("Всички");
    setMealTime("Всички");
    setIngSel("Всички");
    setPrepSel("all");
    setLevel("Всички");
    setUpFavOnly(false);
  };

  const optimizeImage = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.includes("supabase.co/storage/v1/object/")) {
      return url + "?t=" + Date.now();
    }
    return url;
  };

  const hpImg = (src, fallback = "/placeholder.jpg") =>
    optimizeImage(src) || fallback;

  return (
    <>
      <Seo
        title="Рецепти | VitaFreshGo"
        description="Колекция от здравословни рецепти – напитки, салати, основни и десерти. Филтрирай по време, трудност или съставки и открий любимото си ястие."
        canonical="https://vitafreshgo.com/recipes"
        image="/favicon_v2.png"
      />

      {/* minHeight само докато зарежда, за да не подскочи футъра */}
      <div
        className="container-fluid py-5"
        style={{ minHeight: loading ? "60vh" : undefined }}
      >
        <h1 className="info-text">
          Намерете рецепта бързо и лесно като използвате филтрите или търсачката!
        </h1>

        {/* ФИЛТРИ */}
        <div className="filters-wrapper">
          <section className="filters-card">
            <div className="filters-grid">
              <div className="filter-field">
                <label>🎯 Предназначение</label>
                <NiceSelect
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  options={dynOptions.purposes}
                />
              </div>

              <div className="filter-field">
                <label>🏷️ Категория</label>
                <NiceSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={dynOptions.categories}
                />
              </div>

              <div className="filter-field">
                <label>🍽️ Част от деня</label>
                <NiceSelect
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  options={dynOptions.mealTimes}
                />
              </div>

              <div className="filter-field">
                <label>🥣 Брой съставки</label>
                <NiceSelect
                  value={ingSel}
                  onChange={(e) => setIngSel(e.target.value)}
                  options={ING_OPTIONS}
                />
              </div>

              <div className="filter-field">
                <label>🕒 Време за приготвяне</label>
                <NiceSelect
                  value={keyToLabel[prepSel]}
                  onChange={(e) => setPrepSel(labelToKey[e.target.value])}
                  options={PREP_RANGES.map(r => r.label)}
                />
              </div>

              <div className="filter-field">
                <label>📶 Ниво на трудност</label>
                <NiceSelect
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  options={dynOptions.levels}
                />
              </div>

              <div className="filter-actions">
                <button className="btn-clear" onClick={resetFilters}>
                  Изчисти
                </button>
              </div>

              <div className="filter-field filter-search">
                <label>Търси по име:</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Продукт или част от име..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="results-badge">
                  Намерени: {filtered.length}
                </span>

                <button
                  type="button"
                  className={`up-fav-toggle ${upFavOnly ? "is-on" : ""}`}
                  onClick={() => setUpFavOnly((v) => !v)}
                  disabled={!upUser}
                  title={
                    upUser
                      ? upFavOnly
                        ? "Показвам само любими"
                        : "Филтър: само любими"
                      : "Влез, за да ползваш любими"
                  }
                >
                  {upFavOnly ? "❤️ Любими" : "🤍 Любими"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* РЕЦЕПТИ */}
        <div className="recipes-grid">
          {filtered.map((r) => {
            const rid = upToId(r.id);
            const isFav = upFavSet.has(rid);
            const ingredientCount = ingredientCountOf(r.ingredients);

            return (
              <div key={rid} className="recipe-card">
                <div className="recipe-image">
                  <img
                    src={hpImg(r.image_url)}
                    alt={r.name}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    width="360"
                    height="360"
                    style={{ aspectRatio: "16/16" }}
                  />
                  <button
                    type="button"
                    className={
                      `up-fav-btn ${isFav ? "is-on" : ""}` +
                      ` ${!upUser ? "is-guest" : ""}` +
                      ` ${upFavBusy === rid ? "is-busy" : ""}`
                    }
                    aria-pressed={isFav}
                    aria-disabled={!upUser}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!upUser) return;
                      upToggleFav(rid);
                    }}
                    title={
                      isFav
                        ? "Премахни от любими"
                        : "Добави в любими"
                    }
                  >
                    {isFav ? "❤️" : "🤍"}
                  </button>
                </div>

                <div className="recipe-body">
                  <h3 className="recipe-name">{r.name}</h3>

                  <div className="recipe-details">
                    {r.purpose && (
                      <p>🎯 <strong>{r.purpose}</strong></p>
                    )}
                    {r.category && (
                      <p>🏷️ <strong>{r.category}</strong></p>
                    )}
                    {r.meal_time && (
                      <p>🍽️ <strong>{r.meal_time}</strong></p>
                    )}
                    <p>🥣 <strong>{ingredientCount} съставки</strong></p>
                    {r.prep_time && (
                      <p>🕒 <strong>{r.prep_time}</strong></p>
                    )}
                    {r.level && (
                      <p>
                        <strong>
                          {getDifficultyColor(r.level)} {r.level}
                        </strong>
                      </p>
                    )}
                  </div>

                  <div className="recipe-actions">
                    {r.slug && (
                      <Link className="btn-view" to={`/recipes/${r.slug}`}>
                        Виж рецептата
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
