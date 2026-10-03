import React from 'react';
import ProjectLayout from '../../components/layout/ProjectLayout';
import { FaGithub } from 'react-icons/fa';

const JgApp: React.FC = () => {
  const affiliateLinks = [
    {
      preLinkText: "Follow development on ",
      linkText: "GitHub",
      postLinkText: ". Raise issues, request features, or see how the portfolio app is built.",
      icon: <FaGithub />,
      linkUrl: "https://github.com/jgavrilo/Jeremy-Gavrilov-App"
    }
  ];

  return (
    <ProjectLayout
      projectTitle='JG App'
      githubLink="https://github.com/jgavrilo/Jeremy-Gavrilov-App"
      appStoreLink="https://github.com/jgavrilo/Jeremy-Gavrilov-App"
      termsOfUseLink="/jg-app/terms"
      privacyPolicyLink="/jg-app/privacy"
      projectDescription={[
        "JG App is a software engineering portfolio on your phone. It shows public content such as an about section, resume, project demos, links, and contact details—no account required.",
        "Portfolio content stays up to date from Firebase. Optional push notifications can alert you to new demos, settings stay on-device, and you can open the resume, maps, or the web from inside the app."
      ]}
      imageUrl="../software-engineer.png"
      affiliateLinks={affiliateLinks}
    />
  );
};

export default JgApp;
