export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TheaterGroup",
    "name": "FSM Tiyatro",
    "alternateName": "Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü",
    "url": "https://fsmtiyatro.com",
    "logo": "https://fsmtiyatro.com/brand-logo-v1.jpg",
    "description": "Fatih Sultan Mehmet Vakıf Üniversitesi Sağlık, Kültür ve Spor Daire Başkanlığı bünyesinde faaliyet gösteren resmi Sinema ve Tiyatro Kulübüdür.",
    "foundingLocation": {
      "@type": "Place",
      "name": "Haliç Yerleşkesi, Beyoğlu / İstanbul"
    },
    "parentOrganization": {
      "@type": "EducationalOrganization",
      "name": "Fatih Sultan Mehmet Vakıf Üniversitesi",
      "url": "https://fsm.edu.tr"
    },
    "sameAs": [
      "https://instagram.com/fsmtiyatro",
      "https://twitter.com/fsmtiyatro"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function PlayJsonLd({ play }: { play: any }) {
  if (!play) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "TheaterEvent",
    "name": play.title,
    "description": play.description,
    "image": play.imageUrl ? [play.imageUrl] : ["https://fsmtiyatro.com/brand-logo-v1.jpg"],
    "startDate": play.createdAt || "2026-01-01",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": "FSMVÜ Haliç Yerleşkesi Konferans Salonu",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Beyoğlu",
        "addressRegion": "İstanbul",
        "addressCountry": "TR"
      }
    },
    "performer": {
      "@type": "TheaterGroup",
      "name": "FSM Tiyatro Topluluğu"
    },
    "organizer": {
      "@type": "Organization",
      "name": "FSM Tiyatro",
      "url": "https://fsmtiyatro.com"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://fsmtiyatro.com/biletimi-bul",
      "price": "0",
      "priceCurrency": "TRY",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleJsonLd({ post }: { post: any }) {
  if (!post) return null;

  const isAcademic = post.category === 'Makale' || post.academicMeta?.isAcademic === true;

  const schema = {
    "@context": "https://schema.org",
    "@type": isAcademic ? "ScholarlyArticle" : "Article",
    "headline": post.title,
    "description": post.excerpt || post.content?.substring(0, 160),
    "image": post.imageUrl ? [post.imageUrl] : ["https://fsmtiyatro.com/brand-logo-v1.jpg"],
    "datePublished": post.createdAt,
    "dateModified": post.updatedAt || post.createdAt,
    "author": {
      "@type": "Person",
      "name": post.author || "FSM Tiyatro Araştırma Ekibi",
      "affiliation": {
        "@type": "EducationalOrganization",
        "name": post.academicMeta?.authorAffiliation || "Fatih Sultan Mehmet Vakıf Üniversitesi"
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": post.academicMeta?.publisher || "FSM Tiyatro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://fsmtiyatro.com/brand-logo-v1.jpg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://fsmtiyatro.com/blog/${post.id}`
    },
    ...(isAcademic && post.academicMeta?.abstract ? {
      "abstract": post.academicMeta.abstract,
      "keywords": post.academicMeta.keywords?.join(", ") || "tiyatro, sahne sanatları, dramaturgi",
      "isPartOf": {
        "@type": "Periodical",
        "name": post.academicMeta.journalTitle || "FSM Tiyatro ve Sahne Sanatları Güncesi"
      }
    } : {})
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbsJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
