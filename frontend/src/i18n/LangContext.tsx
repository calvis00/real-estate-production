'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'en' | 'ta';

// ─── All UI strings ───────────────────────────────────────────────────────────
export const translations = {
  en: {
    // Navbar
    nav_home: 'Home',
    nav_properties: 'Properties',
    nav_cities: 'Cities',
    nav_contact: 'Contact',

    // Hero
    hero_tag: 'Trusted Real Estate Platform · Tamil Nadu',
    hero_h1_1: 'Find Your',
    hero_h1_accent: 'Dream Home',
    hero_h1_2: 'Here',
    hero_sub: 'Houses · Plots · Commercial — Buy, Rent or Invest',

    // Search Tabs
    tab_buy: 'Buy',
    tab_rent: 'Rent',
    tab_shoot: 'Shoot / Events',

    // Search Fields
    field_district: 'District',
    field_district_placeholder: 'Select District',
    field_type: 'Property Type',
    field_type_placeholder: 'Any Type',
    field_type_apartment: 'Apartment',
    field_type_villa: 'Villa / House',
    field_type_farmhouse: 'Farmhouse',
    field_type_plot: 'Plot',
    field_name: 'Full Name',
    field_name_placeholder: 'Your Name',
    field_mobile: 'Mobile',
    field_budget: 'Budget Range',

    // CTA
    cta_buy: 'Get Exclusive Listings',
    cta_search: 'Search Properties',
    cta_assurance: 'Free · Direct Contact · Expert Advice',

    // Trust strip
    trust_verified: 'Verified Listings',
    trust_support: 'Tamil Support',
    trust_brokerage: 'Transparent Brokerage',
    trust_sitevisit: 'Site Visit Arranged',

    // Categories
    cat_heading: 'Every Property Type — One Platform',
    cat_sub: 'Houses, plots, commercial spaces — find what fits you',
    cat_all_link: 'All Categories',
    cat_villa: 'Villas',
    cat_apartment: 'Apartments',
    cat_plot: 'Plots',
    cat_commercial: 'Commercial',
    cat_farmhouse: 'Farmhouses',
    cat_unit_one: 'Property',
    cat_unit_many: 'Properties',
    cat_explore: 'Explore',

    // Listings
    listings_h2_1: 'Best Properties',
    listings_h2_accent: 'Available Now',
    listings_sub: 'Fresh Recommendations · Handpicked',

    // Advisory
    advisory_tag: 'Free Consultation',
    advisory_h3_1: 'Planning to',
    advisory_h3_accent: 'Buy a Home?',
    advisory_body: "Share your budget & needs — we'll find the right property. Tamil support available.",
    advisory_body2: '',
    advisory_stat1_val: '99%',
    advisory_stat1_label: 'Customer Trust',
    advisory_stat2_val: '500+',
    advisory_stat2_label: 'Premium Listings',
    advisory_stat3_val: '38',
    advisory_stat3_label: 'TN Districts',

    // Footer
    footer_tagline: 'Trusted real estate platform built for Tamil Nadu.',
    footer_links_title: 'Quick Links',
    footer_link1: 'Residential Sales',
    footer_link2: 'Rentals',
    footer_link3: 'Commercial Space',
    footer_support_title: 'Support',
    footer_faq: 'FAQ',
    footer_privacy: 'Privacy Policy',
    footer_contact: 'Contact Us',
    footer_newsletter_title: 'Newsletter',
    footer_newsletter_sub: 'Get new listings & offers first.',
    footer_newsletter_placeholder: 'Email',
    footer_newsletter_btn: 'Join',
    footer_copy: '© 2024 ABC Premium Real Estate · Built for Tamil Nadu',

    // City page
    city_tag: 'Premium Real Estate Hub',
    city_h1_suffix: 'Properties in',
    city_sub1: 'Discover the finest residential and commercial spaces in',
    city_sub2: '. From luxury villas to high-growth investment plots.',
    city_cta_listings: 'View All Listings',
    city_cta_expert: 'Speak to Expert',
    city_trending: 'Trending in',
    city_trending_sub: 'Handpicked Selection',
    city_see_all: 'See All',
    city_scanning: 'Loading listings…',
    city_empty_h: 'No active listings in',
    city_empty_p: 'We are expanding our portfolio here. Stay tuned!',
    city_empty_link: 'Browse other cities',
    city_why_title: 'Why Invest in',
    city_why_body1: 'has emerged as a premier real estate destination in Tamil Nadu. With robust infrastructure development, proximity to major transport hubs, and a growing presence of international corporations,',
    city_why_body2: 'offers unparalleled value for both end-users and investors.',
    city_trend_title: 'Market Trends',
    city_trend_body: 'The real estate market is seeing a consistent appreciation of 8–12% annually. Premium gated communities and luxury high-rises are the most sought-after segments.',
    city_cta_banner_h: 'Planning to Buy in',
    city_cta_banner_p: "Tell us your budget and needs — we'll find the right property. Tamil support available.",
    city_cta_call: 'Call Now',
    city_cta_whatsapp: 'WhatsApp Us',
  },

  ta: {
    // Navbar
    nav_home: 'முகப்பு',
    nav_properties: 'சொத்துகள்',
    nav_cities: 'நகரங்கள்',
    nav_contact: 'தொடர்பு',

    // Hero
    hero_tag: 'தமிழகத்தின் நம்பகமான சொத்து தளம்',
    hero_h1_1: 'உங்கள்',
    hero_h1_accent: 'கனவு வீட்டை',
    hero_h1_2: 'இங்கே காணுங்கள்',
    hero_sub: 'வீடு · மனை · வணிக வளாகம் — வாங்க, வாடகைக்கு, முதலீட்டிற்கு',

    // Search Tabs
    tab_buy: 'வாங்க',
    tab_rent: 'வாடகை',
    tab_shoot: 'படப்பிடிப்பு / நிகழ்வு',

    // Search Fields
    field_district: 'மாவட்டம்',
    field_district_placeholder: 'மாவட்டம் தேர்வு செய்யுங்கள்',
    field_type: 'சொத்து வகை',
    field_type_placeholder: 'எந்த வகையும்',
    field_type_apartment: 'அடுக்குமாடி',
    field_type_villa: 'வில்லா / வீடு',
    field_type_farmhouse: 'பண்ணை வீடு',
    field_type_plot: 'மனை',
    field_name: 'பெயர்',
    field_name_placeholder: 'உங்கள் பெயர்',
    field_mobile: 'கைபேசி',
    field_budget: 'பட்ஜெட்',

    // CTA
    cta_buy: 'சிறந்த சொத்துகளை பாருங்கள்',
    cta_search: 'தேடுங்கள்',
    cta_assurance: 'இலவசம் · நேரடி தொடர்பு · தமிழில் ஆலோசனை',

    // Trust strip
    trust_verified: 'சரிபார்க்கப்பட்ட சொத்துகள்',
    trust_support: 'தமிழில் பேசலாம்',
    trust_brokerage: 'நேர்மையான தரகு',
    trust_sitevisit: 'தளம் வருகை ஏற்பாடு',

    // Categories
    cat_heading: 'எந்த சொத்தும் — ஒரே இடத்தில்',
    cat_sub: 'வீடு, மனை, வணிக வளாகம் — உங்கள் தேவைக்கு ஏற்ப தேர்வு செய்யுங்கள்',
    cat_all_link: 'அனைத்து வகைகளும்',
    cat_villa: 'வில்லாக்கள்',
    cat_apartment: 'அடுக்குமாடி',
    cat_plot: 'மனை',
    cat_commercial: 'வணிக வளாகம்',
    cat_farmhouse: 'பண்ணை வீடு',
    cat_unit_one: 'சொத்து',
    cat_unit_many: 'சொத்துகள்',
    cat_explore: 'பாருங்கள்',

    // Listings
    listings_h2_1: 'இப்போது கிடைக்கும்',
    listings_h2_accent: 'சிறந்த சொத்துகள்',
    listings_sub: 'தேர்ந்தெடுக்கப்பட்டவை · Fresh Picks',

    // Advisory
    advisory_tag: 'இலவச ஆலோசனை',
    advisory_h3_1: 'வீடு வாங்க',
    advisory_h3_accent: 'திட்டமிடுகிறீர்களா?',
    advisory_body: 'உங்கள் பட்ஜெட், தேவை சொல்லுங்கள் — நாங்கள் சரியான சொத்தை தேடித் தருகிறோம்.',
    advisory_body2: 'தமிழில் பேசலாம்.',
    advisory_stat1_val: '99%',
    advisory_stat1_label: 'வாடிக்கையாளர் நம்பிக்கை',
    advisory_stat2_val: '500+',
    advisory_stat2_label: 'சொத்துகள் பட்டியல்',
    advisory_stat3_val: '38',
    advisory_stat3_label: 'தமிழக மாவட்டங்கள்',

    // Footer
    footer_tagline: 'தமிழகம் முழுவதும் சிறந்த சொத்துகளை இணைக்கும் உங்கள் நம்பகமான தளம்.',
    footer_links_title: 'விரைவு இணைப்புகள்',
    footer_link1: 'வீட்டு விற்பனை',
    footer_link2: 'வாடகை சொத்துகள்',
    footer_link3: 'வணிக வளாகம்',
    footer_support_title: 'உதவி',
    footer_faq: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    footer_privacy: 'தனியுரிமை கொள்கை',
    footer_contact: 'தொடர்பு கொள்ளுங்கள்',
    footer_newsletter_title: 'புதிய சொத்துகள் அறிவிப்பு',
    footer_newsletter_sub: 'புதிய திட்டங்கள், சிறப்பு சலுகைகள் உடனே தெரிந்துகொள்ளுங்கள்.',
    footer_newsletter_placeholder: 'மின்னஞ்சல்',
    footer_newsletter_btn: 'சேரு',
    footer_copy: '© 2024 ABC Premium Real Estate · தமிழகத்திற்காக உருவாக்கப்பட்டது',

    // City page
    city_tag: 'தமிழகத்தின் நம்பகமான சொத்து தளம்',
    city_h1_suffix: 'ல் சொத்துகள்',
    city_sub1: 'சிறந்த வீடுகள், மனைகள், வணிக வளாகங்களை',
    city_sub2: 'ல் கண்டுபிடியுங்கள்.',
    city_cta_listings: 'சொத்துகளை பாருங்கள்',
    city_cta_expert: 'நிபுணரிடம் பேசுங்கள்',
    city_trending: 'இப்போது கிடைக்கும்',
    city_trending_sub: 'தேர்ந்தெடுக்கப்பட்டவை',
    city_see_all: 'அனைத்தும் பாரு',
    city_scanning: 'சொத்துகள் ஏற்றுகிறோம்…',
    city_empty_h: 'தற்போது பட்டியல் இல்லை —',
    city_empty_p: 'இந்த பகுதியில் விரைவில் புதிய சொத்துகள் சேர்க்கப்படும்.',
    city_empty_link: 'மற்ற நகரங்களை பாருங்கள்',
    city_why_title: 'ஏன் முதலிட வேண்டும்?',
    city_why_body1: 'தமிழகத்தின் வளரும் நகரங்களில் ஒன்று. உள்கட்டமைப்பு வளர்ச்சி, போக்குவரத்து வசதி, புதிய தொழில் வாய்ப்புகள் என',
    city_why_body2: 'முதலீட்டிற்கு ஏற்ற இடம்.',
    city_trend_title: 'சந்தை நிலவரம்',
    city_trend_body: 'ஆண்டுக்கு 8–12% மதிப்பு அதிகரிப்பு. புதிய வளர்ச்சி திட்டங்களால் இந்த சந்தை மிகவும் கவர்ச்சிகரமாக உள்ளது.',
    city_cta_banner_h: 'ல் வீடு வாங்க திட்டமிடுகிறீர்களா?',
    city_cta_banner_p: 'உங்கள் பட்ஜெட், தேவை சொல்லுங்கள் — நாங்கள் சரியான சொத்தை தேடித் தருகிறோம். தமிழில் பேசலாம்.',
    city_cta_call: 'இப்போதே அழைக்கவும்',
    city_cta_whatsapp: 'WhatsApp-ல் பேசுங்கள்',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// ─── Context ──────────────────────────────────────────────────────────────────
interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = (key: TranslationKey): string => translations[lang][key] as string;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
