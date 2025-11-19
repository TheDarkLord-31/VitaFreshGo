import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "/src/Components/Header";
import Footer from "/src/Components/Footer";
//import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";



import Home from "./Pages/main/Home";
import Recipes from "./Pages/main/Recipes";
import ItemDetails from "./Pages/main/ItemDetails";
import Plans from "./Pages/main/Plans";
import InfoPlans from "./Pages/main/InfoPlans";
import UserProfile from "./Pages/main/UserProfile";
import Food from "./Pages/main/Food";


export default function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />

        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/:slug" element={<ItemDetails />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/infoplans/:slug" element={<InfoPlans />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/food" element={<Food />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}


