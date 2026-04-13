import React from 'react';
import style from '../../styles/components/sections/Skills.module.css';
import SectionTitle from './SectionTitle';

const Skills: React.FC = () => {
  const skills = [    
    'Java',
    'Web Development',
    'Next.js',
    'React.js',
    'TypeScript',
    'JavaScript',
    'iOS Development',
    'SwiftUI',
    'API Development',
  ];

  return (
    <section className={style.skills}>
      <div className={style.sectionHeader}>
        <SectionTitle
          index="05"
          title="Core defaults"
          lede="Languages and platforms I'd list first in a design doc or a new repo README."
          align="center"
        />
      </div>
      <div className={style.skillsContainer}>
        {skills.map((skill, index) => (
          <div key={index} className={style.skill}>
            {skill}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;
