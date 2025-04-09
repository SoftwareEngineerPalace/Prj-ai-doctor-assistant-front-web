import React, { useEffect } from "react";
import "./Test.less";

const Test = () => {
  useEffect(() => {
    const button = document.getElementById("toggle-menu");
    button?.addEventListener("click", function (event) {
      event.preventDefault();
      const menu = document.getElementById("main-menu");
      menu?.classList.toggle("is-open");
    });
  }, []);
  return (
    <div className="test-base">
      <header id="header" className="page-header">
        <div className="title">
          <h1>Wombat Coffee Roasters</h1>
          <div className="slogan">We love coffee</div>
        </div>
      </header>

      <nav className="menu" id="main-menu">
        <button className="menu-toggle" id="toggle-menu">
          toggle menu
        </button>
        <div className="menu-dropdown">
          <ul className="nav-menu">
            <li>
              <a href="/about.html">About</a>
            </li>
            <li>
              <a href="/shop.html">Shop</a>
            </li>
            <li>
              <a href="/menu.html">Menu</a>
            </li>
            <li>
              <a href="/brew.html">Brew</a>
            </li>
          </ul>
        </div>
      </nav>

      <aside id="hero" className="hero">
        Welcome to Wombat Coffee Roasters! We are passionate about our craft,
        striving to bring you the best hand-crafted coffee in the city.
      </aside>

      <main id="main">
        <div className="row">
          <section className="column">
            <h2 className="subtitle">Single-origin</h2>
            <p>
              We have built partnerships with small farms around the world to
              hand-select beans at the peak of season. We then carefully roast
              in
              <a href="/batch-size.html">small batches</a>
              to maximize their potential.
            </p>
          </section>
          <section className="column">
            <h2 className="subtitle">Blends</h2>
            <p>
              Our tasters have put together a selection of carefully balanced
              blends. Our famous
              <a href="/house-blend.html">house blend</a>
              is available year round.
            </p>
          </section>
          <section className="column">
            <h2 className="subtitle">Brewing Equipment</h2>
            <p>
              We offer our favorite kettles, French presses, and pour-over
              cones. Come to one of our{" "}
              <a href="/classes.html">brewing classes</a> to learn how to brew
              the perfect pour-over cup.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Test;
