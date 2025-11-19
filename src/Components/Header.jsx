import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import AuthModal from "./AuthModal";
import "./header.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(null); // "login" или "register"
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  // Следим потребителя
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Изход
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    setProductsOpen(false);
    window.location.href = "/";
  }

  // Клик на линк → затваря мобилното меню и dropdown
  function handleLinkClick() {
    setMenuOpen(false);
    setProductsOpen(false);
  }

  useEffect(() => {
    const handleOutsideClick = () => setProductsOpen(false);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);


  return (
    <header>
      <nav className="navbar">
        <div className="container">
          <a href="/" className="logo" onClick={handleLinkClick}>
            VitaFreshGo
          </a>

          {/* Бутон за мобилно меню */}
          <div
            className={`menu-toggle ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <ul
            className={`nav-links ${menuOpen ? "open" : ""}`}
          >
            <li>
              <a href="/" onClick={handleLinkClick}>
                🌍 <span>Начало</span>
              </a>
            </li>

            {/* 🔽 Продукти с подменю */}
            <li className="has-dropdown">
              <button
                type="button"
                className="nav-link-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductsOpen(v => !v);
                }}
              >
                🌿 <span>Продукти</span>
                <span className={`caret ${productsOpen ? "open" : ""}`}>▾</span>
              </button>

              <ul className={`dropdown ${productsOpen ? "show" : ""}`}>
                <li>
                  <a href="/tools" onClick={handleLinkClick}>🫕 За готвене</a>
                </li>
                <li>
                  <a href="/food" onClick={handleLinkClick}>🥗 Храни</a>
                </li>
                <li>
                  <a href="/store" onClick={handleLinkClick}>🛒 От магазина</a>
                </li>
              </ul>
            </li>





            <li>
              <a href="/recipes" onClick={handleLinkClick}>
                🥗 <span>Рецепти</span>
              </a>
            </li>

            <li>
              <a href="/plans" onClick={handleLinkClick}>
                📋 <span>Планове</span>
              </a>
            </li>

            {user ? (
              <>
                <li>
                  <a href="/profile" onClick={handleLinkClick}>
                    🪪 <span>Моят профил</span>
                  </a>
                </li>
                <li>
                  <button onClick={handleLogout} className="logout-btn">
                    🏃 <span>Изход</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button onClick={() => { setShowModal("register"); setMenuOpen(false); }}>
                    ✍️ <span>Регистрация</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => { setShowModal("login"); setMenuOpen(false); }}>
                    🔑 <span>Вход</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      {/* Модален прозорец за вход / регистрация */}
      {showModal && (
        <AuthModal
          type={showModal}
          onClose={() => setShowModal(null)}
        />
      )}
    </header>
  );
}
