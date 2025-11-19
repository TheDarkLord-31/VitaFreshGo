import "./footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ft-footer">
      <div className="ft-container">
        <div className="ft-col">
          <h4>Навигация</h4>
          <ul>
            <li><a href="/">Начало</a></li>
            <li><a href="/recipes">Рецепти</a></li>
            <li><a href="/plans">Планове</a></li>
          </ul>
        </div>

        <div className="ft-col">
          <h4>Информация</h4>
          <ul>
            <li><a href="#">За нас</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Общи условия</a></li>
            <li><a href="#">Политика за поверителност</a></li>
          </ul>
        </div>

        <div className="ft-col">
          <h4>Контакти</h4>
          <ul className="ft-contacts">
            <li>
              <i className="fa-solid fa-envelope"></i>
              <a href="mailto:hello@vitafreshgo.com">hello@vitafreshgo.com</a>
            </li>
            <li>
              <i className="fa-solid fa-phone"></i>
              <a href="tel:+359000000000">+359 00 000 000</a>
            </li>
          </ul>

        </div>

        <div className="ft-col">
          <h4>Последвайте ни</h4>
          <ul className="ft-socials">
            <li>
              <a href="#" aria-label="Facebook">
                <i className="fab fa-facebook"></i> Facebook
              </a>
            </li>
            <li>
              <a href="#" aria-label="Instagram">
                <i className="fab fa-instagram"></i> Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
  
      <div className="ft-bottom">
        <hr />
        <p>© {year} VitaFreshGo. Всички права запазени.</p>
      </div>
    </footer>
  );
}
