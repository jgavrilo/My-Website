/** Navbar.tsx
 * 
 *  This is the Navbar component for the website.
 *  It contains a navigation bar with links to scroll to different sections of the page.
 *  The navigation bar is responsive and hides when scrolling down, reappearing when scrolling up.
 *  In mobile view, a hamburger menu is used to display the navigation links.
 * 
 */
import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/components/nav/Navbar.module.css";
import Hamburger from "./Hamburger";

interface NavbarProps {
  items: { id: string; text: string }[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [navBarHidden, setNavBarHidden] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click events outside the navbar
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    // Handle scroll events to hide or show the navbar
    const handleScroll = () => {
      const currentScrollPosition = window.pageYOffset;
      if (currentScrollPosition < lastScrollPosition) {
        setNavBarHidden(false);
      } else {
        setNavBarHidden(true);
        setShowDropdown(false);
      }
      setLastScrollPosition(currentScrollPosition);
    };

    // Handle resize events to determine if the view is in mobile or desktop mode
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    // Initialize isMobileView state
    handleResize();

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [lastScrollPosition]);

  // Toggle the dropdown menu
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Scroll smoothly to the target section
  const scrollToSection = (id: string) => {
    const sectionElement = document.getElementById(id);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
      setShowDropdown(false);
    }
  };

  const navbarClasses = navBarHidden
    ? `${styles.header} ${styles.hidden}`
    : styles.header;

  return (
    <header className={navbarClasses} ref={headerRef}>
        <span className={styles.brand}>Jeremy Gavrilov</span>
        {isMobileView && <Hamburger onClick={toggleDropdown} showDropdown={showDropdown} />}
        {showDropdown && (
        <div className={styles.dropdownContainer}>
        <ul className={styles.dropdownMenu}>
          {items.map((item) => (
            <li key={item.id} className={styles.navLink}>
              <span onClick={() => scrollToSection(item.id)}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
      )}
      <a
      href="https://jeremygavrilov.com/files/Resume-October-2023.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.resumeButton}
    >
      Resume
    </a>
    </header>
  );
};

export default Navbar;
