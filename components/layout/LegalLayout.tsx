import React from 'react';
import Head from 'next/head';
import Footer from '../nav/Footer';
import styles from '../../styles/components/layout/LegalLayout.module.css';
import { FaChevronLeft } from 'react-icons/fa';

interface LegalLayoutProps {
  title: string;
  documentTitle: string;
  lastUpdated: string;
  backHref?: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  documentTitle,
  lastUpdated,
  backHref = '/jg-app',
  children,
}) => {
  return (
    <div className={styles.pageWrapper}>
      <Head>
        <title>{documentTitle}</title>
      </Head>
      <div className={styles.container}>
        <main className={styles.mainContent}>
          <a className={styles.backButton} href={backHref} aria-label="Back to JG App">
            <FaChevronLeft />
          </a>
          <article className={styles.document}>
            <header className={styles.header}>
              <p className={styles.kicker}>JG App</p>
              <h1>{title}</h1>
              <p className={styles.updated}>Last updated: {lastUpdated}</p>
            </header>
            <div className={styles.body}>{children}</div>
            <nav className={styles.legalNav} aria-label="Legal documents">
              <a href="/jg-app/privacy">Privacy Policy</a>
              <span aria-hidden="true">·</span>
              <a href="/jg-app/terms">Terms of Service</a>
            </nav>
          </article>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default LegalLayout;
