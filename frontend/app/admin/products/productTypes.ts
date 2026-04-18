export type AdminCategory = {
  id: string;
  name: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  wholesalePrice?: number | null;
  weightGrams?: number | null;
  printHours?: number | null;
  wholesaleEnabled?: boolean;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string | null;
  tag?: string | null;
  category?: AdminCategory | null;
  categoryName?: string | null;
};
