'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';
import logoDark from '../../assets/Matriz 3D Studio logo branco.png';
import logoLight from '../../assets/Matriz 3D Studio logo preto.png';

type BrandLogoProps = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string;
  variant?: 'theme' | 'light' | 'dark';
};

export default function BrandLogo({ alt = 'Matriz 3D Studio', variant = 'theme', ...props }: BrandLogoProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setDark(root.classList.contains('dark'));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const source = variant === 'dark' || (variant === 'theme' && dark) ? logoDark : logoLight;
  return <Image {...props} src={source} alt={alt} />;
}