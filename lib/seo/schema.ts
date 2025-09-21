import { BUSINESS_INFO, SERVICES } from './config';

export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": BUSINESS_INFO.name,
  "legalName": BUSINESS_INFO.legalName,
  "description": BUSINESS_INFO.description,
  "url": BUSINESS_INFO.contact.website,
  "logo": `${BUSINESS_INFO.contact.website}/logo.png`,
  "image": `${BUSINESS_INFO.contact.website}/logo.png`,
  "telephone": BUSINESS_INFO.contact.phone,
  "email": BUSINESS_INFO.contact.email,
  "foundingDate": BUSINESS_INFO.foundedYear,
  "industry": BUSINESS_INFO.industry,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": BUSINESS_INFO.address.street,
    "addressLocality": BUSINESS_INFO.address.city,
    "addressRegion": BUSINESS_INFO.address.state,
    "postalCode": BUSINESS_INFO.address.zipCode,
    "addressCountry": BUSINESS_INFO.address.country,
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Monday",
      "opens": "06:00",
      "closes": "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Tuesday",
      "opens": "06:00",
      "closes": "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Wednesday",
      "opens": "06:00",
      "closes": "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Thursday",
      "opens": "06:00",
      "closes": "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Friday",
      "opens": "06:00",
      "closes": "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "07:00",
      "closes": "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "07:00",
      "closes": "21:00",
    },
  ],
  "sameAs": [
    BUSINESS_INFO.social.instagram,
    BUSINESS_INFO.social.twitter,
    BUSINESS_INFO.social.youtube,
    BUSINESS_INFO.social.tiktok,
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "CelebFitLife Services",
    "itemListElement": SERVICES.map((service, index) => ({
      "@type": "Offer",
      "position": index + 1,
      "name": service.name,
      "description": service.description,
      "itemOffered": {
        "@type": "Service",
        "name": service.name,
        "description": service.description,
        "provider": {
          "@type": "Organization",
          "name": BUSINESS_INFO.name,
        },
        "serviceType": "Fitness Training",
        "category": "Health and Fitness",
      },
    })),
  },
});

export const generateWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": BUSINESS_INFO.name,
  "url": BUSINESS_INFO.contact.website,
  "description": BUSINESS_INFO.description,
  "publisher": {
    "@type": "Organization",
    "name": BUSINESS_INFO.name,
    "logo": {
      "@type": "ImageObject",
      "url": `${BUSINESS_INFO.contact.website}/logo.png`,
    },
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BUSINESS_INFO.contact.website}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

export const generateServiceSchema = (serviceName: string) => {
  const service = SERVICES.find(s => s.name === serviceName);
  if (!service) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": BUSINESS_INFO.name,
      "url": BUSINESS_INFO.contact.website,
    },
    "serviceType": "Fitness Training",
    "category": "Health and Fitness",
    "areaServed": {
      "@type": "Country",
      "name": "United States",
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": BUSINESS_INFO.contact.website,
      "serviceSmsNumber": BUSINESS_INFO.contact.phone,
      "serviceLocation": {
        "@type": "VirtualLocation",
        "name": "Online Platform",
        "url": BUSINESS_INFO.contact.website,
      },
    },
  };
};

export const generateFAQSchema = (faqs: Array<{question: string, answer: string}>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
});

export const generateBreadcrumbSchema = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url,
  })),
});

export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${BUSINESS_INFO.contact.website}/#business`,
  "name": BUSINESS_INFO.name,
  "description": BUSINESS_INFO.description,
  "url": BUSINESS_INFO.contact.website,
  "telephone": BUSINESS_INFO.contact.phone,
  "email": BUSINESS_INFO.contact.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": BUSINESS_INFO.address.street,
    "addressLocality": BUSINESS_INFO.address.city,
    "addressRegion": BUSINESS_INFO.address.state,
    "postalCode": BUSINESS_INFO.address.zipCode,
    "addressCountry": BUSINESS_INFO.address.country,
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "34.0522",
    "longitude": "-118.2437",
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "06:00",
      "closes": "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "07:00",
      "closes": "21:00",
    },
  ],
  "paymentAccepted": ["Credit Card", "PayPal", "Apple Pay", "Google Pay"],
  "priceRange": "$$",
  "currenciesAccepted": "USD",
  "image": `${BUSINESS_INFO.contact.website}/logo.png`,
  "logo": `${BUSINESS_INFO.contact.website}/logo.png`,
  "sameAs": [
    BUSINESS_INFO.social.instagram,
    BUSINESS_INFO.social.twitter,
    BUSINESS_INFO.social.youtube,
    BUSINESS_INFO.social.tiktok,
  ],
});
