/** Experience.tsx
 *
 * Experience component that displays a list of job experiences
 * with a circular image next to each job's information.
 * 
 */
import React from 'react';
import style from '../../styles/components/sections/Experience.module.css';

// Define Job type
type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  dates: string;
  description: string[];
  imageUrl: string;
};

const Experience: React.FC = () => {
  const jobs: Job[] = [
    {
      id: 1,
      title: 'Software Developement Engineer',
      company: 'Amazon.com LLC',
      location: 'Seattle, Washington',
      dates: 'July 2021 - March 2023',
      imageUrl: './Amazon.png',
      description: [
        'Designed and implemented new features for Amazon’s central marketplace and filtering service for personalized recommendations on retail pages, utilizing AWS services such as S3, Lambda, IAM, Gateway, Cloudwatch, and EC2 for secure, scalable, and robust solutions. ',
        'Handle operations on-call duties (DevOps) to improve service maintainability and provide 99.9% availability during regular rotations and peak events. ',
        'Collaborate with internal teams to build integration testing frameworks and a command-line interface (CLI) to improve the developer experience.',
        'Conduct code reviews and write automated JUnit and integration tests to maintain code quality and ensure software reliability.'
      ],
    },
  ];

  return (
    <section className={style.experience}>
      <h2>Experience</h2>
      <div className={style.jobsContainer}>
        {jobs.map((job) => (
          <div key={job.id} className={style.job}>
            <div className={style.jobHeader}> {/* Add jobHeader div */}
              <img
                src={job.imageUrl}
                alt={`${job.company} logo`}
                className={style.jobImage} // Add className for job image
              />
              <div>
                <h3 className={style.jobTitle}>{job.title}</h3>
                <h4 className={style.jobCompany}>{job.company}</h4>
                <p className={style.jobLocation}>{job.location}</p>
                <p className={style.jobDates}>{job.dates}</p>
              </div>
            </div>
            <ul className={style.jobDescription}>
              {job.description.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Experience;
