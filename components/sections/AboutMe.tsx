/** AboutMe.tsx
 *  
 *  AboutMe component that displays a little about the developer.
 * 
 */
import React from 'react';
import style from "../../styles/components/sections/AboutMe.module.css";
import SectionTitle from './SectionTitle';

const AboutMe: React.FC = () => {
  return (
    <section className={style.aboutMe}>
      <div className={style.header}>
        <div className={style.titleBlock}>
          <SectionTitle
            index="01"
            title="About Me"
            lede=""
            align="left"
          />
        </div>
        <img src="Profile.jpg" alt="Jeremy Gavrilov" className={style.aboutMePhoto} />
      </div>
      <div className={style.aboutMeText}>
        <p>
          I have a B.S. in Computer Science from Syracuse University and about four years in the field between engineering at Amazon and contract work 
          building apps and systems for small businesses. My goal is to help businesses leverage APIs, servers, and modern web & app stacks to make 
          day to day activities easier and more efficient.
        </p>
        <p>
          I thrive on tackling complex projects and am committed to staying current with cutting-edge technologies and industry best practices.
          When I'm not immersed in coding, you can find me adventuring through the urban jungle, unwinding with video games or a captivating movie, 
          or expressing my creativity in the kitchen through baking.
        </p>
      </div>
    </section>
  );
};

export default AboutMe;

