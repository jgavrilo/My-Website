import React from 'react';
import styles from '../../styles/components/sections/SectionTitle.module.css';

export type SectionTitleProps = {
  /** Section ordinal (`01`–`05`). Hero uses `//` instead when omitted. */
  index?: string;
  /** One-line context: what this block actually contains (not a synonym of the headline). */
  lede: string;
  /** Main heading copy (sections). Ignored when `children` is set. */
  title?: React.ReactNode;
  align?: 'left' | 'center';
  headingLevel?: 1 | 2;
  variant?: 'section' | 'hero';
  className?: string;
  /** Hero: multi-line name + tagline inside `h1`. */
  children?: React.ReactNode;
};

const SectionTitle: React.FC<SectionTitleProps> = ({
  index,
  lede,
  title,
  align = 'center',
  headingLevel = 2,
  variant = 'section',
  className,
  children,
}) => {
  const HeadingTag = headingLevel === 1 ? 'h1' : 'h2';
  const isHero = variant === 'hero';
  const headingContent = children ?? title;

  const rootClass = [
    styles.root,
    align === 'center' && styles.alignCenter,
    align === 'left' && styles.alignLeft,
    isHero && styles.variantHero,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!headingContent) {
    return null;
  }

  return (
    <div className={rootClass}>
      <div className={styles.meta}>
        {isHero ? (
          <span className={styles.mark}>//</span>
        ) : (
          index ? <span className={styles.index}>{index}</span> : null
        )}
        <span className={styles.beam} />
      </div>

      {isHero ? (
        <>
          <p className={styles.kicker}>{lede}</p>
          <HeadingTag className={styles.heroHeadline}>{headingContent}</HeadingTag>
        </>
      ) : (
        <>
          <HeadingTag className={styles.title}>{headingContent}</HeadingTag>
          <p className={styles.lede}>{lede}</p>
        </>
      )}
    </div>
  );
};

export default SectionTitle;
