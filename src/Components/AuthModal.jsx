// src/Components/AuthModal.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./authmodal.css";

export default function AuthModal({ type, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    // базова валидация за register/login
    if (type !== "logout") {
      if (!email.includes("@")) {
        setErrorMessage("❌ Моля, въведи валиден имейл адрес.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setErrorMessage("❌ Паролата трябва да съдържа поне 8 символа (на латиница).");
        setLoading(false);
        return;
      }
    }

    try {
      // ==============================
      // 🟢 Регистрация (с email confirmation)
      // ==============================
      if (type === "register") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Къде да отиде след клика на линка за потвърждение
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        });

        if (signUpError) {
          setErrorMessage("⚠️ Грешка при регистрация: " + signUpError.message);
          setLoading(false);
          return;
        }

        // 🔍 НАДЕЖДНА проверка: ако identities е празен масив → имейлът вече е регистриран
        const alreadyExists =
          Array.isArray(signUpData?.user?.identities) &&
          signUpData.user.identities.length === 0;

        if (alreadyExists) {
          setErrorMessage("⚠️ Потребител с този имейл вече съществува.");
          setLoading(false);
          return;
        }

        // ⚠️ При включено Email Confirmation НЯМА активна сесия тук,
        // затова не правим insert в users_profiles сега.
        // Профилът ще се създаде автоматично при първия успешен вход (по-долу).

        setSuccessMessage("✅ Успешна регистрация! Провери имейла си за потвърждение.");
        setLoading(false);
        return;
      }

      // ==============================
      // 🟡 Вход
      // ==============================
      // ==============================
      // 🟡 Вход
      // ==============================
      if (type === "login") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message?.includes("Invalid login credentials")) {
            setErrorMessage("❌ Няма такъв потребител или паролата е грешна.");
          } else {
            setErrorMessage("⚠️ " + signInError.message);
          }
          setLoading(false);
          return;
        }

        // ✅ Изчакваме Supabase да обнови активната сесия
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setSuccessMessage("✅ Успешен вход! Добре дошъл обратно!");

        // 🧩 След успешен вход – гарантираме, че има ред в users_profiles
        const userId = user?.id;
        if (userId) {
          const { data: existing } = await supabase
            .from("users_profiles")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

          if (!existing) {
            const { error: insertError } = await supabase.from("users_profiles").insert([
              {
                id: userId,
                nickname: "",
                gender: "",
                age: null,
                city: "",
                lifestyle: "",
                goal: "",
                diet_type: "",
                about: "",
              },
            ]);
            if (insertError) {
              console.warn("⚠️ Грешка при създаване на профила:", insertError.message);
            }
          }
        }

        // Оставяме модала отворен 3.5 сек, за да се види съобщението
        setTimeout(() => onClose(), 3500);
        setLoading(false);
        return;
      }


      // ==============================
      // 🔴 Изход
      // ==============================
      if (type === "logout") {
        try {
          await supabase.auth.signOut();
          setSuccessMessage("✅ Излезе успешно! До скоро 👋");

          // Леко забавяне → предотвратява „мигане“ на бутоните в хедъра
          setTimeout(() => {
            window.location.replace("/");
          }, 800);
        } catch (err) {
          setErrorMessage("⚠️ Проблем при излизане. Опитай отново.");
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      setErrorMessage("⚠️ Възникна неочаквана грешка: " + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h2>
          {type === "register" ? "Регистрация" : type === "login" ? "Вход" : "Изход"}
        </h2>

        {(type === "register" || type === "login") && (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Имейл"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Парола"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
                autoComplete={type === "register" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="btn-toggle-pass"
                onClick={() => setShowPassword(v => !v)}
                onMouseDown={(e) => e.preventDefault()} // да не губи фокуса полето
                aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
                title={showPassword ? "Скрий паролата" : "Покажи паролата"}
              >
                {showPassword ? "🔒" : "💡"}
              </button>
            </div>


            {errorMessage && <p className="auth-error">{errorMessage}</p>}
            {successMessage && <p className="auth-success">{successMessage}</p>}

            <button
              type="submit"
              className="auth-button auth-submit"
              disabled={loading}
            >
              {loading
                ? "Моля, изчакай..."
                : type === "register"
                ? "Регистрирай ме"
                : "Влез"}
            </button>
          </form>
        )}

        {type === "logout" && (
          <div className="logout-box">
            <p>Сигурен ли си, че искаш да излезеш?</p>
            {errorMessage && <p className="auth-error">{errorMessage}</p>}
            {successMessage && <p className="auth-success">{successMessage}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="auth-button auth-submit"
            >
              {loading ? "Излизане..." : "Да, излез"}
            </button>
          </div>
        )}

        <button onClick={onClose} className="auth-button auth-close">
          Затвори
        </button>
      </div>
    </div>
  );
}
