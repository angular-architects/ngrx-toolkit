import React from 'react';
import styles from './styles.module.css';

export default function MutationsVideo(): React.JSX.Element {
  return (
    <div className={styles.iframeContainer}>    
      <iframe 
        className={styles.responsiveIframe}
        src="https://www.youtube.com/embed/kDGQNizSfa0?start=3257" 
        title="[EN] Webinar: Reactive Angular with the new NgRx Signal Store" 
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerpolicy="strict-origin-when-cross-origin" 
        allowfullscreen>
      </iframe>
    </div>
  );
}
