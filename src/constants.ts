import { Category, Product } from "./types";

export const STORE_INFO = {
  name: "Pizzaria Bella Massa",
  address: "Timbó, SC",
  status: "Aberto agora",
  openingHours: "18:00 - 23:30",
  deliveryTime: "30–50 min",
  logo: "https://picsum.photos/seed/pizza-logo/200/200",
  banner:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200&h=600",
  whatsapp: "5522999999999",
};

export const CATEGORIES: Category[] = [
  { id: "all", name: "Todas" },
  { id: "tradicionais", name: "Tradicionais" },
  { id: "especiais", name: "Especiais" },
  { id: "premium", name: "Premium" },
  { id: "doces", name: "Doces" },
  { id: "bebidas", name: "Bebidas" },
];

export const PRODUCTS: Product[] = [
  // ===== TRADICIONAIS =====
  {
    id: "1",
    name: "Pizza Calabresa",
    description:
      "Calabresa fatiada, cebola roxa, azeitonas pretas e muçarela derretida",
    price: 39.9,
    image:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800&h=800",
    category: "tradicionais",
    tag: "🔥 Mais pedida",
    ordersToday: 62,
    ratingCount: 214,
  },
  {
    id: "2",
    name: "Pizza Marguerita",
    description:
      "Molho de tomate artesanal, muçarela de búfala, tomate cereja e manjericão fresco",
    price: 42.9,
    image:
      "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=800&h=800",
    category: "tradicionais",
    ordersToday: 48,
    ratingCount: 176,
  },
  {
    id: "3",
    name: "Pizza Portuguesa",
    description:
      "Presunto, ovos, cebola, ervilha, azeitonas pretas e muçarela bem recheada",
    price: 44.9,
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=800&h=800",
    category: "tradicionais",
    ordersToday: 35,
    ratingCount: 121,
  },
  {
    id: "4",
    name: "Pizza Mussarela",
    description:
      "Generosa camada de muçarela derretida, orégano e azeitonas verdes",
    price: 36.9,
    image:
      "https://images.unsplash.com/photo-1548365328-9f547fb0953b?auto=format&fit=crop&q=80&w=800&h=800",
    category: "tradicionais",
    ordersToday: 30,
    ratingCount: 98,
  },
  {
    id: "5",
    name: "Pizza Frango com Catupiry",
    description:
      "Frango desfiado temperado, catupiry original super cremoso e milho",
    price: 45.9,
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=800",
    category: "tradicionais",
    tag: "😱 Promoção",
    ordersToday: 54,
    ratingCount: 189,
  },

  // ===== ESPECIAIS =====
  {
    id: "6",
    name: "Pizza Quatro Queijos",
    description:
      "Muçarela, provolone, parmesão e gorgonzola — um clássico irresistível",
    price: 48.9,
    image:
      "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    ordersToday: 41,
    ratingCount: 157,
  },
  {
    id: "7",
    name: "Pizza Pepperoni",
    description:
      "Pepperoni importado fatiado, muçarela, orégano e pitada de pimenta calabresa",
    price: 49.9,
    image:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    tag: "Novo",
    ordersToday: 38,
    ratingCount: 102,
  },
  {
    id: "8",
    name: "Pizza Bacon Supreme",
    description:
      "Bacon crocante, cebola caramelizada, muçarela e um toque de alho poró",
    price: 47.9,
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    ordersToday: 29,
    ratingCount: 87,
  },
  {
    id: "9",
    name: "Pizza Vegetariana",
    description:
      "Abobrinha, berinjela, pimentão, tomate cereja, rúcula e muçarela",
    price: 44.9,
    image:
      "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    ordersToday: 22,
    ratingCount: 68,
  },

  // ===== PREMIUM =====
  {
    id: "10",
    name: "Pizza Parma",
    description:
      "Presunto parma, rúcula selvagem, muçarela de búfala e lascas de parmesão",
    price: 59.9,
    image:
      "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=800&h=800",
    category: "premium",
    tag: "⭐ Premium",
    ordersToday: 18,
    ratingCount: 54,
  },
  {
    id: "11",
    name: "Pizza Camarão ao Catupiry",
    description:
      "Camarões salteados no alho, catupiry, muçarela e cebolinha fresca",
    price: 69.9,
    image:
      "https://images.unsplash.com/photo-1555072956-7758afb20e8f?auto=format&fit=crop&q=80&w=800&h=800",
    category: "premium",
    ordersToday: 14,
    ratingCount: 41,
  },
  {
    id: "12",
    name: "Pizza Trufada de Cogumelos",
    description:
      "Mix de cogumelos frescos, muçarela, creme trufado e azeite aromatizado",
    price: 64.9,
    image:
      "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&q=80&w=800&h=800",
    category: "premium",
    ordersToday: 11,
    ratingCount: 33,
  },

  // ===== DOCES =====
  {
    id: "13",
    name: "Pizza Chocolate com Morango",
    description:
      "Chocolate ao leite derretido, morangos frescos e raspas de chocolate branco",
    price: 39.9,
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800&h=800",
    category: "doces",
    tag: "🍓 Favorita",
    ordersToday: 25,
    ratingCount: 92,
  },
  {
    id: "14",
    name: "Pizza Romeu e Julieta",
    description:
      "Muçarela, goiabada derretida e canela polvilhada — doce clássico brasileiro",
    price: 37.9,
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800&h=800",
    category: "doces",
    ordersToday: 17,
    ratingCount: 58,
  },
  {
    id: "15",
    name: "Pizza Banana com Canela",
    description:
      "Banana caramelizada, leite condensado, canela e toque de açúcar mascavo",
    price: 35.9,
    image:
      "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=800&h=800",
    category: "doces",
    ordersToday: 13,
    ratingCount: 44,
  },
  {
    id: "16",
    name: "Pizza Prestígio",
    description:
      "Chocolate ao leite, coco ralado fresco e leite condensado — irresistível",
    price: 38.9,
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800&h=800",
    category: "doces",
    ordersToday: 16,
    ratingCount: 51,
  },

  // ===== BEBIDAS =====
  {
    id: "17",
    name: "Coca-Cola 2L",
    description: "Refrigerante Coca-Cola garrafa 2 litros bem gelada",
    price: 14.0,
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    ordersToday: 78,
    ratingCount: 312,
  },
  {
    id: "18",
    name: "Guaraná Antarctica 2L",
    description: "Refrigerante Guaraná Antarctica garrafa 2 litros",
    price: 13.0,
    image:
      "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    ordersToday: 42,
    ratingCount: 164,
  },
  {
    id: "19",
    name: "Suco Del Valle 1L",
    description: "Suco de uva, laranja ou maracujá — escolha na observação",
    price: 9.9,
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    ordersToday: 20,
    ratingCount: 71,
  },
  {
    id: "20",
    name: "Água Mineral 500ml",
    description: "Água mineral sem gás gelada",
    price: 4.0,
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    ordersToday: 35,
    ratingCount: 88,
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Camila S.",
    avatar: "https://i.pravatar.cc/150?u=camila",
    rating: 5,
    comment:
      "Melhor pizza que já comi na vida! A de Calabresa é um absurdo de bom! 🔥",
  },
  {
    id: 2,
    name: "Juliana M.",
    avatar: "https://i.pravatar.cc/150?u=juliana",
    rating: 5,
    comment:
      "Peço toda semana, nunca decepciona. A massa é crocante e o recheio é outro nível!",
  },
  {
    id: 3,
    name: "Letícia R.",
    avatar: "https://i.pravatar.cc/150?u=leticia",
    rating: 5,
    comment:
      "Atendimento impecável e a pizza chega sempre quentinha. Super recomendo!",
  },
  {
    id: 4,
    name: "Fernanda L.",
    avatar: "https://i.pravatar.cc/150?u=fernanda",
    rating: 5,
    comment:
      "Desde que descobri, não consigo comer em outro lugar. Viciante demais! ⭐",
  },
  {
    id: 5,
    name: "Lucas P.",
    avatar: "https://i.pravatar.cc/150?u=lucas",
    rating: 5,
    comment:
      "A Parma é espetacular. Ingredientes nobres e massa no ponto perfeito!",
  },
];
