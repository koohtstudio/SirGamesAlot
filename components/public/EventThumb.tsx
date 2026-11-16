import Image from 'next/image';
import type { PhotoLite } from '@/lib/content/photos';
import styles from './Events.module.css';

/** Small square event photo (or flyer) for cards and history rows. Lazy, fixed box, no layout shift. */
export function EventThumb({ photo }: { photo: PhotoLite }) {
  return (
    <span className={styles.thumb} style={{ backgroundColor: photo.dominant }}>
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="64px"
        placeholder="blur"
        blurDataURL={photo.blur}
      />
    </span>
  );
}
