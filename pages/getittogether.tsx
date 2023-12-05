import React from 'react';
import ProjectLayout from '../components/layout/ProjectLayout';
import { FaGithub, FaGoogle } from 'react-icons/fa';

const GetItTogether: React.FC = () => {
  const affiliateLinks = [
    {
      preLinkText: "Check out the repository on ",
      linkText: "GitHub",
      postLinkText: " to personalize this project. Raise issues, request features, or make it uniquely yours. Your creativity sets the boundaries!",
      icon: <FaGithub />,
      linkUrl: "https://github.com/jgavrilo/GetItTogether"
    },
    {
      preLinkText: "Download it directly from the ",
      linkText: "Chrome Web Store",
      postLinkText: " and enjoy seamless functionality right in your browser.",
      icon: <FaGoogle />,
      linkUrl: "https://chrome.google.com/webstore/detail/getittogether/ojfhpccogblegeiacmljgecdcmadecgg?hl=en&authuser=0"
    }
  ];

  return (
    <ProjectLayout
      projectTitle='GetItTogether'
      githubLink="https://github.com/jgavrilo/GetItTogether"
      appStoreLink="https://chrome.google.com/webstore/detail/getittogether/ojfhpccogblegeiacmljgecdcmadecgg?hl=en&authuser=0"
      termsOfUseLink="/terms"
      privacyPolicyLink="/files/GetItTogether-Privacy-Policy.pdf"
      projectDescription={[
        "Boost your productivity without leaving your browser! GetItTogether is a feature-rich chrome extension designed to make your life easier and more organized.",
        "Current features include a timer, to-do list with google api connection, a spotify mini-player, and a settings area to keep things customized!"
      ]}
      imageUrl="../GetItTogether.jpg"
      affiliateLinks={affiliateLinks}
    />
  );
};

export default GetItTogether;
