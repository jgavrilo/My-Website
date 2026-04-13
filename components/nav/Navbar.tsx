/** Navbar.tsx
 *
 *  Navigation bar with mobile menu, theme toggle, and resume link.
 *
 */
import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/components/nav/Navbar.module.css';
import Hamburger from './Hamburger';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  items: { id: string; text: string }[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    handleResize();

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const scrollToSection = (id: string) => {
    const sectionElement = document.getElementById(id);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
      setShowDropdown(false);
    }
  };

  return (
    <header className={styles.header} ref={headerRef}>
      <div className={styles.headerLeft}>
        {isMobileView && <Hamburger onClick={toggleDropdown} showDropdown={showDropdown} />}
      </div>
      <span className={styles.brand}>
        Jeremy<span className={styles.brandDot}>.</span>
        <span className={styles.brandRest}> Gavrilov</span>
      </span>
      <div className={styles.headerActions}>
        <ThemeToggle />
        <a
          href="https://jeremygavrilov.com/files/Resume-April-2025.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.resumeButton}
        >
          Resume
        </a>
      </div>
      {showDropdown && (
        <div className={styles.dropdownContainer}>
          <ul className={styles.dropdownMenu}>
            {items.map((item) => (
              <li key={item.id} className={styles.navLink}>
                <span onClick={() => scrollToSection(item.id)}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
