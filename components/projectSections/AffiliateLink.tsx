import React from 'react';
import styles from "../../styles/components/projectSections/AffiliateLink.module.css";

interface AffiliateLinkProps {
    preLinkText: string;
    linkText: string;
    postLinkText: string;
    icon: React.ReactNode;
    linkUrl: string;
}

const AffiliateLink: React.FC<AffiliateLinkProps> = ({ preLinkText, linkText, postLinkText, icon, linkUrl }) => {
  return (
    <div className={styles.container}>
      <p className={styles.message}>
        {preLinkText}
        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
          {linkText}
        </a>
        {postLinkText}
      </p>
      <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={styles.icon}>
        {icon}
      </a>
    </div>
  );
};

export default AffiliateLink;
