import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "/src/supabaseClient";
import "/src/Pages/styles/home.css";
import Seo from "/src/Components/Seo.jsx";


export default function Home() {
  const [hpTopPlans, setHpTopPlans] = useState([])
  const [hpTopRecipes, setHpTopRecipes] = useState([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, name, slug, image_url, prep_time, category, views")
        .order("views", { ascending: false })
        .limit(3);

      if (!error) setHpTopRecipes(data || []);
      else console.error("Грешка при зареждане на топ рецепти:", error);
    })();
  }, []);

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


  return (
    <>
      <Seo
        title="VitaFreshGo | Здравословни рецепти и хранителни планове"
        description="Бързи и лесни здравословни рецепти, хранителни планове и персонализирани менюта за всеки ден. Открий вдъхновение и поддържай форма с VitaFreshGo."
        canonical="https://vitafreshgo.com/"
        image="/favicon_v2.png"
      />
      
    <main className="hp-page">
      {/* HERO (карта с лого и мото) */}
      <section className="hp-hero">
        <div className="hp-hero-card">
          <img src="/favicon_v2.png" alt="VitaFreshGo" className="hp-logo" fetchPriority="high"/>
          <div className="hp-hero-text">
            <h1 className="hp-hero-title">VitaFreshGo</h1>
            <p>
              Бързи и здравословни рецепти, плюс ясни хранителни планове.
              Филтрирай по време и съставки, запазвай любими и следвай меню,
              което пасва на твоя ден.
            </p>
            <p>
              По-малко мислене — повече вкус и енергия. Ние подбираме достъпни
              продукти и прости стъпки, за да готвиш уверено дори когато нямаш време.
            </p>
          </div>
        </div>
      </section>

      {/* РЕЦЕПТИ – обяснение + топ 3 */}
      <section className="hp-band hp-band--recipes">
        <div className="hp-band-head">
          <h2>Как да намериш рецепта бързо</h2>
          <p>
            Използвай <strong>филтрите</strong> по предназначение, категория, част от деня,
            брой съставки, време за приготвяне и ниво на трудност. Или пиши в
            <strong> търсачката</strong> част от име/продукт. Запазвай в <strong>Любими</strong> с едно
            сърце и ги виж отново по-късно.
          </p>
        </div>

        {/* Топ 3 рецепти */}
        <div className="hp-grid">
          {(hpTopRecipes.length ? hpTopRecipes : [
            { id: "r1", name: "Смути с ябълка и банан", slug: "green-smoothie", image_url: "/placeholder.jpg", prep_time:"5-10 мин.", category:"Напитки", views: 0 },
            { id: "r2", name: "Тост със сьомга и крем сирене", slug: "salmon-toast", image_url: "/placeholder.jpg", prep_time:"5-10 мин.", category:"Сандвичи", views: 0 },
            { id: "r3", name: "Киноа салата", slug: "quinoa-salad", image_url: "/placeholder.jpg", prep_time:"10-15 мин.", category:"Салати", views: 0 },
          ]).map((r) => (
            <article key={r.id} className="hp-card">
              <img
                src={hpImg(r.image_url)}
                alt={r.name}
                className="hp-card-img"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width="360"
                height="360"
                style={{ aspectRatio: "16/16" }}
              />
              <div className="hp-card-body">
                <h3 className="hp-card-title">{r.name}</h3>
                <p className="hp-meta">{r.category} · {r.prep_time}</p>
                <p className="hp-views">🔍 {r.views ?? 0} преглеждания</p>
                {r.slug && (
                  <Link to={`/recipes/${r.slug}`} className="hp-link">
                    Виж рецептата →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="hp-band-cta">
          <Link to="/recipes" className="hp-btn hp-btn-dark">Всички рецепти</Link>
        </div>
      </section>


      {/* ПЛАНОВЕ – обяснение + топ 3 */}
      <section className="hp-band hp-band--plans">
        <div className="hp-band-head">
          <h2>Как работят плановете</h2>
          <p>
            Избираш <strong>цел</strong> (отслабване, енергия или баланс) и получаваш
            <strong> меню по дни</strong>, <strong>списък за пазаруване</strong> и <strong>възможност за подмени</strong>.
            Така спестяваш време и пари, а храненето е организирано.
          </p>
        </div>

        <div className="hp-grid">
          {(hpTopPlans.length ? hpTopPlans : [
            { id: "p1", name: "План за енергия (7 дни)", slug: "energy-7", image_url: "/placeholder.jpg", description:"Леки, зареждащи ястия." },
            { id: "p2", name: "План за баланс (14 дни)", slug: "balance-14", image_url: "/placeholder.jpg", description:"Умерени калории, пълноценни порции." },
            { id: "p3", name: "План за отслабване (30 дни)", slug: "slim-30", image_url: "/placeholder.jpg", description:"Структура и видим резултат." },
          ]).map((p) => (
            <article key={p.id} className="hp-card">
              <img
                src={hpImg(p.image_url)}
                alt={p.name}
                className="hp-card-img"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width="360"
                height="360"
                style={{ aspectRatio: "16/16"}}  
              />
              <div className="hp-card-body">
                <h3 className="hp-card-title">{p.name}</h3>
                <p className="hp-meta">{p.description}</p>
                {p.slug && (
                  <Link to={`/plans/${p.slug}`} className="hp-link">
                    Виж плана →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="hp-band-cta">
          <Link to="/plans" className="hp-btn hp-btn-dark">Всички планове</Link>
        </div>
      </section>
    </main>
  </>
  );
}
