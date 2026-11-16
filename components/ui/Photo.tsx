import Image from 'next/image';
import type { CSSProperties } from 'react';
import { getPhoto, type PhotoKey } from '@/lib/content/photos';
import styles from './Photo.module.css';

export interface PhotoProps {
  name: PhotoKey;
  /** Must match the layout. Default suits a half-width card. */
  sizes?: string;
  /** Only for the single above-the-fold (LCP) image on a page. */
  priority?: boolean;
  /** Slight comic-panel rotation. Use on at most one card per row. */
  tilt?: boolean;
  /** Short caption under the photo, on a solid background. */
  caption?: string;
  /** Crop to a fixed ratio instead of the photo's own, e.g. "4 / 3". */
  ratio?: string;
  /** Where the crop is anchored, e.g. "50% 20%". */
  focus?: string;
  /** Flat (no offset shadow), for tight grids and thumbnails. */
  flat?: boolean;
  className?: string;
}

/** A real photo in the comic-panel frame: thick ink border, hard offset shadow, no layout jump. */
export function Photo({
  name,
  sizes = '(max-width: 860px) 100vw, 560px',
  priority = false,
  tilt = false,
  caption,
  ratio,
  focus,
  flat = false,
  className = '',
}: PhotoProps) {
  const p = getPhoto(name);
  const frame: CSSProperties = { backgroundColor: p.dominant };
  const imgStyle: CSSProperties = {};
  if (ratio) {
    imgStyle.aspectRatio = ratio;
    imgStyle.objectFit = 'cover';
    if (focus) imgStyle.objectPosition = focus;
  }
  return (
    <figure
      className={[styles.fig, tilt ? styles.tilt : '', flat ? styles.flat : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.frame} style={frame}>
        <Image
          className={styles.img}
          src={p.src}
          alt={p.alt}
          width={p.width}
          height={p.height}
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={p.blur}
          style={imgStyle}
        />
      </div>
      {caption && <figcaption className={styles.cap}>{caption}</figcaption>}
    </figure>
  );
}
