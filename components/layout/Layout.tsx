/** Layout.tsx
 * 
 *  This is the Layout component for the website.
 *  It wraps the main content of the page with a header (Navbar) and footer (Footer).
 *  It also includes LeftColumn and RightColumn components for the sidebars.
 *
 */

import React from 'react';
import Navbar from '../nav/Navbar';
import Footer from '../nav/Footer';
import styles from '../../styles/components/layout/Layout.module.css';
import LeftColumn from './LeftColumn';
import RightColumn from './RightColumn';
import { SOCIAL_MEDIA, SECTIONS } from '../constants';

// Define the type for the Layout component's props
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.pageWrapper}>
      <Navbar items={SECTIONS}/>
      <div className={styles.container}>
        <div className={styles.leftColumn}>
          <LeftColumn items={SECTIONS} />
        </div>
        <main className={styles.mainContent}>{children}</main>
        <div className={styles.rightColumn}>
          <RightColumn socialIcons={SOCIAL_MEDIA} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
