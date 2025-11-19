import { useEffect, useState } from "react";
import { supabase } from "/src/supabaseClient.js";
import Seo from "/src/Components/Seo.jsx";
import "/src/Pages/styles/food.css";

export default function Food() {
  const [food, setFood] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Всички");

  useEffect(() => {
    fetchFood();
  }, []);

  async function fetchFood() {
    const { data, error } = await supabase.from("food").select("*");
    if (error) console.error(error);
    else {
      setFood(data);
      setFiltered(data);
    }
  }

  function handleFilter() {
    let result = food;
    if (category !== "Всички") {
      result = result.filter(f => f.category === category);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        f =>
          f.name.toLowerCase().includes(term) ||
          f.nutrition.toLowerCase().includes(term) ||
          f.effects.toLowerCase().includes(term)
      );
    }
    setFiltered(result);
  }

  useEffect(() => {
    handleFilter();
  }, [search, category, food]);

  return (
    <div className="food-page">
      <Seo
        title="Храни | VitaFreshGo"
        description="Научи повече за храните – витамини, минерали и влиянието им върху тялото. Филтрирай по категория и открий какво да добавиш в менюто си."
        canonical="https://vitafreshgo.com/food"
        image="/favicon_v2.png"
      />

      <h1>🥦 Хранителна информация</h1>

      <div className="food-filters">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="food-select"
        >
          <option>Всички</option>
          <option>Зеленчуци</option>
          <option>Плодове</option>
          <option>Зърнени</option>
          <option>Млечни</option>
          <option>Протеини</option>
          <option>Риба</option>
          <option>Напитки</option>
        </select>

        <input
          type="text"
          className="food-search"
          placeholder="🔍 Търси по име или състав..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="food-list">
        {filtered.map(f => (
          <div key={f.id} className="food-card">
            <h3>{f.name}</h3>
            <p><strong>Категория:</strong> {f.category}</p>
            <p><strong>Хранителна стойност:</strong> {f.nutrition}</p>
            <p><strong>Влияние:</strong> {f.effects}</p>
            <p><strong>Дневна доза:</strong> {f.daily_dose}</p>
            <p><strong>Време за употреба:</strong> {f.usage_time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
