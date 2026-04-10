import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Plus, 
  Minus, 
  X, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trash2,
  Settings,
  LogOut,
  LogIn,
  Edit,
  Save,
  PlusCircle,
  Check,
  Image as ImageIcon,
  Upload,
  Loader2,
  Crosshair,
  Star,
  Flame,
  Zap,
  TrendingUp,
  Heart,
  Info,
  CreditCard,
  User as UserIcon,
  Lock,
  Package,
  ShieldCheck,
  Award,
  Users,
  Truck
} from "lucide-react";
import { STORE_INFO, CATEGORIES as INITIAL_CATEGORIES, PRODUCTS as INITIAL_PRODUCTS, TESTIMONIALS as INITIAL_TESTIMONIALS } from "./constants";
import { Product, CartItem, Category, Testimonial } from "./types";
import { 
  db, 
  auth, 
  storage,
  googleProvider, 
  OperationType, 
  handleFirestoreError 
} from "./firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { trackPixelEvent, PIXEL_ID, cleanPhone } from "./lib/pixel";

// Error Boundary Component
class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-beige flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-soft-red/10 text-soft-red rounded-3xl flex items-center justify-center mb-6">
            <X size={40} strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black text-chocolate mb-4 tracking-tighter">Ops! Algo deu errado.</h1>
          <p className="text-chocolate/60 mb-8 max-w-md font-medium">
            Desculpe pelo transtorno. Ocorreu um erro inesperado no aplicativo.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-chocolate text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-chocolate/90 transition-all shadow-xl shadow-chocolate/20"
          >
            Recarregar Página
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-8 p-4 bg-white rounded-xl text-left text-xs text-soft-red overflow-auto max-w-full border border-soft-red/10">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente de Upload de Imagem
const ImageUpload = ({ 
  onUpload, 
  currentImage, 
  label, 
  folder = "images" 
}: { 
  onUpload: (url: string) => void, 
  currentImage?: string, 
  label: string,
  folder?: string
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError("Por favor, selecione uma imagem.");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onUpload(url);
    } catch (err) {
      console.error("Erro no upload:", err);
      setError("Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">{label}</label>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-orange-300">
            {currentImage ? (
              <img src={currentImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <ImageIcon className="text-stone-300" size={32} />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="text-white animate-spin" size={24} />
              </div>
            )}
          </div>
          <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl">
            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploading} />
            <div className="flex flex-col items-center gap-1">
              <Upload className="text-white" size={24} />
              <span className="text-[10px] text-white font-bold uppercase">Upload</span>
            </div>
          </label>
        </div>
        <div className="flex-1 space-y-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ou cole a URL da imagem aqui"
              className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm pr-10"
              value={currentImage || ""}
              onChange={e => onUpload(e.target.value)}
            />
            {currentImage && (
              <button 
                type="button"
                onClick={() => onUpload("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 transition-colors"
                title="Remover imagem"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-stone-400 italic">Recomendado: JPG ou PNG até 5MB.</p>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
        </div>
      </div>
    </div>
  );
};

const BRAZIL_STATES = [
  { name: "Acre", uf: "AC" },
  { name: "Alagoas", uf: "AL" },
  { name: "Amapá", uf: "AP" },
  { name: "Amazonas", uf: "AM" },
  { name: "Bahia", uf: "BA" },
  { name: "Ceará", uf: "CE" },
  { name: "Distrito Federal", uf: "DF" },
  { name: "Espírito Santo", uf: "ES" },
  { name: "Goiás", uf: "GO" },
  { name: "Maranhão", uf: "MA" },
  { name: "Mato Grosso", uf: "MT" },
  { name: "Mato Grosso do Sul", uf: "MS" },
  { name: "Minas Gerais", uf: "MG" },
  { name: "Pará", uf: "PA" },
  { name: "Paraíba", uf: "PB" },
  { name: "Paraná", uf: "PR" },
  { name: "Pernambuco", uf: "PE" },
  { name: "Piauí", uf: "PI" },
  { name: "Rio de Janeiro", uf: "RJ" },
  { name: "Rio Grande do Norte", uf: "RN" },
  { name: "Rio Grande do Sul", uf: "RS" },
  { name: "Rondônia", uf: "RO" },
  { name: "Roraima", uf: "RR" },
  { name: "Santa Catarina", uf: "SC" },
  { name: "São Paulo", uf: "SP" },
  { name: "Sergipe", uf: "SE" },
  { name: "Tocantins", uf: "TO" }
];

const COMMON_STREETS = [
  "Rua das Flores", "Avenida Brasil", "Rua Sete de Setembro", "Rua XV de Novembro",
  "Avenida Getúlio Vargas", "Rua São José", "Rua Santo Antônio", "Rua Marechal Deodoro",
  "Rua Tiradentes", "Avenida Independência", "Rua da Paz", "Rua Bela Vista",
  "Avenida Central", "Rua do Comércio", "Rua Santa Luzia", "Rua Dom Pedro II",
  "Rua Rui Barbosa", "Avenida Amazonas", "Rua Bahia", "Rua Minas Gerais",
  "Rua São Paulo", "Rua Rio de Janeiro", "Rua Espírito Santo", "Rua Goiás",
  "Rua Pernambuco", "Rua Ceará", "Rua Maranhão", "Rua Piauí", "Rua Sergipe"
];

// Componente de Card de Produto otimizado para conversão
// Gerar números determinísticos baseados no ID se não existirem
const getDeterministicValue = (id: string, min: number, max: number, seed: number) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), seed);
  return min + (hash % (max - min + 1));
};

const ProductCard = React.memo(({ 
  product, 
  onClick 
}: { 
  product: Product, 
  onClick: () => void 
}) => {
  const rating = 4.9;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="bg-pizza-card rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden premium-card-shadow transition-all duration-500 cursor-pointer group border border-white/5 flex flex-col h-full active:scale-[0.98]"
    >
      <div className="relative aspect-square md:aspect-[4/3] overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pizza-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Tags */}
        {product.tag && (
          <div className="absolute top-2 left-2 md:top-4 md:left-4">
            <div className={`text-white text-[7px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl flex items-center gap-1 md:gap-2 shadow-2xl backdrop-blur-md ${
              product.tag.includes('🔥') ? 'bg-pizza-orange/90' : 
              product.tag.includes('😱') ? 'bg-pizza-red/90' : 'bg-pizza-dark/90'
            }`}>
              {product.tag}
            </div>
          </div>
        )}

        <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hidden md:block">
          <div className="w-12 h-12 bg-pizza-red rounded-2xl flex items-center justify-center text-white shadow-2xl hover:bg-pizza-red/90 transition-all border border-white/10">
            <Plus size={24} strokeWidth={3} />
          </div>
        </div>
      </div>
      
      <div className="p-2 md:p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-0.5 md:mb-2">
          <h3 className="font-display font-black text-white text-[11px] md:text-xl leading-tight group-hover:text-pizza-red transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>
        <p className="text-white/40 text-[9px] md:text-sm line-clamp-1 md:line-clamp-2 mb-1 md:mb-6 font-medium flex-1">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[6px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-0 md:mb-1">A partir de</span>
            <span className="text-sm md:text-2xl font-display font-black text-pizza-red tracking-tighter">
              {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="flex items-center gap-0.5 bg-white/5 text-white px-1 py-0.5 md:px-3 md:py-1.5 rounded-md md:rounded-xl border border-white/10">
            <Star size={8} md:size={14} fill="#FFC700" className="text-pizza-cheese" />
            <span className="text-[8px] md:text-xs font-black">{rating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Componente de Categoria premium
const CategoryButton = React.memo(({ 
  id, 
  name, 
  isActive, 
  onClick 
}: { 
  id: string, 
  name: string, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={`
      px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black whitespace-nowrap transition-all duration-500 relative overflow-hidden group active:scale-95
      ${isActive 
        ? "bg-pizza-red text-white shadow-2xl scale-105" 
        : "bg-pizza-card text-white/40 hover:text-white border border-white/5 hover:border-white/20"}
    `}
  >
    <span className="relative z-10 uppercase tracking-widest">{name}</span>
    {isActive && (
      <motion.div 
        layoutId="activeCategory"
        className="absolute inset-0 bg-gradient-to-r from-pizza-red to-pizza-orange opacity-20"
      />
    )}
  </button>
));

// Componente de Modal de Localização otimizado
const LocationModal = React.memo(({
  show,
  step,
  selectedState,
  selectedCity,
  cities,
  isDetecting,
  isConfirmingLocation,
  onSetState,
  onSetCity,
  onSetStep,
  onConfirm
}: {
  show: boolean,
  step: number,
  selectedState: string,
  selectedCity: string,
  cities: string[],
  isDetecting: boolean,
  isConfirmingLocation: boolean,
  onSetState: (state: string) => void,
  onSetCity: (city: string) => void,
  onSetStep: (step: number) => void,
  onConfirm: () => void
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-pizza-dark/60 backdrop-blur-xl"
          />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-pizza-card rounded-t-[2.5rem] md:rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden border border-white/10 h-[80vh] md:h-auto flex flex-col"
            >
              <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-pizza-red text-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 mx-auto shadow-xl shadow-pizza-red/20 rotate-3 border border-white/10">
                  <MapPin size={40} md:size={48} strokeWidth={2.5} />
                </div>
                
                <h2 className="text-2xl md:text-4xl font-display font-black text-white text-center mb-2 md:mb-3 tracking-tighter leading-tight">
                  Onde você <br /> está agora?
                </h2>
                <p className="text-white/40 text-center text-xs md:text-sm mb-8 md:mb-10 font-medium leading-relaxed">
                  Precisamos da sua localização para garantir que sua pizza chegue <span className="text-pizza-red font-black">quentinha</span> e no tempo certo.
                </p>

                <div className="space-y-5 md:space-y-6">
                  {step === 1 ? (
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 md:ml-6">Selecione seu Estado</label>
                      <div className="relative group">
                        <select 
                          value={selectedState}
                          onChange={(e) => onSetState(e.target.value)}
                          className="w-full bg-pizza-dark border-2 border-white/5 rounded-xl md:rounded-[1.5rem] p-4 md:p-5 outline-none focus:border-pizza-red/20 transition-all appearance-none font-bold text-white shadow-sm text-sm md:text-base"
                        >
                          <option value="" className="bg-pizza-card">Escolha um estado...</option>
                          {BRAZIL_STATES.map(s => (
                            <option key={s.uf} value={s.name} className="bg-pizza-card">{s.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-focus-within:text-pizza-red transition-colors" size={18} md:size={20} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between ml-4 md:ml-6">
                        <label className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Selecione sua Cidade</label>
                        <button onClick={() => onSetStep(1)} className="text-[9px] md:text-[10px] font-black text-pizza-red uppercase tracking-widest hover:underline">Alterar Estado</button>
                      </div>
                      <div className="relative group">
                        <select 
                          value={selectedCity}
                          onChange={(e) => onSetCity(e.target.value)}
                          className="w-full bg-pizza-dark border-2 border-white/5 rounded-xl md:rounded-[1.5rem] p-4 md:p-5 outline-none focus:border-pizza-red/20 transition-all appearance-none font-bold text-white shadow-sm text-sm md:text-base"
                        >
                          <option value="" className="bg-pizza-card">Escolha uma cidade...</option>
                          {cities.map(c => (
                            <option key={c} value={c} className="bg-pizza-card">{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-focus-within:text-pizza-red transition-colors" size={18} md:size={20} />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={onConfirm}
                    disabled={step === 1 ? !selectedState : !selectedCity || isConfirmingLocation}
                    className={`
                      w-full py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-2 md:gap-3 mt-4 md:mt-6 text-base md:text-lg
                      ${(step === 1 ? selectedState : selectedCity) 
                        ? "bg-pizza-red text-white shadow-pizza-red/20 hover:bg-pizza-red/90" 
                        : "bg-white/5 text-white/20 shadow-none cursor-not-allowed"}
                    `}
                  >
                    {isConfirmingLocation ? (
                      <>
                        <Loader2 className="animate-spin" size={20} md:size={24} />
                        <span>Confirmando...</span>
                      </>
                    ) : (
                      <>
                        <span>{step === 1 ? "Próximo Passo" : "Confirmar Localização"}</span>
                        <ChevronRight size={20} md:size={24} strokeWidth={3} />
                      </>
                    )}
                  </button>

                  {isDetecting && (
                    <div className="flex items-center justify-center gap-2 md:gap-3 text-pizza-red/60 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-4 md:mt-6">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-pizza-red rounded-full animate-pulse" />
                      Detectando sua localização...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const CheckoutModal = React.memo(({
  show,
  pixData,
  pixStatus,
  copied,
  customerName,
  customerWhatsapp,
  customerEmail,
  customerDocument,
  customerAddress,
  checkoutError,
  isProcessing,
  cart,
  cartTotal,
  onClose,
  onSetCopied,
  onSetCustomerName,
  onSetCustomerWhatsapp,
  onSetCustomerEmail,
  onSetCustomerDocument,
  onSetCustomerAddress,
  onSetCheckoutError,
  onHandleCheckout,
  onSendWhatsApp
}: {
  show: boolean,
  pixData: any,
  pixStatus: string,
  copied: boolean,
  customerName: string,
  customerWhatsapp: string,
  customerEmail: string,
  customerDocument: string,
  customerAddress: { cep: string, rua: string, numero: string, bairro: string, complemento: string },
  checkoutError: string | null,
  isProcessing: boolean,
  cart: CartItem[],
  cartTotal: number,
  onClose: () => void,
  onSetCopied: (val: boolean) => void,
  onSetCustomerName: (val: string) => void,
  onSetCustomerWhatsapp: (val: string) => void,
  onSetCustomerEmail: (val: string) => void,
  onSetCustomerDocument: (val: string) => void,
  onSetCustomerAddress: (updater: (prev: any) => any) => void,
  onSetCheckoutError: (val: string | null) => void,
  onHandleCheckout: () => void,
  onSendWhatsApp: () => void
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-pizza-dark/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-lg h-[95vh] bg-pizza-dark rounded-t-[3rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border-l border-white/5"
          >
            {/* Header */}
            <div className="px-6 md:px-8 py-4 md:py-6 border-b border-white/5 flex items-center justify-between bg-pizza-card/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 bg-pizza-dark rounded-xl md:rounded-2xl flex items-center justify-center text-white hover:bg-pizza-red transition-all border border-white/5">
                  <ArrowLeft size={20} md:size={24} strokeWidth={3} />
                </button>
                <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-tighter">Finalizar Pedido</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 md:space-y-10 custom-scrollbar">
              {pixData && pixData.code ? (
                <div className="space-y-10 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-[2.5rem] flex items-center justify-center mb-2 shadow-inner border border-green-500/20">
                      <Check size={48} strokeWidth={3} />
                    </div>
                    <h3 className="text-3xl font-display font-black text-white tracking-tighter">Pedido Gerado!</h3>
                    <p className="text-white/40 text-base font-medium">Escaneie o QR Code ou copie o código Pix abaixo para confirmar sua pizza.</p>
                  </div>

                  <div className="bg-pizza-card p-10 rounded-[3rem] flex flex-col items-center gap-8 border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2">
                      {pixStatus === "pending" ? (
                        <div className="flex items-center gap-2 bg-pizza-orange/10 text-pizza-orange px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] animate-pulse border border-pizza-orange/20">
                          <Loader2 className="animate-spin" size={14} />
                          <span>Aguardando Pagamento...</span>
                        </div>
                      ) : pixStatus === "approved" ? (
                        <div className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/20">
                          <CheckCircle2 size={14} />
                          <span>Pagamento Confirmado!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-pizza-red text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-pizza-red/20">
                          <XCircle size={14} />
                          <span>{pixStatus === "expired" ? "Pix Expirado" : "Pagamento Falhou"}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-inner border border-white/10">
                      <img 
                        src={pixData.image || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.code)}`} 
                        alt="QR Code Pix" 
                        className="w-56 h-56 md:w-72 md:h-72" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>

                    <div className="w-full space-y-4">
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Código Pix Copia e Cola</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.code);
                          onSetCopied(true);
                          setTimeout(() => onSetCopied(false), 2000);
                        }}
                        className={`w-full p-6 border-2 rounded-[1.5rem] text-xs font-mono break-all transition-all flex items-center justify-between gap-6 shadow-sm ${
                          copied 
                          ? "bg-green-500/10 border-green-500/20 text-green-500" 
                          : "bg-pizza-dark border-white/5 text-white/60 hover:bg-pizza-dark/80"
                        }`}
                      >
                        <span className="truncate text-left">{pixData.code}</span>
                        <div className={`px-6 py-3 rounded-xl font-sans font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${
                          copied 
                          ? "bg-green-500 text-white" 
                          : "bg-pizza-red text-white shadow-lg shadow-pizza-red/20"
                        }`}>
                          {copied ? "Copiado!" : "Copiar"}
                        </div>
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={onSendWhatsApp}
                    disabled={pixStatus !== "approved"}
                    className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 text-lg ${
                      pixStatus === "approved"
                      ? "bg-green-500 text-white hover:bg-green-600 shadow-green-500/20 scale-105"
                      : "bg-white/5 text-white/10 cursor-not-allowed shadow-none"
                    }`}
                  >
                    {pixStatus === "approved" ? (
                      <><Check size={24} strokeWidth={3} /> Enviar Comprovante</>
                    ) : (
                      "Aguardando Pagamento..."
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {checkoutError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-pizza-red/10 border border-pizza-red/20 p-6 rounded-[2rem] flex items-start gap-5"
                    >
                      <div className="w-10 h-10 bg-pizza-red text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                        <X size={20} strokeWidth={3} />
                      </div>
                      <p className="text-sm text-pizza-red font-bold leading-relaxed">
                        {checkoutError}
                      </p>
                    </motion.div>
                  )}

                  <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-pizza-red/10 text-pizza-red rounded-2xl flex items-center justify-center shadow-sm border border-pizza-red/20">
                        <UserIcon size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-2xl font-display font-black text-white tracking-tighter">Seus Dados</h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Informações para o pedido</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">Nome Completo</label>
                        <input 
                          type="text" 
                          placeholder="Como devemos te chamar?" 
                          className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                          value={customerName}
                          onChange={(e) => onSetCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">WhatsApp</label>
                          <input 
                            type="tel" 
                            placeholder="(00) 00000-0000" 
                            className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                            value={customerWhatsapp}
                            onChange={(e) => onSetCustomerWhatsapp(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">CPF (Para o Pix)</label>
                          <input 
                            type="text" 
                            placeholder="000.000.000-00" 
                            className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                            value={customerDocument}
                            onChange={(e) => onSetCustomerDocument(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-pizza-red/10 text-pizza-red rounded-2xl flex items-center justify-center shadow-sm border border-pizza-red/20">
                        <MapPin size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-2xl font-display font-black text-white tracking-tighter">Entrega</h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Onde entregamos sua pizza</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">CEP</label>
                        <input 
                          type="text" 
                          placeholder="00000-000" 
                          className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                          value={customerAddress.cep}
                          onChange={(e) => onSetCustomerAddress(prev => ({ ...prev, cep: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-3">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">Rua</label>
                          <input 
                            type="text" 
                            placeholder="Nome da rua" 
                            className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                            value={customerAddress.rua}
                            onChange={(e) => onSetCustomerAddress(prev => ({ ...prev, rua: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">Nº</label>
                          <input 
                            type="text" 
                            placeholder="123" 
                            className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                            value={customerAddress.numero}
                            onChange={(e) => onSetCustomerAddress(prev => ({ ...prev, numero: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">Bairro</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Centro" 
                            className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                            value={customerAddress.bairro}
                            onChange={(e) => onSetCustomerAddress(prev => ({ ...prev, bairro: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">Complemento</label>
                          <input 
                            type="text" 
                            placeholder="Apto, Bloco..." 
                            className="w-full p-6 bg-pizza-card border-2 border-white/5 rounded-[1.5rem] outline-none focus:border-pizza-red/20 transition-all font-bold text-white placeholder:text-white/20 shadow-sm"
                            value={customerAddress.complemento}
                            onChange={(e) => onSetCustomerAddress(prev => ({ ...prev, complemento: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8 pb-10">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-pizza-red/10 text-pizza-red rounded-2xl flex items-center justify-center shadow-sm border border-pizza-red/20">
                        <ShoppingBag size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-2xl font-display font-black text-white tracking-tighter">Resumo</h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Confira seu pedido</p>
                      </div>
                    </div>
                    <div className="bg-pizza-card p-8 rounded-[3rem] space-y-6 border border-white/5 shadow-xl">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm font-bold text-white/40 uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span>{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-green-500 uppercase tracking-widest">
                          <span>Entrega</span>
                          <span>Grátis</span>
                        </div>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="flex justify-between items-end">
                        <span className="text-white font-display font-black text-xl tracking-tighter uppercase">Total</span>
                        <span className="text-4xl font-display font-black text-pizza-red tracking-tighter">
                          {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            {!pixData && (
              <div className="p-8 border-t border-white/5 bg-pizza-card/80 backdrop-blur-md">
                <button 
                  disabled={isProcessing || cart.length === 0}
                  onClick={onHandleCheckout}
                  className="w-full bg-pizza-red text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-pizza-red/30 disabled:opacity-50 flex items-center justify-center gap-4 active:scale-[0.98] text-lg group overflow-hidden relative"
                >
                  <span className="relative z-10 flex items-center gap-4">
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>Finalizar e Pagar <ChevronRight size={24} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" /></>
                    )}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
// Componente de Modal de Carrinho otimizado
const CartModal = React.memo(({
  show,
  cart,
  total,
  onClose,
  onRemove,
  onUpdateQuantity,
  onCheckout
}: {
  show: boolean,
  cart: CartItem[],
  total: number,
  onClose: () => void,
  onRemove: (id: string) => void,
  onUpdateQuantity: (id: string, delta: number) => void,
  onCheckout: () => void
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-pizza-dark/60 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="relative w-full max-w-lg h-[95vh] bg-pizza-dark rounded-t-[3rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border-l border-white/5"
          >
            <div className="px-6 md:px-8 py-4 md:py-6 border-b border-white/5 flex items-center justify-between bg-pizza-card/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 bg-pizza-dark rounded-xl md:rounded-2xl flex items-center justify-center text-white hover:bg-pizza-red transition-all border border-white/5">
                  <ArrowLeft size={20} md:size={24} strokeWidth={3} />
                </button>
                <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-tighter">Seu Carrinho</h2>
              </div>
              <div className="bg-pizza-red text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-pizza-red/20">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} itens
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 md:space-y-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-white/10">
                    <ShoppingBag size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-black text-white tracking-tighter">Carrinho Vazio</h3>
                    <p className="text-white/40 font-medium">Que tal adicionar uma pizza deliciosa?</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="bg-pizza-red text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-pizza-red/90 transition-all shadow-xl shadow-pizza-red/20"
                  >
                    Explorar Cardápio
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div 
                    layout
                    key={item.id} 
                    className="flex items-center gap-6 bg-pizza-card p-5 rounded-[2rem] shadow-sm border border-white/5 group"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-display font-black text-white text-lg leading-tight">{item.name}</h4>
                        <button onClick={() => onRemove(item.id)} className="text-white/20 hover:text-pizza-red transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-pizza-red text-lg tracking-tighter">
                          {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <div className="flex items-center bg-pizza-dark rounded-xl p-1 border border-white/5">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg bg-pizza-card flex items-center justify-center text-white shadow-sm hover:bg-pizza-red transition-all border border-white/5"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center font-black text-sm text-white">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg bg-pizza-card flex items-center justify-center text-white shadow-sm hover:bg-pizza-red transition-all border border-white/5"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 border-t border-white/5 bg-pizza-card/80 backdrop-blur-md space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold text-white/40 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-green-500 uppercase tracking-widest">
                    <span>Entrega</span>
                    <span>Grátis</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-white/10">
                    <span className="text-white font-display font-black text-xl tracking-tighter uppercase">Total</span>
                    <span className="text-4xl font-display font-black text-white tracking-tighter">
                      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full bg-pizza-red text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-pizza-red/90 transition-all shadow-2xl shadow-pizza-red/30 flex items-center justify-center gap-3 text-lg group"
                >
                  Ir para o Pagamento <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

// export default function App() {
export default function App() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [orderCompleted, setOrderCompleted] = useState(false);
  
  // Firebase State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState(STORE_INFO);
  const [dataLoaded, setDataLoaded] = useState({
    products: false,
    categories: false,
    settings: false,
    testimonials: false
  });

  const isLoading = !isAuthReady || !dataLoaded.products || !dataLoaded.categories || !dataLoaded.settings || !dataLoaded.testimonials;

  // Admin Form State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingStoreInfo, setEditingStoreInfo] = useState<typeof STORE_INFO | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<"products" | "settings" | "testimonials">("products");

  // Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerAddress, setCustomerAddress] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    complemento: ""
  });
  const [pixData, setPixData] = useState<{ code: string; image: string; transactionId: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [locationStep, setLocationStep] = useState(1); // 1: State, 2: City
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState<{ city: string, state: string } | null>(null);
  const [pixStatus, setPixStatus] = useState<"pending" | "approved" | "expired" | "failed">("pending");
  const [copied, setCopied] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showResetMenuConfirm, setShowResetMenuConfirm] = useState(false);
  const [isResettingMenu, setIsResettingMenu] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [productSaveSuccess, setProductSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  // Calcular total de pedidos hoje para consistência
  const totalOrdersToday = useMemo(() => {
    return products.reduce((acc, p) => {
      return acc + (p.ordersToday || getDeterministicValue(p.id, 2, 9, 42));
    }, 0);
  }, [products]);

  const normalizeString = (str: any) => {
    if (typeof str !== 'string') return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // URL Path Check for Admin View
  useEffect(() => {
    if (window.location.pathname === "/admin") {
      setIsAdminView(true);
    }
  }, []);

  // Sync editingStoreInfo when storeInfo loads if on settings tab
  useEffect(() => {
    if (activeAdminTab === "settings" && !editingStoreInfo && storeInfo) {
      setEditingStoreInfo(storeInfo);
    }
  }, [storeInfo, activeAdminTab, editingStoreInfo]);

  // Geolocation Detection
  const detectLocation = async () => {
    let success = false;
    setIsDetecting(true);
    
    // Services to try in order
    const services = [
      {
        url: 'https://ipapi.co/json/',
        parse: (data: any) => ({
          city: data.city,
          region: data.region_code || data.region
        })
      },
      {
        url: 'https://ipinfo.io/json',
        parse: (data: any) => ({
          city: data.city,
          region: data.region // region is usually the state code or name
        })
      },
      {
        url: 'https://ipwho.is/',
        parse: (data: any) => ({
          city: data.city,
          region: data.region_code || data.region
        })
      },
      {
        url: 'https://ip-api.com/json/',
        parse: (data: any) => ({
          city: data.city,
          region: data.region || data.regionName
        })
      }
    ];

    for (const service of services) {
      try {
        console.log(`[Location] Trying service: ${service.url}`);
        
        let response;
        if (typeof AbortController !== 'undefined') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
          response = await fetch(service.url, { signal: controller.signal });
          clearTimeout(timeoutId);
        } else {
          response = await fetch(service.url);
        }

        if (!response.ok) continue;
        
        const rawData = await response.json();
        const { city, region } = service.parse(rawData);
        
        if (city && region) {
          const stateObj = BRAZIL_STATES.find(s => 
            normalizeString(s.uf) === normalizeString(region) || 
            normalizeString(s.name) === normalizeString(region)
          );

          if (stateObj) {
            console.log(`[Location] Detected: ${city}, ${stateObj.name} via ${service.url}`);
            setDetectedLocation({ city, state: stateObj.name });
            setSelectedState(stateObj.name);
            success = true;
            setLocationStep(2);
            break;
          }
        }
      } catch (error) {
        console.warn(`[Location] Service ${service.url} failed:`, error);
      }
    }
    
    if (!success) {
      console.warn("[Location] All geolocation services failed.");
      setSelectedState("Santa Catarina"); // Default fallback
      setSelectedCity("Timbó"); // Default city as requested
      setLocationStep(1);
    }
    setIsDetecting(false);
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // PIX Status Polling
  useEffect(() => {
    let interval: any;
    if (pixData && pixStatus === "pending") {
      console.log(`[Pix] Starting polling for transaction: ${pixData.transactionId}`);
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/pix/status/${pixData.transactionId}`);
          if (response.ok) {
            const data = await response.json();
            console.log("[Pix] Status check:", data.status);
            if (data.status === "approved" || data.status === "paid") {
              setPixStatus("approved");
              
              // Meta Pixel Purchase (Pix Paid) - Removed to avoid double tracking with handleCheckout
              /*
              trackPixelEvent('Purchase', {
                content_ids: cartRef.current.map(item => item.id),
                num_items: cartRef.current.reduce((acc, item) => acc + item.quantity, 0),
                value: cartTotalRef.current,
                currency: 'BRL',
                transaction_id: pixData.transactionId
              }, {
                em: userRef.current?.email,
                ph: cleanPhone(customerWhatsappRef.current),
                fn: customerNameRef.current.split(' ')[0],
                ln: customerNameRef.current.split(' ').slice(1).join(' '),
                zp: customerAddressRef.current.cep.replace(/\D/g, '')
              });
              */

              clearInterval(interval);
            } else if (data.status === "expired") {
              setPixStatus("expired");
              clearInterval(interval);
            } else if (data.status === "failed") {
              setPixStatus("failed");
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error("[Pix] Error polling status:", error);
        }
      }, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [pixData, pixStatus]);

  // Fetch Cities when State changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedState) return;
      const stateObj = BRAZIL_STATES.find(s => s.name === selectedState);
      if (!stateObj) return;

      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateObj.uf}/municipios`);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          console.error("IBGE API returned non-array data:", data);
          return;
        }

        const cityList = data.map((c: any) => c.nome).sort();
        setCities(cityList);
        
        // Only auto-select if current city is empty or not in the new state's list
        if (!selectedCity || !cityList.includes(selectedCity)) {
          // If detected city is in this state, pre-select it using normalized matching
          if (detectedLocation && normalizeString(detectedLocation.state) === normalizeString(selectedState)) {
            const normalizedDetectedCity = normalizeString(detectedLocation.city);
            
            // 1. Try exact normalized match
            let matchedCity = cityList.find((c: string) => normalizeString(c) === normalizedDetectedCity);
            
            // 2. Try fuzzy match (if detected city is part of a city name in the list)
            if (!matchedCity) {
              matchedCity = cityList.find((c: string) => 
                normalizeString(c).includes(normalizedDetectedCity) || 
                normalizedDetectedCity.includes(normalizeString(c))
              );
            }
            
            if (matchedCity) {
              setSelectedCity(matchedCity);
            } else if (!isDetecting) {
              setSelectedCity(cityList[0] || "");
            }
          } else if (!isDetecting && selectedState) {
            setSelectedCity(cityList[0] || "");
          }
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };
    fetchCities();
  }, [selectedState, detectedLocation, isDetecting]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if admin
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === "admin");
          } else {
            // Default admin check based on email
            const isDefaultAdmin = u.email?.toLowerCase() === "enrrik98765432@gmail.com";
            if (isDefaultAdmin) {
              await setDoc(doc(db, "users", u.uid), {
                email: u.email,
                role: "admin"
              });
              setIsAdmin(true);
            } else {
              await setDoc(doc(db, "users", u.uid), {
                email: u.email,
                role: "user"
              });
              setIsAdmin(false);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${u.uid}`);
        }
      } else {
        setIsAdmin(false);
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Products Listener — FORCED LOCAL MODE (ignores Firestore)
  useEffect(() => {
    setProducts(INITIAL_PRODUCTS);
    setDataLoaded(prev => ({ ...prev, products: true }));
  }, []);

  // Categories Listener
  // Categories — FORCED LOCAL MODE
  useEffect(() => {
    setCategories(INITIAL_CATEGORIES);
    setDataLoaded(prev => ({ ...prev, categories: true }));
  }, []);

  useEffect(() => {
    if (editingProduct) {
      const numericPrice = editingProduct.price || 0;
      const inputPrice = parseFloat(priceInput.replace(',', '.')) || 0;
      
      // Sincroniza apenas se o preço numérico for diferente do que está no input
      // Isso evita resetar o input enquanto o usuário digita (ex: "10,")
      if (numericPrice !== inputPrice || (priceInput === "" && numericPrice !== 0)) {
        setPriceInput(numericPrice.toString().replace('.', ','));
      }
    } else {
      setPriceInput("");
    }
  }, [editingProduct?.id, editingProduct === null]);

  // Meta Pixel PageView
  useEffect(() => {
    console.log('[Meta Pixel] Checking initialization...', { isAuthReady, PIXEL_ID, hasFbq: typeof window.fbq === 'function' });
    if (isAuthReady && PIXEL_ID && typeof window !== 'undefined' && typeof window.fbq === 'function') {
      console.log('[Meta Pixel] Initializing with ID:', PIXEL_ID);
      try {
        window.fbq('init', PIXEL_ID);
        // PageView removed as requested
      } catch (e) {
        console.error('[Meta Pixel] Error during init/PageView:', e);
      }
    }
  }, [isAuthReady, user]);

  // Store Info — FORCED LOCAL MODE
  useEffect(() => {
    setStoreInfo(STORE_INFO);
    setDataLoaded(prev => ({ ...prev, settings: true }));
  }, []);

  // Testimonials — FORCED LOCAL MODE
  useEffect(() => {
    setTestimonials(INITIAL_TESTIMONIALS as unknown as Testimonial[]);
    setDataLoaded(prev => ({ ...prev, testimonials: true }));
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    const source = products.length > 0 ? products : INITIAL_PRODUCTS;
    return source.filter(p => {
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, debouncedSearchQuery, products]);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Refs for tracking data during Pix polling
  const cartRef = React.useRef(cart);
  const cartTotalRef = React.useRef(cartTotal);
  const userRef = React.useRef(user);
  const customerWhatsappRef = React.useRef(customerWhatsapp);
  const customerNameRef = React.useRef(customerName);
  const customerAddressRef = React.useRef(customerAddress);

  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { cartTotalRef.current = cartTotal; }, [cartTotal]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { customerWhatsappRef.current = customerWhatsapp; }, [customerWhatsapp]);
  useEffect(() => { customerNameRef.current = customerName; }, [customerName]);
  useEffect(() => { customerAddressRef.current = customerAddress; }, [customerAddress]);

  const [realisticAddress, setRealisticAddress] = useState("");
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);

  // Dynamic Store Address based on selected city
  const localStoreAddress = useMemo(() => {
    if (selectedCity && selectedState) {
      if (selectedCity.toLowerCase() === "joinville") {
        return "Rua Otto Pfuetzenreuter, 345 - Joinville, SC";
      }
      if (selectedCity.toLowerCase() === "timbo") {
        return "Rua Sete de Setembro, 450 - Timbó, SC";
      }
      if (realisticAddress) {
        return `${realisticAddress} - ${selectedCity}, ${selectedState}`;
      }
      // Return empty while generating to avoid showing random address or loading text
      if (isGeneratingAddress) {
        return "";
      }
      // Fallback if generation fails and we are not loading
      const hash = selectedCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const street = COMMON_STREETS[hash % COMMON_STREETS.length];
      const number = (hash % 900) + 10;
      return `${street}, ${number} - ${selectedCity}, ${selectedState}`;
    }
    return storeInfo.address;
  }, [selectedCity, selectedState, realisticAddress, isGeneratingAddress, storeInfo.address]);

  // Generate realistic address when city changes
  useEffect(() => {
    const generateRealisticAddress = async () => {
      if (selectedCity && selectedState) {
        if (selectedCity.toLowerCase() === "joinville") {
          setRealisticAddress(""); // Not needed for Joinville
          setIsGeneratingAddress(false);
          return;
        }
        setIsGeneratingAddress(true);
        setRealisticAddress(""); // Clear old address immediately
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            throw new Error("Gemini API Key not found in environment.");
          }

          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `Gere um endereço físico REALISTA e VÁLIDO (nome da rua e número) na cidade de ${selectedCity}, ${selectedState}, Brasil. O endereço deve parecer o local de uma pizzaria comercial. Responda APENAS o endereço, sem explicações ou aspas. Exemplo: Rua Sete de Setembro, 450`,
          });
          
          if (response.text) {
            setRealisticAddress(response.text.trim().replace(/\n/g, ' '));
          } else {
            throw new Error("Empty response from Gemini.");
          }
        } catch (error) {
          console.error("Error generating realistic address:", error);
          // Fallback to a generic but plausible address if AI fails
          const streetNames = ["Rua das Flores", "Avenida Central", "Rua São José", "Rua XV de Novembro", "Rua Getúlio Vargas"];
          const randomStreet = streetNames[Math.floor(Math.random() * streetNames.length)];
          const randomNumber = Math.floor(Math.random() * 900) + 10;
          setRealisticAddress(`${randomStreet}, ${randomNumber}`);
        } finally {
          setIsGeneratingAddress(false);
        }
      } else {
        setRealisticAddress("");
        setIsGeneratingAddress(false);
      }
    };

    generateRealisticAddress();
  }, [selectedCity, selectedState]);

  // Handle closing modal when address is ready after confirmation
  useEffect(() => {
    if (!isGeneratingAddress && isConfirmingLocation) {
      setIsConfirmingLocation(false);
      setShowLocationModal(false);
    }
  }, [isGeneratingAddress, isConfirmingLocation]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: Product, quantity: number = 1) => {
    // AddToCart event removed as requested

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setSelectedProduct(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    // Lead and InitiateCheckout events removed as requested

    setCheckoutError(null);
    if (!customerName || !customerWhatsapp || !customerDocument || !customerAddress.rua || !customerAddress.numero || !selectedCity || !selectedState) {
      setCheckoutError("Por favor, preencha todos os campos obrigatórios, incluindo cidade e estado.");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Seu carrinho está vazio.");
      return;
    }

    setIsProcessing(true);

    try {
      const identifier = `ord_${Math.random().toString(36).substring(2, 10)}`;
      const cleanPhoneStr = customerWhatsapp.replace(/\D/g, '');
      const cleanDocument = customerDocument.replace(/\D/g, '');
      const finalAmount = parseFloat(cartTotal.toFixed(2));
      
      // Use fixed email as requested for Poseidon Pay compatibility
      const email = customerEmail || "okfgwujifnwuj@gmail.com";

      // Use fixed, valid data for Poseidon Pay API call as requested
      const clientData = {
        type: "individual",
        name: "Cliente Pix",
        email: "pix@pagamento.com",
        phone: "+5511999999999",
        document: "11144477735", // Valid CPF
        address: {
          zipCode: "01001-000", // Hyphenated CEP
          street: "Praca da Se",
          number: "1",
          complement: "Sede",
          neighborhood: "Se",
          city: "Sao Paulo",
          state: "SP",
          country: "BR"
        }
      };

      // Gera o pagamento via API (Pix)
      const response = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          amount: finalAmount,
          client: clientData,
          products: cart.map(item => ({
            id: String(item.id).substring(0, 50),
            name: item.name.substring(0, 100),
            quantity: Math.floor(item.quantity),
            price: parseFloat(item.price.toFixed(2))
          }))
        })
      });

      const contentType = response.headers.get("content-type");
      let data: any;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON Response:", text);
        const preview = text.substring(0, 100).replace(/[<>]/g, '');
        throw new Error(`Erro do servidor (${response.status}): ${preview || 'Resposta vazia'}`);
      }

      if (!response.ok) {
        console.error("API Error Response:", data);
        let errorMsg = data?.message || "Erro ao gerar Pix.";
        if (data?.details) {
          const formatDetail = (val: any): string => {
            if (typeof val === 'object' && val !== null) {
              return Object.entries(val)
                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join('; ');
            }
            return String(val);
          };

          const detailsStr = Array.isArray(data.details)
            ? data.details.map((d: any) => formatDetail(d)).join(' | ')
            : formatDetail(data.details);
          
          errorMsg += ` Detalhes: ${detailsStr}`;
        }
        throw new Error(errorMsg);
      }

      if (!data || !data.pix) {
        throw new Error("Resposta inválida do servidor de pagamento.");
      }

      let pixImage = data.pix?.base64 || data.pix?.image;
      if (pixImage && !pixImage.startsWith('data:') && !pixImage.startsWith('http')) {
        pixImage = `data:image/png;base64,${pixImage}`;
      }

      const transactionId = data.transactionId || data.identifier || identifier;

      setPixData({
        code: data.pix?.code || "",
        image: pixImage || "",
        transactionId: transactionId
      });

      // Meta Pixel Purchase (Pix Generated)
      // As requested, only track Purchase event.
      trackPixelEvent('Purchase', {
        content_ids: cart.map(item => item.id),
        num_items: cart.reduce((acc, item) => acc + item.quantity, 0),
        value: finalAmount,
        currency: 'BRL',
        transaction_id: transactionId
      }, {
        em: customerEmail || user?.email,
        ph: cleanPhone(customerWhatsapp),
        fn: customerName.split(' ')[0],
        ln: customerName.split(' ').slice(1).join(' '),
        zp: customerAddress.cep.replace(/\D/g, '')
      });
      
      setPixStatus("pending");
      setIsProcessing(false);
      return;

      // Fallback para WhatsApp (se pix falhar ou não for o método - embora aqui só tenha pix)
      sendWhatsAppOrder();
    } catch (error: any) {
      console.error("Checkout error:", error);
      setCheckoutError(error.message || "Ocorreu um erro ao processar seu pagamento. Tente novamente.");
      setIsProcessing(false);
    }
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setPixData(null);
    setCustomerAddress({
      cep: "",
      rua: "",
      numero: "",
      bairro: "",
      complemento: ""
    });
    setCheckoutError(null);
  };

  const sendWhatsAppOrder = () => {
    // Meta Pixel Purchase (WhatsApp Order) - Removed to avoid double tracking with handleCheckout
    /*
    trackPixelEvent('Purchase', {
      content_ids: cart.map(item => item.id),
      num_items: cart.reduce((acc, item) => acc + item.quantity, 0),
      value: cartTotal,
      currency: 'BRL'
    }, {
      em: customerEmail || user?.email,
      ph: cleanPhone(customerWhatsapp),
      fn: customerName.split(' ')[0],
      ln: customerName.split(' ').slice(1).join(' '),
      zp: customerAddress.cep.replace(/\D/g, '')
    });
    */

    const cartItemsText = cart.map(item => 
      `• ${item.quantity}x ${item.name} - ${(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
    ).join('\n');

    const addressText = `${customerAddress.rua}, ${customerAddress.numero}${customerAddress.complemento ? ` - ${customerAddress.complemento}` : ''}${customerAddress.cep ? ` (CEP: ${customerAddress.cep})` : ''}`;

    const message = encodeURIComponent(
      `*Novo Pedido - ${storeInfo.name}*\n\n` +
      `*Cliente:* ${customerName}\n` +
      `*WhatsApp:* ${customerWhatsapp}\n` +
      `*Endereço:* ${addressText}\n` +
      `*Pagamento:* Pix (Gerado)\n\n` +
      `*Itens:*\n${cartItemsText}\n\n` +
      `*Total:* ${cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
    );

    const whatsappUrl = `https://wa.me/${storeInfo.whatsapp || '5522999999999'}?text=${message}`;
    window.open(whatsappUrl, '_blank');

    setOrderCompleted(true);
    setCart([]);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setPixData(null);
  };

  const login = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Popup bloqueado");
      } else {
        setAuthError("Erro no login");
      }
      setTimeout(() => setAuthError(null), 3000);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsAdminView(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Admin Actions
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSaving(true);
    setAdminError(null);
    try {
      if (editingProduct.id) {
        const { id, ...data } = editingProduct;
        // Filter out undefined values for Firestore
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        await updateDoc(doc(db, "products", id), cleanData);
      } else {
        await addDoc(collection(db, "products"), editingProduct);
      }
      setProductSaveSuccess(true);
      setTimeout(() => {
        setProductSaveSuccess(false);
        setEditingProduct(null);
      }, 1500);
    } catch (error: any) {
      console.error("Error saving product:", error);
      setAdminError("Erro ao salvar produto. Verifique sua conexão.");
      handleFirestoreError(error, editingProduct.id ? OperationType.UPDATE : OperationType.CREATE, "products");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setProductToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "products");
    }
  };

  const resetMenu = async () => {
    setIsResettingMenu(true);
    setAdminError(null);
    try {
      const existing = await getDocs(collection(db, "products"));
      await Promise.all(existing.docs.map(d => deleteDoc(doc(db, "products", d.id))));
      await Promise.all(
        INITIAL_PRODUCTS.map(p => {
          const { id, ...rest } = p;
          return addDoc(collection(db, "products"), rest);
        })
      );
      setShowResetMenuConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setAdminError("Erro ao resetar cardápio. Verifique as permissões.");
      handleFirestoreError(error, OperationType.WRITE, "products");
    } finally {
      setIsResettingMenu(false);
    }
  };

  const saveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoreInfo) return;
    setIsSaving(true);
    setAdminError(null);
    try {
      await setDoc(doc(db, "settings", "store"), editingStoreInfo);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setAdminError("Erro ao salvar configurações. Verifique as permissões.");
      handleFirestoreError(error, OperationType.UPDATE, "settings/store");
    } finally {
      setIsSaving(false);
    }
  };

  const saveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    
    setIsSaving(true);
    setAdminError(null);
    try {
      if (editingTestimonial.id) {
        const { id, ...data } = editingTestimonial;
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        await updateDoc(doc(db, "testimonials", id), cleanData);
      } else {
        await addDoc(collection(db, "testimonials"), {
          ...editingTestimonial,
          createdAt: new Date().toISOString()
        });
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingTestimonial(null);
      }, 1500);
    } catch (error: any) {
      console.error("Error saving testimonial:", error);
      setAdminError("Erro ao salvar feedback.");
      handleFirestoreError(error, editingTestimonial.id ? OperationType.UPDATE : OperationType.CREATE, "testimonials");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      await deleteDoc(doc(db, "testimonials", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "testimonials");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p className="text-stone-500 font-medium animate-pulse">Carregando cardápio...</p>
      </div>
    );
  }

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-beige flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-orange-cta/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-chocolate/5 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="w-32 h-32 bg-white text-green-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-chocolate/5 relative z-10"
        >
          <CheckCircle2 size={64} strokeWidth={2.5} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-4xl font-black text-chocolate tracking-tighter mb-4 leading-none uppercase">
            Pedido <br /> <span className="text-orange-cta">Confirmado!</span>
          </h1>
          <p className="text-chocolate/60 font-bold tracking-tight mb-12 leading-relaxed">
            Sua doçura já está sendo preparada com todo amor. <br />
            Fique de olho no seu WhatsApp para atualizações!
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setOrderCompleted(false)}
              className="w-full bg-orange-cta text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-orange-cta/90 transition-all shadow-2xl shadow-orange-cta/30 active:scale-[0.98] text-lg flex items-center justify-center gap-3"
            >
              Voltar ao Cardápio <ChevronRight size={24} strokeWidth={3} />
            </button>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              Obrigado por escolher a {storeInfo.name}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAdminView) {
    if (!import.meta.env.DEV && !isAuthReady) {
      return (
        <div className="min-h-screen bg-pizza-dark flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 border-4 border-white/10 border-t-pizza-red rounded-full animate-spin mb-4"></div>
          <p className="text-white/40 font-medium animate-pulse">Verificando acesso...</p>
        </div>
      );
    }

    if (!import.meta.env.DEV && !user) {
      return (
        <div className="min-h-screen bg-pizza-dark flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-pizza-red/5 via-transparent to-transparent" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md bg-pizza-card p-10 rounded-[3rem] shadow-2xl border border-white/5 text-center"
          >
            <div className="w-20 h-20 bg-pizza-red/10 text-pizza-red rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-pizza-red/20">
              <Lock size={40} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">Acesso Restrito</h1>
            <p className="text-white/40 font-bold text-sm uppercase tracking-widest mb-10">Área exclusiva para administradores</p>
            
            {authError && (
              <div className="mb-6 p-4 bg-pizza-red/10 text-pizza-red rounded-2xl text-xs font-black uppercase tracking-widest border border-pizza-red/20">
                {authError}
              </div>
            )}

            <button 
              onClick={login}
              className="w-full bg-pizza-red text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-pizza-red/90 transition-all shadow-2xl shadow-pizza-red/30 active:scale-[0.98] text-lg flex items-center justify-center gap-3"
            >
              <LogIn size={24} strokeWidth={3} /> Entrar com Google
            </button>
            
            <button 
              onClick={() => {
                setIsAdminView(false);
                window.history.pushState({}, '', '/');
              }}
              className="mt-6 text-white/30 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
            >
              Voltar para o site
            </button>
          </motion.div>
        </div>
      );
    }

    if (!import.meta.env.DEV && !isAdmin) {
      return (
        <div className="min-h-screen bg-pizza-dark flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-pizza-red/5 via-transparent to-transparent" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-pizza-card p-10 rounded-[3rem] shadow-2xl border border-white/5 text-center"
          >
            <div className="w-20 h-20 bg-pizza-red/10 text-pizza-red rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-pizza-red/20">
              <XCircle size={40} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">Acesso Negado</h1>
            <p className="text-white/40 font-bold text-sm uppercase tracking-widest mb-10">Você não tem permissão de administrador</p>
            
            <button 
              onClick={logout}
              className="w-full bg-pizza-dark text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-pizza-red transition-all shadow-2xl active:scale-[0.98] text-lg flex items-center justify-center gap-3 border border-white/5"
            >
              <LogOut size={24} strokeWidth={3} /> Sair da Conta
            </button>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-pizza-dark p-4 md:p-12 font-sans text-white">
        <div className="max-w-6xl mx-auto">
          {/* Admin Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  setIsAdminView(false);
                  window.history.pushState({}, '', '/');
                }}
                className="w-12 h-12 bg-pizza-card rounded-2xl flex items-center justify-center text-white shadow-xl hover:bg-pizza-red transition-all border border-white/5"
              >
                <ArrowLeft size={24} strokeWidth={3} />
              </button>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Painel <span className="text-pizza-red">Admin</span></h1>
                <p className="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">Gerencie sua loja com facilidade</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-pizza-card p-2 rounded-3xl shadow-xl border border-white/5">
              <div className="flex items-center gap-3 px-4">
                <div className="w-10 h-10 bg-pizza-dark rounded-xl flex items-center justify-center text-white border border-white/5">
                  <UserIcon size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Logado como</span>
                  <span className="text-sm font-black text-white tracking-tight">{user?.email}</span>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="w-12 h-12 bg-pizza-red/10 text-pizza-red rounded-2xl flex items-center justify-center hover:bg-pizza-red hover:text-white transition-all border border-pizza-red/20"
                title="Sair"
              >
                <LogOut size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Tabs */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-pizza-card p-2 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-row lg:flex-col gap-2">
                <button 
                  onClick={() => setActiveAdminTab("products")}
                  className={`flex-1 flex items-center gap-4 p-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all ${
                    activeAdminTab === "products" 
                    ? "bg-pizza-red text-white shadow-2xl shadow-pizza-red/30" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <ShoppingBag size={18} strokeWidth={3} /> <span className="hidden md:inline">Produtos</span>
                </button>
                <button 
                  onClick={() => {
                    if (activeAdminTab !== "settings") {
                      setActiveAdminTab("settings");
                      setEditingStoreInfo(storeInfo);
                    }
                  }}
                  className={`flex-1 flex items-center gap-4 p-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all ${
                    activeAdminTab === "settings" 
                    ? "bg-pizza-red text-white shadow-2xl shadow-pizza-red/30" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Settings size={18} strokeWidth={3} /> <span className="hidden md:inline">Configurações</span>
                </button>
                <button 
                  onClick={() => setActiveAdminTab("testimonials")}
                  className={`flex-1 flex items-center gap-4 p-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all ${
                    activeAdminTab === "testimonials" 
                    ? "bg-pizza-red text-white shadow-2xl shadow-pizza-red/30" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Users size={18} strokeWidth={3} /> <span className="hidden md:inline">Feedbacks</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              {activeAdminTab === "products" ? (
                <>
                <div className="mb-8 flex items-center justify-between bg-pizza-card p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Resetar cardápio</h3>
                    <p className="text-xs text-white/40 font-bold mt-1">Apaga todos os produtos e recarrega o cardápio padrão de pizzas.</p>
                  </div>
                  <button
                    onClick={() => setShowResetMenuConfirm(true)}
                    disabled={isResettingMenu}
                    className="px-6 py-4 bg-pizza-red text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-pizza-red/90 transition-all border border-pizza-red/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isResettingMenu ? "Resetando..." : "Resetar agora"}
                  </button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  {/* Form Column */}
                  <div className="xl:col-span-5">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-pizza-card p-8 rounded-[3rem] shadow-2xl border border-white/5 sticky top-12"
                    >
                      <h2 className="text-2xl font-display font-black text-white tracking-tighter mb-8 flex items-center gap-3 uppercase">
                        <div className="w-10 h-10 bg-pizza-dark rounded-xl flex items-center justify-center text-pizza-red border border-white/5">
                          {editingProduct?.id ? <Edit size={20} strokeWidth={3} /> : <PlusCircle size={20} strokeWidth={3} />}
                        </div>
                        {editingProduct?.id ? "Editar Produto" : "Novo Produto"}
                      </h2>

                      {adminError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-pizza-red/10 text-pizza-red rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-pizza-red/20 mb-6"
                        >
                          {adminError}
                        </motion.div>
                      )}
                      
                      <form onSubmit={saveProduct} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Nome do Produto</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ex: Pizza de Calabresa"
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-bold text-white placeholder:text-white/10"
                            value={editingProduct?.name || ""}
                            onChange={e => setEditingProduct(prev => ({ ...(prev || {}), name: e.target.value }))}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Preço (R$)</label>
                            <input 
                              type="text" 
                              required
                              placeholder="0,00"
                              className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-black text-white placeholder:text-white/10"
                              value={priceInput}
                              onChange={e => {
                                const rawVal = e.target.value;
                                // Allow only numbers and one comma/dot
                                if (/^[0-9]*[.,]?[0-9]*$/.test(rawVal) || rawVal === "") {
                                  setPriceInput(rawVal);
                                  const numericVal = parseFloat(rawVal.replace(',', '.')) || 0;
                                  setEditingProduct(prev => ({ ...(prev || {}), price: numericVal }));
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Categoria</label>
                            <select 
                              required
                              className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-bold text-white appearance-none cursor-pointer"
                              value={editingProduct?.category || ""}
                              onChange={e => setEditingProduct(prev => ({ ...(prev || {}), category: e.target.value }))}
                            >
                              <option value="" className="bg-pizza-card">Selecione...</option>
                              {categories.map(c => <option key={c.id} value={c.id} className="bg-pizza-card">{c.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Descrição</label>
                          <textarea 
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-medium text-white placeholder:text-white/10 h-32 resize-none"
                            placeholder="Descreva os ingredientes da pizza..."
                            value={editingProduct?.description || ""}
                            onChange={e => setEditingProduct(prev => ({ ...(prev || {}), description: e.target.value }))}
                          />
                        </div>

                        <ImageUpload 
                          label="Foto do Produto"
                          currentImage={editingProduct?.image}
                          onUpload={url => setEditingProduct(prev => ({ ...(prev || {}), image: url }))}
                          folder="products"
                        />

                        <div className="pt-4">
                          {productSaveSuccess && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-green-500/10 text-green-500 rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-green-500/20 mb-4"
                            >
                              Produto salvo com sucesso!
                            </motion.div>
                          )}
                          <div className="flex gap-3">
                            <button 
                              type="submit"
                              disabled={isSaving}
                              className="flex-1 bg-pizza-red text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-pizza-red/90 transition-all shadow-2xl shadow-pizza-red/30 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isSaving ? (
                                <Loader2 className="animate-spin" size={20} />
                              ) : (
                                <><Save size={20} strokeWidth={3} /> Salvar</>
                              )}
                            </button>
                            {editingProduct?.id && (
                              <button 
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="px-6 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  </div>

                  {/* List Column */}
                  <div className="xl:col-span-7">
                    <div className="bg-pizza-card rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
                      <div className="p-8 border-b border-white/5 bg-white/5">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-tighter">Seu Cardápio</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <tbody className="divide-y divide-white/5">
                            {products.map(p => (
                              <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-white/5">
                                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                                    </div>
                                    <div>
                                      <span className="font-black text-white tracking-tight block leading-none mb-1">{p.name}</span>
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                        {categories.find(c => c.id === p.category)?.name}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <span className="font-black text-pizza-red tracking-tighter text-lg">
                                    {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </span>
                                </td>
                                <td className="p-6 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingProduct(p);
                                        setPriceInput(p.price.toString());
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-pizza-red transition-all border border-white/5"
                                    >
                                      <Edit size={18} strokeWidth={2.5} />
                                    </button>
                                    <button 
                                      onClick={() => setProductToDelete(p.id)}
                                      className="w-10 h-10 rounded-xl bg-pizza-red/10 text-pizza-red hover:bg-pizza-red hover:text-white transition-all border border-pizza-red/20"
                                    >
                                      <Trash2 size={18} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                </>
              ) : activeAdminTab === "testimonials" ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 xl:grid-cols-12 gap-12"
                >
                  {/* Testimonial Form Column */}
                  <div className="xl:col-span-5">
                    <div className="bg-pizza-card p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white/5 sticky top-32">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center text-pizza-red">
                          <PlusCircle size={24} strokeWidth={3} />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">
                          {editingTestimonial?.id ? "Editar Feedback" : "Novo Feedback"}
                        </h3>
                      </div>

                      <form onSubmit={saveTestimonial} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Nome do Cliente</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ex: João Silva"
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-black text-white"
                            value={editingTestimonial?.name || ""}
                            onChange={e => setEditingTestimonial(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Comentário</label>
                          <textarea 
                            required
                            rows={4}
                            placeholder="Descreva o feedback..."
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-bold text-white resize-none"
                            value={editingTestimonial?.comment || ""}
                            onChange={e => setEditingTestimonial(prev => ({ ...prev, comment: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Avaliação (1-5)</label>
                          <div className="flex items-center gap-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditingTestimonial(prev => ({ ...prev, rating: star }))}
                                className={`p-2 transition-all ${editingTestimonial?.rating && editingTestimonial.rating >= star ? 'text-pizza-cheese' : 'text-white/10'}`}
                              >
                                <Star size={32} fill={editingTestimonial?.rating && editingTestimonial.rating >= star ? 'currentColor' : 'none'} strokeWidth={3} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <ImageUpload 
                          label="Avatar do Cliente (Opcional)"
                          currentImage={editingTestimonial?.avatar}
                          onUpload={url => setEditingTestimonial(prev => ({ ...prev, avatar: url }))}
                          folder="testimonials"
                        />

                        <div className="pt-6 flex gap-4">
                          {editingTestimonial && (
                            <button 
                              type="button"
                              onClick={() => setEditingTestimonial(null)}
                              className="flex-1 bg-white/5 text-white/40 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                            >
                              Cancelar
                            </button>
                          )}
                          <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] bg-pizza-red text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-pizza-red/90 transition-all shadow-2xl shadow-pizza-red/30 disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} strokeWidth={3} /> {editingTestimonial?.id ? "Atualizar" : "Salvar"}</>}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Testimonials List Column */}
                  <div className="xl:col-span-7">
                    <div className="space-y-6">
                      {testimonials.length === 0 ? (
                        <div className="bg-pizza-card p-20 rounded-[3rem] border border-dashed border-white/10 text-center">
                          <p className="text-white/20 font-black uppercase tracking-widest">Nenhum feedback cadastrado</p>
                        </div>
                      ) : (
                        testimonials.map((t) => (
                          <motion.div 
                            layout
                            key={t.id}
                            className="bg-pizza-card p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:border-pizza-red/30 transition-all duration-500"
                          >
                            <img 
                              src={t.avatar || "https://i.pravatar.cc/150?u=default"} 
                              alt={t.name} 
                              className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/10 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-black text-lg md:text-xl tracking-tight truncate">{t.name}</h4>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={12} fill={t.rating >= star ? '#FFC700' : 'none'} className={t.rating >= star ? 'text-pizza-cheese' : 'text-white/10'} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-white/40 text-sm md:text-base italic line-clamp-2">"{t.comment}"</p>
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => setEditingTestimonial(t)}
                                className="p-3 bg-white/5 text-white/40 rounded-xl hover:bg-pizza-red hover:text-white transition-all"
                                title="Editar"
                              >
                                <Edit size={18} strokeWidth={3} />
                              </button>
                              <button 
                                onClick={() => deleteTestimonial(t.id)}
                                className="p-3 bg-white/5 text-white/40 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={18} strokeWidth={3} />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="bg-pizza-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                    <h2 className="text-3xl font-display font-black text-white tracking-tighter mb-10 flex items-center gap-4 uppercase">
                      <div className="w-12 h-12 bg-pizza-dark rounded-2xl flex items-center justify-center text-pizza-red border border-white/5">
                        <Settings size={24} strokeWidth={3} />
                      </div>
                      Configurações da Pizzaria
                    </h2>

                    {adminError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-pizza-red/10 text-pizza-red rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-pizza-red/20 mb-8"
                      >
                        {adminError}
                      </motion.div>
                    )}
                    
                    <form onSubmit={saveStoreSettings} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Nome da Pizzaria</label>
                          <input 
                            type="text" 
                            required
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-black text-white"
                            value={editingStoreInfo?.name || ""}
                            onChange={e => setEditingStoreInfo(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">WhatsApp de Vendas</label>
                          <input 
                            type="text" 
                            required
                            placeholder="5547999999999"
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-black text-white"
                            value={editingStoreInfo?.whatsapp || ""}
                            onChange={e => setEditingStoreInfo(prev => prev ? ({ ...prev, whatsapp: e.target.value }) : null)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Endereço Físico</label>
                        <input 
                          type="text" 
                          className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-bold text-white"
                          value={editingStoreInfo?.address || ""}
                          onChange={e => setEditingStoreInfo(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Horário de Funcionamento</label>
                          <input 
                            type="text" 
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-bold text-white"
                            value={editingStoreInfo?.openingHours || ""}
                            onChange={e => setEditingStoreInfo(prev => prev ? ({ ...prev, openingHours: e.target.value }) : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Status Atual</label>
                          <select 
                            className="w-full p-5 bg-pizza-dark border-2 border-white/5 rounded-2xl outline-none focus:border-pizza-red transition-all font-bold text-white appearance-none cursor-pointer"
                            value={editingStoreInfo?.status || ""}
                            onChange={e => setEditingStoreInfo(prev => prev ? ({ ...prev, status: e.target.value }) : null)}
                          >
                            <option value="Aberto" className="bg-pizza-card">Aberto</option>
                            <option value="Fechado" className="bg-pizza-card">Fechado</option>
                            <option value="Em breve" className="bg-pizza-card">Em breve</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ImageUpload 
                          label="Logo da Marca"
                          currentImage={editingStoreInfo?.logo}
                          onUpload={url => setEditingStoreInfo(prev => prev ? ({ ...prev, logo: url }) : null)}
                          folder="store"
                        />
                        <ImageUpload 
                          label="Banner da Loja"
                          currentImage={editingStoreInfo?.banner}
                          onUpload={url => setEditingStoreInfo(prev => prev ? ({ ...prev, banner: url }) : null)}
                          folder="store"
                        />
                      </div>

                      <div className="pt-6">
                        {saveSuccess && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-green-500/10 text-green-500 rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-green-500/20 mb-6"
                          >
                            Configurações atualizadas!
                          </motion.div>
                        )}
                        <button 
                          type="submit"
                          disabled={isSaving}
                          className="w-full bg-pizza-red text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-pizza-red/90 transition-all shadow-2xl shadow-pizza-red/30 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                        >
                          {isSaving ? (
                            <Loader2 className="animate-spin" size={24} />
                          ) : (
                            <><Save size={24} strokeWidth={3} /> Salvar Alterações</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {productToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProductToDelete(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
              >
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-stone-800 text-center mb-2">Excluir Produto?</h3>
                <p className="text-stone-500 text-center text-sm mb-6">
                  Esta ação não pode ser desfeita. O produto será removido permanentemente da sua loja.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setProductToDelete(null)}
                    className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteProduct(productToDelete)}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reset Menu Confirmation Modal */}
        <AnimatePresence>
          {showResetMenuConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isResettingMenu && setShowResetMenuConfirm(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
              >
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-stone-800 text-center mb-2">Resetar cardápio?</h3>
                <p className="text-stone-500 text-center text-sm mb-6">
                  Todos os produtos atuais serão apagados e o cardápio padrão de pizzas será recarregado. Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetMenuConfirm(false)}
                    disabled={isResettingMenu}
                    className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={resetMenu}
                    disabled={isResettingMenu}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isResettingMenu ? <Loader2 className="animate-spin" size={18} /> : "Resetar"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-beige text-chocolate font-sans pb-32 overflow-x-hidden selection:bg-pizza-red selection:text-white touch-manipulation">
      <LocationModal 
        show={showLocationModal}
        step={locationStep}
        selectedState={selectedState}
        selectedCity={selectedCity}
        cities={cities}
        isDetecting={isDetecting}
        isConfirmingLocation={isConfirmingLocation}
        onSetState={setSelectedState}
        onSetCity={setSelectedCity}
        onSetStep={setLocationStep}
        onConfirm={() => {
          if (locationStep === 1) {
            setLocationStep(2);
          } else {
            if (isGeneratingAddress) {
              setIsConfirmingLocation(true);
            } else {
              setShowLocationModal(false);
            }
          }
        }}
      />

      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-pizza-dark/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 md:px-12 md:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-12 md:h-12 bg-pizza-red rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pizza-red/20 rotate-3 group-hover:rotate-0 transition-transform">
            <span className="font-display font-black text-lg md:text-xl">B</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-black text-white text-lg md:text-2xl tracking-tighter leading-none">Bella Massa</h1>
            <div className="flex items-center gap-1 text-white/40 text-[9px] md:text-xs mt-0.5 font-bold uppercase tracking-widest">
              <MapPin size={10} className="text-pizza-red" />
              <span className="truncate max-w-[120px] md:max-w-none">Entregando em {selectedCity || "Timbó"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => cartCount > 0 ? setIsCartOpen(true) : null}
            className="relative w-10 h-10 md:w-14 md:h-14 bg-pizza-card text-white rounded-xl md:rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-pizza-dark/20 group border border-white/5"
          >
            <ShoppingBag size={18} md:size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 md:w-6 md:h-6 bg-pizza-red text-white text-[9px] md:text-[10px] font-black rounded-lg md:rounded-xl flex items-center justify-center shadow-lg border-2 border-pizza-dark">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="pt-24 md:pt-32">
        {/* New Headline Area (Matching Image Layout) */}
        <section className="relative px-4 md:px-6 pt-4 md:pt-12 pb-12 md:pb-16 max-w-4xl mx-auto text-center overflow-visible">
          {/* Background Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square bg-pizza-red/5 rounded-full blur-[80px] md:blur-[120px] -z-10" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 md:gap-8"
          >
            {/* Frete Grátis Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-pizza-red text-white px-6 py-2.5 md:px-10 md:py-4 rounded-full flex items-center gap-2 md:gap-3 shadow-2xl shadow-pizza-red/20 border border-white/10"
            >
              <TrendingUp size={14} md:size={20} strokeWidth={3} />
              <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em]">
                Frete Grátis para {selectedCity || "Timbó"}
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-9xl font-serif font-black text-white tracking-tighter leading-[0.85] drop-shadow-2xl">
              Os mais pedidos <br />
              <span className="text-white/60">de</span> <span className="text-pizza-red">{selectedCity || "Timbó"}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-white/60 font-bold text-xs md:text-xl tracking-tight uppercase tracking-[0.1em]">
              Feitos hoje • Entrega rápida • Amor em cada pedaço
            </p>

            {/* Social Proof Pill */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 md:px-6 md:py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <div className="flex -space-x-2 md:-space-x-3">
                {[1, 2, 3].map((i) => (
                  <img 
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                    className="w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-pizza-dark object-cover"
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <span className="text-[10px] md:text-sm font-black text-white/40 uppercase tracking-widest">
                +43 pedidos hoje
              </span>
            </div>
          </motion.div>
        </section>

        {/* Store Profile Card (Matching Image Layout) */}
        <section className="px-4 md:px-6 mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto bg-pizza-card rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] text-center relative overflow-hidden border border-white/5"
          >
            {/* Logo Container */}
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-24 h-24 md:w-40 md:h-40 bg-pizza-dark rounded-3xl md:rounded-[3rem] shadow-2xl mx-auto mb-6 md:mb-10 p-4 md:p-8 flex items-center justify-center border border-white/5 relative"
            >
              <img 
                src={storeInfo.logo} 
                alt={storeInfo.name} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-pizza-red text-white w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center shadow-xl border-2 md:border-4 border-pizza-dark">
                <Check size={12} md:size={20} strokeWidth={3} />
              </div>
            </motion.div>

            {/* Store Name */}
            <h2 className="text-3xl md:text-6xl font-display font-black text-white mb-4 md:mb-8 tracking-tighter leading-none">
              {storeInfo.name}
            </h2>

            {/* Rating Pill */}
            <div className="inline-flex items-center gap-2 md:gap-3 bg-white/5 text-white px-6 py-2.5 md:px-10 md:py-4 rounded-full border border-white/10 mb-8 md:mb-12 shadow-sm">
              <Star size={16} md:size={24} fill="#FFC700" className="text-pizza-cheese" />
              <span className="font-black text-sm md:text-2xl tracking-tight">4.9 (127 avaliações)</span>
            </div>

            {/* Info Row */}
            <div className="flex flex-col items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 md:gap-3 text-white/40 font-black uppercase tracking-[0.2em] text-[10px] md:text-base">
                <Clock size={16} md:size={24} className="text-pizza-orange" strokeWidth={2.5} />
                <span>30–50 MIN</span>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 bg-pizza-dark px-4 py-3 md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] shadow-sm border border-white/5 hover:border-white/20 transition-all duration-500 max-w-full">
                <button 
                  onClick={() => setShowLocationModal(true)}
                  className="group flex items-center gap-2 md:gap-4 flex-1 min-w-0 text-left"
                >
                  <MapPin size={18} md:size={24} className="text-pizza-red" strokeWidth={2.5} />
                  <span className="text-xs md:text-lg font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
                    {localStoreAddress}
                  </span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localStoreAddress)}`, '_blank');
                  }}
                  className="w-7 h-7 md:w-10 md:h-10 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center text-pizza-red hover:bg-pizza-red hover:text-white transition-all flex-shrink-0"
                >
                  <ChevronRight size={16} md:size={22} strokeWidth={3} />
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4">
                <div className="bg-green-500/10 text-green-500 px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-xs flex items-center gap-2 md:gap-3 border border-green-500/20">
                  <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse" />
                  ABERTO AGORA
                </div>
                <div className="bg-pizza-orange/10 text-pizza-orange px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-xs flex items-center gap-2 md:gap-3 border border-pizza-orange/20">
                  <Package size={14} md:size={20} strokeWidth={2.5} />
                  PRODUÇÃO NO DIA
                </div>
                <div className="bg-white/5 text-white/40 px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-xs flex items-center gap-2 md:gap-3 border border-white/10">
                  <Truck size={14} md:size={20} strokeWidth={2.5} />
                  DELIVERY
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Lista de Produtos Premium */}
        <div className="px-4 md:px-12 max-w-7xl mx-auto mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-1.5 h-6 md:w-2 md:h-8 bg-pizza-red rounded-full" />
                <h3 className="text-2xl md:text-5xl font-display font-black text-white tracking-tighter">
                  {activeCategory === 'all' ? 'Destaques do Dia' : categories.find(c => c.id === activeCategory)?.name}
                </h3>
              </div>
              <p className="text-white/20 font-bold uppercase tracking-[0.2em] text-[9px] md:text-xs ml-3.5 md:ml-5">Sabor inigualável em cada fatia</p>
            </div>
            <div className="flex items-center gap-4 bg-pizza-card p-3 md:p-4 rounded-2xl md:rounded-[2rem] shadow-sm border border-white/5">
              <div className="flex items-center gap-2 text-white/60 text-[10px] md:text-sm font-black uppercase tracking-widest">
                <Clock size={14} md:size={16} className="text-pizza-red" />
                <span>30–50 min</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-500 text-[10px] md:text-sm font-black uppercase tracking-widest">Aberto agora</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => {
                    setSelectedProduct(product);
                    setModalQuantity(1);
                  }} 
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-pizza-beige rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-pizza-dark/20" />
              </div>
              <h3 className="text-xl font-black text-pizza-dark">Nenhum produto encontrado</h3>
              <p className="text-pizza-dark/50">Tente buscar por outro nome ou categoria.</p>
            </div>
          )}
        </div>

        {/* Seção de Feedbacks (Testimonials) */}
        <section className="py-24 bg-pizza-dark overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl md:text-6xl font-display font-black text-white tracking-tighter uppercase mb-6">
                O QUE NOSSOS <span className="text-pizza-orange">CLIENTES</span> DIZEM
              </h2>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={20} md:size={28} fill="#FFC700" className="text-pizza-cheese" />
                  ))}
                </div>
                <p className="text-white/40 text-[10px] md:text-sm font-bold uppercase tracking-[0.3em]">
                  4.9/5 — +2.300 avaliações
                </p>
              </div>
            </div>

            <div className="flex overflow-x-auto pb-12 gap-4 md:gap-8 snap-x no-scrollbar px-4">
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  whileHover={{ y: -8, borderColor: 'rgba(255, 92, 0, 0.3)' }}
                  className="flex-shrink-0 w-[300px] md:w-[450px] bg-pizza-card p-8 md:p-10 rounded-[2.5rem] border border-white/5 snap-center shadow-2xl transition-all duration-500"
                >
                  <div className="flex items-center gap-5 mb-6 md:mb-8">
                    <div className="relative">
                      <img 
                        src={testimonial.avatar || "https://i.pravatar.cc/150?u=default"} 
                        alt={testimonial.name} 
                        className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-pizza-orange/50 object-cover p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-pizza-orange text-white w-5 h-5 md:w-7 md:h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-pizza-card">
                        <Check size={10} md:size={14} strokeWidth={4} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-black text-base md:text-xl tracking-tight">{testimonial.name}</h4>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={12} md:size={16} fill="#FFC700" className={testimonial.rating >= star ? 'text-pizza-cheese' : 'text-white/10'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-white/50 text-sm md:text-lg font-medium leading-relaxed italic">
                    "{testimonial.comment}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Elementos de Confiança Premium */}
        <div className="px-4 md:px-12 max-w-7xl mx-auto mb-12 text-center">
          <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] md:text-sm mb-4">
            Clientes em {selectedCity || "Timbó"} estão pedindo agora
          </p>
          <p className="text-pizza-red font-display font-black text-lg md:text-2xl uppercase tracking-tighter">
            Uma das pizzarias mais bem avaliadas da região
          </p>
        </div>

        <section className="bg-pizza-card border-y border-white/5 py-20 mb-24 px-6 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
            <div className="flex flex-col items-center text-center space-y-5 group">
              <div className="w-16 h-16 bg-pizza-dark rounded-[1.5rem] flex items-center justify-center text-pizza-red shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/5">
                <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-white text-lg uppercase tracking-tighter">Pagamento Seguro</h4>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Pagamento 100% seguro</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-5 group">
              <div className="w-16 h-16 bg-pizza-dark rounded-[1.5rem] flex items-center justify-center text-pizza-orange shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 border border-white/5">
                <CreditCard size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-white text-lg uppercase tracking-tighter">Pix e Cartão</h4>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Aceitamos as principais formas</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-5 group">
              <div className="w-16 h-16 bg-pizza-dark rounded-[1.5rem] flex items-center justify-center text-pizza-red shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/5">
                <Package size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-white text-lg uppercase tracking-tighter">Produção na Hora</h4>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Produção feita na hora</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-5 group">
              <div className="w-16 h-16 bg-pizza-dark rounded-[1.5rem] flex items-center justify-center text-pizza-cheese shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 border border-white/5">
                <Users size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-white text-lg uppercase tracking-tighter">Entrega Rápida</h4>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Entrega rápida na sua casa</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Carrinho Fixo Premium (Bottom) */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[90] p-6 md:p-10 bg-gradient-to-t from-pizza-cream via-pizza-cream/90 to-transparent pointer-events-none"
          >
            <div className="max-w-lg mx-auto pointer-events-auto">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-pizza-dark text-white py-6 px-10 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-pizza-dark/40 flex items-center justify-between group active:scale-95 transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pizza-red to-pizza-orange opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-white/50 font-black tracking-[0.2em] leading-none mb-1">Finalizar Pedido</span>
                    <span className="text-lg">Ver Carrinho</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-8 w-px bg-white/10" />
                  <span className="text-2xl font-display font-black tracking-tighter">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[160] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-pizza-dark/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-pizza-card rounded-t-[3rem] md:rounded-[3rem] overflow-y-auto max-h-[95vh] shadow-2xl border-t border-white/10 custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 md:top-6 right-4 md:right-6 z-20 w-12 h-12 bg-pizza-dark/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl hover:bg-pizza-red transition-all border border-white/10"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <div className="relative h-[40vh] md:h-[450px] overflow-hidden">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pizza-card via-transparent to-transparent" />
              </div>

              <div className="p-8 md:p-10 -mt-12 relative z-10 bg-pizza-card rounded-t-[3rem]">
                <div className="flex flex-col gap-6 mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-white/5 text-white px-3 py-1.5 rounded-xl border border-white/10">
                        <Star size={14} fill="#FFC700" className="text-pizza-cheese" />
                        <span className="text-xs font-black">4.9</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-pizza-red text-white px-3 py-1.5 rounded-xl">
                        <TrendingUp size={14} className="text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest">+{selectedProduct.ordersToday || getDeterministicValue(selectedProduct.id, 2, 9, 42)} hoje</span>
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tighter leading-none">
                      {selectedProduct.name}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Preço unitário</span>
                      <span className="text-3xl md:text-4xl font-display font-black text-pizza-red tracking-tighter">
                        {selectedProduct.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-white/50 text-base leading-relaxed font-medium mb-10">
                  {selectedProduct.description}
                </p>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                  <div className="flex items-center justify-between sm:justify-start bg-pizza-dark rounded-[2rem] p-2 border border-white/5 shadow-sm">
                    <button 
                      onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))}
                      className="w-12 h-12 rounded-2xl bg-pizza-card flex items-center justify-center text-white shadow-sm hover:bg-pizza-red transition-all active:scale-90 border border-white/5"
                    >
                      <Minus size={20} strokeWidth={3} />
                    </button>
                    <span className="w-14 text-center font-display font-black text-2xl text-white tracking-tighter">{modalQuantity}</span>
                    <button 
                      onClick={() => setModalQuantity(prev => prev + 1)}
                      className="w-12 h-12 rounded-2xl bg-pizza-card flex items-center justify-center text-white shadow-sm hover:bg-pizza-red transition-all active:scale-90 border border-white/5"
                    >
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      for(let i = 0; i < modalQuantity; i++) {
                        addToCart(selectedProduct);
                      }
                      setSelectedProduct(null);
                      setModalQuantity(1);
                    }}
                    className="flex-1 bg-pizza-red text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-pizza-red/90 transition-all premium-button-shadow active:scale-[0.98] text-lg flex items-center justify-center gap-3"
                  >
                    Adicionar ao Pedido <ChevronRight size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CartModal 
        show={isCartOpen}
        cart={cart}
        total={cartTotal}
        onClose={() => setIsCartOpen(false)}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal 
        show={isCheckoutOpen}
        pixData={pixData}
        pixStatus={pixStatus}
        copied={copied}
        customerName={customerName}
        customerWhatsapp={customerWhatsapp}
        customerEmail={customerEmail}
        customerDocument={customerDocument}
        customerAddress={customerAddress}
        checkoutError={checkoutError}
        isProcessing={isProcessing}
        cart={cart}
        cartTotal={cartTotal}
        onClose={closeCheckout}
        onSetCopied={setCopied}
        onSetCustomerName={setCustomerName}
        onSetCustomerWhatsapp={setCustomerWhatsapp}
        onSetCustomerEmail={setCustomerEmail}
        onSetCustomerDocument={setCustomerDocument}
        onSetCustomerAddress={setCustomerAddress}
        onSetCheckoutError={setCheckoutError}
        onHandleCheckout={handleCheckout}
        onSendWhatsApp={sendWhatsAppOrder}
      />

      {/* Botão Flutuante do Carrinho (Mobile) */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && !isCheckoutOpen && !selectedProduct && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-[90] md:hidden"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-pizza-dark text-white p-5 rounded-[2rem] shadow-2xl shadow-pizza-dark/40 flex items-center justify-between group active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pizza-red rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingBag size={24} strokeWidth={3} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ver Carrinho</span>
                  <span className="text-lg font-display font-black tracking-tighter">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-black tracking-tighter">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <ChevronRight size={20} strokeWidth={3} className="text-pizza-red" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
