import Image from 'next/image';
import styles from './PhotoSlot.module.css';

export interface PhotoSlotProps {
  /** Path under /public once the owner supplies a photo, e.g. "/images/storefront.jpg". */
  src?: string;
  /** True in ?review=1 mode. Without a photo, the labelled box is only shown to reviewers. */
  review?: boolean;
  alt: string;
  /** What to ask the owner for. Shown in the placeholder. */
  label: string;
  width: number;
  height: number;
}

/**
 * A slot for a photo the store still has to supply. Until `src` is set it renders nothing for visitors and a
 * clearly labelled placeholder in ?review=1 mode, so the owner can see what is missing and no one else's
 * artwork is ever used. Photos we have go through components/ui/Photo.tsx instead.
 * Sizes and the shot list live in public/images/README.md.
 */
export function PhotoSlot({ src, review = false, alt, label, width, height }: PhotoSlotProps) {
  if (src) {
    return (
      <Image
        className={styles.img}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 860px) 100vw, 560px"
      />
    );
  }
  // Visitors never see a dashed placeholder. Reviewers (?review=1) see what is still missing.
  if (!review) return null;
  return (
    <div
      className={styles.slot}
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={`Photo placeholder: ${label}`}
    >
      <span className={styles.tag}>Photo slot</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.size}>
        {width} × {height}
      </span>
    </div>
  );
}
