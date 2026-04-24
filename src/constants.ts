import { Category, Product } from "./types";

export const STORE_INFO = {
  name: "Bella Burger House",
  address: "Timbó, SC",
  status: "Aberto agora",
  openingHours: "18:00 - 23:30",
  deliveryTime: "25–40 min",
  logo: "/logo.png",
  banner:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200&h=600",
  whatsapp: "5522999999999",
};

export const CATEGORIES: Category[] = [
  { id: "all", name: "Todos" },
  { id: "classicos", name: "Clássicos" },
  { id: "especiais", name: "Especiais" },
  { id: "premium", name: "Premium" },
  { id: "combos", name: "Combos" },
  { id: "acompanhamentos", name: "Acompanhamentos" },
  { id: "bebidas", name: "Bebidas" },
];

export const PRODUCTS: Product[] = [
  // ===== CLÁSSICOS (âncora de preço a partir de 18,90) =====
  {
    id: "1",
    name: "Smash Clássico",
    description:
      "Blend bovino 120g smashed, queijo cheddar, picles, molho da casa no pão brioche artesanal",
    price: 18.9,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=800",
    category: "classicos",
    tag: "🔥 Mais pedido",
    ordersToday: 184,
    ratingCount: 612,
  },
  {
    id: "2",
    name: "Cheese Simples",
    description:
      "Hambúrguer 120g, cheddar americano derretido e maionese da casa no pão brioche",
    price: 18.9,
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&q=80&w=800&h=800",
    category: "classicos",
    tag: "💸 Porta de entrada",
    ordersToday: 142,
    ratingCount: 498,
  },
  {
    id: "3",
    name: "Duplo Salada",
    description:
      "Dois smash 120g, alface crocante, tomate, cebola roxa, picles e molho especial",
    price: 21.9,
    image:
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800&h=800",
    category: "classicos",
    ordersToday: 98,
    ratingCount: 287,
  },
  {
    id: "4",
    name: "Cheddar Bacon",
    description:
      "Smash 150g, bacon crocante em lascas, cheddar duplo cremoso e cebola caramelizada",
    price: 23.9,
    image:
      "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800&h=800",
    category: "classicos",
    tag: "😱 Promoção",
    ordersToday: 156,
    ratingCount: 421,
  },

  // ===== ESPECIAIS =====
  {
    id: "5",
    name: "Barbecue Texas",
    description:
      "Smash 150g, molho barbecue defumado na lenha, onion rings crocantes e cheddar",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    ordersToday: 72,
    ratingCount: 198,
  },
  {
    id: "6",
    name: "Chicken Crispy",
    description:
      "Peito de frango empanado duplo, alface americana, tomate e maionese temperada",
    price: 19.9,
    image:
      "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    tag: "Novo",
    ordersToday: 64,
    ratingCount: 142,
  },
  {
    id: "7",
    name: "Jalapeño Fire",
    description:
      "Smash 150g, jalapeños frescos, cream cheese, molho sriracha e cebola roxa",
    price: 22.9,
    image:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    ordersToday: 48,
    ratingCount: 117,
  },
  {
    id: "8",
    name: "Veggie Burger",
    description:
      "Hambúrguer artesanal de grão-de-bico e beterraba, rúcula, tomate e maionese vegana",
    price: 18.9,
    image:
      "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=800&h=800",
    category: "especiais",
    ordersToday: 31,
    ratingCount: 76,
  },

  // ===== PREMIUM =====
  {
    id: "9",
    name: "Bella Signature",
    description:
      "Smash 180g, queijo gruyère importado, bacon artesanal, rúcula, tomate confit e molho trufado",
    price: 32.9,
    image:
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800&h=800",
    category: "premium",
    tag: "⭐ Assinatura",
    ordersToday: 54,
    ratingCount: 182,
  },
  {
    id: "10",
    name: "Black Angus",
    description:
      "Smash 180g de Black Angus maturado, provolone, cebola caramelizada no vinho tinto e mostarda dijon",
    price: 35.9,
    image:
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&q=80&w=800&h=800",
    category: "premium",
    tag: "👑 Top da casa",
    ordersToday: 38,
    ratingCount: 124,
  },

  // ===== COMBOS =====
  {
    id: "11",
    name: "Combo Smash",
    description:
      "Smash Clássico + batata rústica média + refrigerante lata 350ml — economize R$ 6",
    price: 25.9,
    image:
      "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=800&h=800",
    category: "combos",
    tag: "💰 Melhor custo",
    ordersToday: 127,
    ratingCount: 378,
  },
  {
    id: "12",
    name: "Combo Cheddar Bacon",
    description:
      "Cheddar Bacon + batata crinkle média + refrigerante lata 350ml — economize R$ 8",
    price: 29.9,
    image:
      "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=800&h=800",
    category: "combos",
    ordersToday: 94,
    ratingCount: 243,
  },
  {
    id: "13",
    name: "Combo Duplo",
    description:
      "Duplo Salada + batata grande + refrigerante lata 350ml + molho extra — economize R$ 9",
    price: 27.9,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800&h=800",
    category: "combos",
    ordersToday: 68,
    ratingCount: 187,
  },

  // ===== ACOMPANHAMENTOS =====
  {
    id: "14",
    name: "Batata Rústica",
    description:
      "Batata rústica temperada com alecrim e flor de sal, porção 200g",
    price: 6.9,
    image:
      "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&q=80&w=800&h=800",
    category: "acompanhamentos",
    ordersToday: 152,
    ratingCount: 411,
  },
  {
    id: "15",
    name: "Onion Rings",
    description:
      "Anéis de cebola empanados e crocantes com molho ranch, porção 180g",
    price: 7.9,
    image:
      "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=800&h=800",
    category: "acompanhamentos",
    ordersToday: 89,
    ratingCount: 221,
  },
  {
    id: "16",
    name: "Nuggets de Frango",
    description:
      "10 nuggets crocantes com molho barbecue e honey mustard",
    price: 8.9,
    image:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=800",
    category: "acompanhamentos",
    ordersToday: 73,
    ratingCount: 168,
  },

  // ===== BEBIDAS =====
  {
    id: "17",
    name: "Coca-Cola Lata 350ml",
    description: "Refrigerante Coca-Cola gelada, lata 350ml",
    price: 5.0,
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    ordersToday: 312,
    ratingCount: 894,
  },
  {
    id: "18",
    name: "Guaraná Antarctica Lata",
    description: "Refrigerante Guaraná Antarctica, lata 350ml",
    price: 5.0,
    image:
      "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    ordersToday: 188,
    ratingCount: 524,
  },
  {
    id: "19",
    name: "Suco Natural de Laranja",
    description: "Suco de laranja natural 400ml feito na hora",
    price: 7.9,
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    ordersToday: 52,
    ratingCount: 148,
  },
  {
    id: "20",
    name: "Milkshake de Chocolate",
    description:
      "Milkshake cremoso de chocolate belga com chantilly, 400ml",
    price: 9.9,
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800&h=800",
    category: "bebidas",
    tag: "🥤 Queridinho",
    ordersToday: 118,
    ratingCount: 342,
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Camila S.",
    avatar: "https://i.pravatar.cc/150?u=camila",
    rating: 5,
    comment:
      "Smash Clássico por R$ 9,90?! Achei que seria ruim pelo preço e me surpreendi: é MARAVILHOSO! 🔥",
  },
  {
    id: 2,
    name: "Juliana M.",
    avatar: "https://i.pravatar.cc/150?u=juliana",
    rating: 5,
    comment:
      "Peço o Combo Smash toda semana. Custo-benefício imbatível na cidade, chegam em 30 min e quentinho!",
  },
  {
    id: 3,
    name: "Letícia R.",
    avatar: "https://i.pravatar.cc/150?u=leticia",
    rating: 5,
    comment:
      "O Cheddar Bacon derrete na boca. Carne suculenta, bacon crocante e esse preço? Absurdamente bom!",
  },
  {
    id: 4,
    name: "Fernanda L.",
    avatar: "https://i.pravatar.cc/150?u=fernanda",
    rating: 5,
    comment:
      "Bella Signature é outro nível. Ingredientes nobres, carne no ponto e molho trufado viciante. ⭐",
  },
  {
    id: 5,
    name: "Lucas P.",
    avatar: "https://i.pravatar.cc/150?u=lucas",
    rating: 5,
    comment:
      "Batata rústica + Smash + Coca a menos de 17 reais. Abandonei as redes famosas, só peço aqui agora!",
  },
];
