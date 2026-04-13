/** Introduction.tsx
 *  
 *  Introduction component that displays a brief description of the developer and their skills.
 * 
 */
import React from 'react';
import style from "../../styles/components/sections/Introduction.module.css";
import SectionTitle from './SectionTitle';

const Introduction: React.FC = () => {
  return (
    <div className={style.introduction}>
      <SectionTitle
        variant="hero"
        headingLevel={1}
        align="left"
        lede="Full-stack · TypeScript · Systems that ship"
        className={style.heroTitle}
      >
        <>
          <span className={style.name}>Jeremy Gavrilov.</span>
          <br />
          <span className={`${style.message} ${style.headlineAccent}`}>Just another guy who codes.</span>
        </>
      </SectionTitle>
      <p className={`${style.welcome} ${style.fadeIn}`} style={{animationDelay: '0.85s'}}>
        I'm a passionate and detail-oriented Full Stack Developer with a strong background in Java, Python, and Typescript. 
        I love creating innovative solutions and leveraging technology to improve user experiences. 
        Welcome to my personal website, where you can learn more about my skills, projects, and insights in the world of software development.
      </p>
    </div>
  );
};

export default Introduction;
