export const dynamic = 'force-dynamic';
export const revalidate = 0; // ou false

import AdminProductsClient from './AdminProductsClient';

export default function Page() {
  return <AdminProductsClient />;
}
