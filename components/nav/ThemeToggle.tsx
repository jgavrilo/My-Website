import React, { useCallback, useEffect, useState } from 'react';
import styles from '../../styles/components/nav/ThemeToggle.module.css';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* ignore */
  }
}

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const el = document.documentElement;
    const t = el.getAttribute('data-theme') as Theme | null;
    if (t === 'light' || t === 'dark') {
      setTheme(t);
    }
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }, [theme]);

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-pressed={theme === 'dark'}
    >
      <span className={styles.icon} aria-hidden="true">
        {theme === 'light' ? '☾' : '☀'}
      </span>
    </button>
  );
};

export default ThemeToggle;
