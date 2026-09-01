import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const slugsToKeep = new Set([
  'charizard',
  'chaveiro-ceara',
  'chaveiro-vasco-da-gama',
  'chaveiro-one-piece-luffy',
  'pokebola',
  'chaveiro-flamengo',
  'majin-boo',
  'kunai',
  'ultraball-pokebola',
  'pokebola-giratina',
  'pokebola-pikachu',
  'pokebola-mega-pikachu',
  'pokebola-bulbasaur',
  'pokebola-umbreon'
]);

const productsData = [
  // 14 itens da imagem (mantendo ou criando)
  { name: 'Charizard ', slug: 'charizard', price: 101.0 },
  { name: 'Chaveiro - Ceará ', slug: 'chaveiro-ceara', price: 7.0 },
  { name: 'Chaveiro - Vasco da Gama ', slug: 'chaveiro-vasco-da-gama', price: 7.0 },
  { name: 'Chaveiro One Piece (Luffy)', slug: 'chaveiro-one-piece-luffy', price: 19.29 },
  { name: 'Pokébola ', slug: 'pokebola', price: 33.25 },
  { name: 'Chaveiro - Flamengo ', slug: 'chaveiro-flamengo', price: 10.0 },
  { name: 'Majin Boo', slug: 'majin-boo', price: 100.0 }, // Atualizado para 100,00
  { name: 'Kunai', slug: 'kunai', price: 15.0 }, // Atualizado para 15,00
  { name: 'UltraBall Pokebola', slug: 'ultraball-pokebola', price: 37.82 },
  { name: 'Pokébola - Giratina ', slug: 'pokebola-giratina', price: 66.37 },
  { name: 'Pokebola - Pikachu', slug: 'pokebola-pikachu', price: 37.77 },
  { name: 'Pokébola - Mega Pikachu', slug: 'pokebola-mega-pikachu', price: 42.61 },
  { name: 'Pokébola - bulbasaur', slug: 'pokebola-bulbasaur', price: 34.99 },
  { name: 'Pokébola - Umbreon', slug: 'pokebola-umbreon', price: 76.76 },

  // Novos itens para adicionar
  { name: 'Vaso Puro - Hollow Knight', price: 100.0 },
  { name: 'Chaveiros chapéu do Luffy', price: 10.0 },
  { name: 'Satoru Gojo', price: 30.0 },
  { name: 'Greninja', price: 100.0 },
  { name: 'Pokebola Bulbasaur', price: 48.0 },
  { name: 'Luffy', price: 100.0 },
  { name: 'Sylveon', price: 70.0 },
  { name: 'Chaveiro nuvem da Akatsuki', price: 10.0 },
  { name: 'Faca do CS', price: 28.0 },
  { name: 'Chaveiro Jujutsu', price: 10.0 },
  { name: 'Sally Face', price: 100.0 },
  { name: 'Pikachu Chibi', price: 30.0 },
  { name: 'Umbreon Chibi', price: 30.0 },
  { name: 'Pokebola Blastoise', price: 60.0 },
  { name: 'Pokebola Squirtle', price: 37.0 },
  { name: 'Going Merry', price: 120.0 },
  { name: 'Pokebola Dratini', price: 32.0 },
  { name: 'Pokebola Kyogre', price: 50.0 },
  { name: 'Chaveiros Hornet - Hollow Knight', price: 10.0 },
  { name: 'Chaveiros Harry Potter', price: 10.0 },
  { name: 'Chaveiros do Snoopy', price: 10.0 },
  { name: 'Chaveiros da Hello Kitty', price: 10.0 },
  { name: 'Chaveiro Laço', price: 10.0 }
];

async function main() {
  console.log('🧹 Limpando pedidos e itens de carrinho antigos...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});

  console.log('🧹 Removendo produtos antigos que não estão na imagem...');
  const allProducts = await prisma.product.findMany({ select: { id: true, slug: true } });
  for (const p of allProducts) {
    if (!slugsToKeep.has(p.slug)) {
      await prisma.product.delete({ where: { id: p.id } });
      console.log(`- Produto removido: ${p.slug}`);
    }
  }

  console.log('🌱 Cadastrando/Atualizando produtos...');
  const activeSlugs = new Set<string>();

  for (const item of productsData) {
    let slug = (item as any).slug || slugify(item.name);
    
    // Evita duplicidade de slugs em tempo de execução
    let counter = 1;
    const baseSlug = slug;
    while (activeSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    activeSlugs.add(slug);

    const price = item.price;
    const stock = 15; // Estoque padrão para demonstração

    await prisma.product.upsert({
      where: { slug },
      update: {
        name: item.name,
        price,
        stock,
      },
      create: {
        name: item.name,
        slug,
        price,
        stock,
        description: `${item.name} impresso em 3D de alta qualidade.`,
      },
    });

    console.log(`+ Upserted: ${item.name} (${slug}) -> R$ ${price}`);
  }

  console.log('🚀 Atualização concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na atualização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
