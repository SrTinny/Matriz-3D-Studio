export type NavItem = {
  label: string;
  href?: string;
  children?: Array<{ label: string; href: string }>;
};

export const navigation: NavItem[] = [
  { label: 'Sobre', href: '/about' },
];

export default navigation;
