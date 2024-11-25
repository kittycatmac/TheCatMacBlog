import React, { useState } from 'react';
import '../styles/global.css';

export default function NavMenu({ SITE_TITLE }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = (event) => {
    event.preventDefault();
    setMenuVisible((prevState) => !prevState); // Toggle the menu state
  };

  const closeMenu = () => {
    setMenuVisible(false); // Ensure the menu closes
  };

  return (
    <div className="nav-container">
      <h2>
      <button onClick={toggleMenu} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 'inherit' }}>
          {SITE_TITLE}
        </button>
      </h2>
      <nav className={`side-menu ${menuVisible ? 'visible' : ''}`}>
        <button className="close-btn" onClick={closeMenu}>×</button>
        <ul>
          <li><a href="/about">About</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  );
}
