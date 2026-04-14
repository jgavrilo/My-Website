/** Education.tsx
 * 
 *  Education component that displays the developer's educational background.
 * 
 */
import React from 'react';
import style from '../../styles/components/sections/Education.module.css';
import SectionTitle from './SectionTitle';

type EducationItem = {
  id: number;
  degree: string;
  institution: string;
  location: string;
  dates: string;
  imageUrl: string; 
  coursework: string[];
};

const Education: React.FC = () => {
  const educationItems: EducationItem[] = [
    {
      id: 1,
      degree: 'Bachelor of Science in Computer Science',
      institution: 'Syracuse University',
      location: 'Syracuse, NY',
      dates: '2017 - 2021',
      imageUrl: 'Syracuse.png',
      coursework: [ 
        'Automata and Computability',
        'Analysis of Algorithms',
        'Data Structures',
        'Database Management Systems',
        'Ethical Aspects of Engineering and Computer Science',
        'Programming Language: Theory & Practice',
      ],
    },
  ];

  return (
    <section className={style.education}>
      <div className={style.sectionHeader}>
        <SectionTitle
          index="03"
          title="Education"
          lede=""
          align="center"
        />
      </div>
      <div className={style.educationContainer}>
        {educationItems.map((item) => (
          <div key={item.id} className={style.educationItem}>
            <div className={style.educationHeader}> 
              <img
                src={item.imageUrl}
                alt={`${item.institution} logo`}
                className={style.educationImage}
              />
              <div>
                <h3 className={style.degree}>{item.degree}</h3>
                <h4 className={style.institution}>{item.institution}</h4>
                <p className={style.location}>{item.location}</p>
                <p className={style.dates}>{item.dates}</p>
              </div>
            </div>
            <div className={style.coursework}>
              <h5>Relevant Coursework:</h5>
              <ul>
                {item.coursework.map((course, index) => (
                  <li key={index}>{course}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Education;
