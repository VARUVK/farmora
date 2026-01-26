import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'ta' | 'hi';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    prices: 'Market Prices',
    advisory: 'Advisory',
    simulations: 'Profit Simulator',
    settings: 'Settings',
    welcome: 'Welcome back',
    weather: 'Weather Forecast',
    crops: 'My Crops',
    recentPrices: 'Recent Market Prices',
    logout: 'Logout',
    profile: 'Profile',
    selectLanguage: 'Select Language',
    today: 'Today',
    tomorrow: 'Tomorrow',
    nextWeek: 'Next Week',
    sell: 'SELL',
    hold: 'HOLD',
    wait: 'WAIT',
    role: 'Role',
    farmer: 'Farmer',
    trader: 'Trader',
    state: 'State',
    district: 'District',
    loading: 'Loading data...',
    error: 'An error occurred',
    priceTrend: 'Price Trend',
    createSimulation: 'New Simulation',
    expectedProfit: 'Expected Profit',
    riskLevel: 'Risk Level',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    chatPlaceholder: 'Ask about crops, pests, or prices...',
  },
  ta: {
    dashboard: 'முகப்பு',
    prices: 'சந்தை விலைகள்',
    advisory: 'ஆலோசனை',
    simulations: 'இலாப கணிப்பு',
    settings: 'அமைப்புகள்',
    welcome: 'நல்வரவு',
    weather: 'வானிலை முன்னறிவிப்பு',
    crops: 'எனது பயிர்கள்',
    recentPrices: 'சமீபத்திய விலைகள்',
    logout: 'வெளியேறு',
    profile: 'சுயவிவரம்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    today: 'இன்று',
    tomorrow: 'நாளை',
    nextWeek: 'அடுத்த வாரம்',
    sell: 'விற்கவும்',
    hold: 'வைத்திருக்கவும்',
    wait: 'காத்திருக்கவும்',
    role: 'பங்கு',
    farmer: 'விவசாயி',
    trader: 'வியாபாரி',
    state: 'மாநிலம்',
    district: 'மாவட்டம்',
    loading: 'தரவு ஏற்றப்படுகிறது...',
    error: 'பிழை ஏற்பட்டது',
    priceTrend: 'விலை போக்கு',
    createSimulation: 'புதிய கணிப்பு',
    expectedProfit: 'எதிர்பார்க்கப்படும் இலாபம்',
    riskLevel: 'இடர் அளவு',
    low: 'குறைந்த',
    medium: 'நடுத்தர',
    high: 'அதிக',
    chatPlaceholder: 'பயிர்கள், பூச்சிகள் அல்லது விலைகள் பற்றி கேட்கவும்...',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    prices: 'बाजार भाव',
    advisory: 'सलाह',
    simulations: 'लाभ सिमुलेटर',
    settings: 'सेटिंग्स',
    welcome: 'स्वागत हे',
    weather: 'मौसम पूर्वानुमान',
    crops: 'मेरी फसलें',
    recentPrices: 'हाल के भाव',
    logout: 'लॉग आउट',
    profile: 'प्रोफ़ाइल',
    selectLanguage: 'भाषा चुनें',
    today: 'आज',
    tomorrow: 'कल',
    nextWeek: 'अगले सप्ताह',
    sell: 'बेचें',
    hold: 'रोकें',
    wait: 'प्रतीक्षा करें',
    role: 'भूमिका',
    farmer: 'किसान',
    trader: 'व्यापारी',
    state: 'राज्य',
    district: 'जिला',
    loading: 'डेटा लोड हो रहा है...',
    error: 'एक त्रुटि हुई',
    priceTrend: 'मूल्य प्रवृत्ति',
    createSimulation: 'नया सिमुलेशन',
    expectedProfit: 'अपेक्षित लाभ',
    riskLevel: 'जोखिम स्तर',
    low: 'कम',
    medium: 'मध्यम',
    high: 'उच्च',
    chatPlaceholder: 'फसल, कीट या कीमतों के बारे में पूछें...',
  },
};

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => {
        const lang = get().language;
        return translations[lang][key] || key;
      },
    }),
    {
      name: 'farmora-language',
    }
  )
);
