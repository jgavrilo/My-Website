/** index.tsx
 * 
 *  This is the homepage of the website.
 *  It contains two sections with placeholder content.
 *
 */
import React from 'react';
import Layout from '../components/layout/Layout';
import Section from '../components/sections/Section';
import Introduction from '@component/components/sections/Introduction';
import AboutMe from '@component/components/sections/AboutMe';
import Experience from '@component/components/sections/Experience';
import Education from '@component/components/sections/Education';
import Projects from '@component/components/sections/Projects';

const HomePage: React.FC = () => {
  
  return (
    <Layout>
      <Section id="intro" align="start">
        <Introduction />
      </Section>
      <Section id="aboutme" variant="alt">
        <AboutMe />
      </Section>
      <Section id="experience">
        <Experience />
      </Section>
      <Section id="education" variant="alt">
        <Education />
      </Section>
      <Section id="projects">
        <Projects />
      </Section>
    </Layout>
  );
};

export default HomePage;