import { useEffect, useRef } from 'react';
import styles from '../../styles/pages/Home.module.css';

type SectionProps = {
    id: string;
    children: React.ReactNode;
    /** Default centers content; use "start" for left-aligned hero (e.g. intro). */
    align?: 'center' | 'start';
    /** Alternate stripe background (every other section on the home page). */
    variant?: 'default' | 'alt';
  };
  
  const Section = ({ id, children, align = 'center', variant = 'default' }: SectionProps) => {
    useEffect(() => {
      const section = document.querySelector(`#${id}`);
      if (!section) return;
  
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      }, { threshold: 0.5 });
  
      observer.observe(section);
  
      return () => {
        observer.unobserve(section);
      };
    }, [id]);
  
    const sectionClass = [
      styles.section1,
      variant === 'alt' && styles.section1Alt,
      align === 'start' && styles.section1AlignStart,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div id={id} className={sectionClass}>
        {children}
      </div>
    );
  };
  
  export default Section;