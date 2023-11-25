import React from 'react';
import Footer from '../nav/Footer';
import styles from '../../styles/components/layout/ProjectLayout.module.css';
import ProjectDescription from '../projectSections/ProjectDescription';
import AffiliateLink from '../projectSections/AffiliateLink';
import { FaChevronLeft } from 'react-icons/fa';

interface AffiliateLinkInfo {
  preLinkText: string;
  linkText: string;
  postLinkText: string;
  icon: React.ReactNode;
  linkUrl: string;
}

interface ProjectLayoutProps {
  children?: React.ReactNode;
  projectTitle: string;
  githubLink: string;
  appStoreLink: string;
  termsOfUseLink?: string;
  privacyPolicyLink?: string;
  projectDescription: string[];
  imageUrl: string;
  affiliateLinks: AffiliateLinkInfo[];
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({
  children,
  projectTitle,
  githubLink,
  appStoreLink,
  termsOfUseLink,
  privacyPolicyLink,
  projectDescription,
  imageUrl,
  affiliateLinks
}) => {

  const navigateToParentDirectory = () => {
    let currentUrl = window.location.href;
    if (currentUrl.endsWith('/')) {
      currentUrl = currentUrl.substring(0, currentUrl.length - 1);
    }
    const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
    window.location.href = parentUrl;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <main className={styles.mainContent}>
          <button className={styles.backButton} onClick={navigateToParentDirectory}>
            <FaChevronLeft />
          </button>
          <ProjectDescription 
            title={projectTitle} 
            imageUrl={imageUrl} 
            description={projectDescription}
            imageLink={appStoreLink}
          />
          {children}
          {affiliateLinks.map((link, index) => (
            <AffiliateLink
              key={index}
              preLinkText={link.preLinkText}
              linkText={link.linkText}
              postLinkText={link.postLinkText}
              icon={link.icon}
              linkUrl={link.linkUrl}
            />
          ))}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ProjectLayout;
