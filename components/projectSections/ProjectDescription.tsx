/** ProjectDescription.tsx
 * 
 */
import React from 'react';
import style from "../../styles/components/projectSections/ProjectDescription.module.css";

interface ProjectDescriptionProps {
    title: string;
    imageUrl: string;
    description: string[];
    imageLink?: string;
  }

  const ProjectDescription: React.FC<ProjectDescriptionProps> = ({ title, imageUrl, description, imageLink }) => {
    return (
      <section className={style.projectDescription}>
        <div className={style.header}>
          <h2>{title}</h2>
        </div>
        <div className={style.projectContent}>
          {imageLink ? (
            <a href={imageLink} target="_blank" rel="noopener noreferrer" className={style.projectPhotoWrapper}>
              <img src={imageUrl} alt={title} className={style.projectPhoto} />
            </a>
          ) : (
            <div className={style.projectPhotoWrapper}>
              <img src={imageUrl} alt={title} className={style.projectPhoto} />
            </div>
          )}
          <div className={style.projectText}>
            {description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    );
  };
  
  

export default ProjectDescription;
