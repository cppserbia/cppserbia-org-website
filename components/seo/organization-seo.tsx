interface OrganizationSeoProps {
  baseUrl?: string;
}

export function OrganizationSeo({ baseUrl = 'https://cppserbia.org' }: OrganizationSeoProps) {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": baseUrl,
    "name": "C++ Serbia Community",
    "alternateName": "C++ Serbia",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/images/logo.png`
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Community",
      "url": `${baseUrl}/events`
    },
    "sameAs": [
      "https://www.meetup.com/cpp-serbia/",
      "https://github.com/cppserbia",
      "https://twitter.com/cppserbia",
      "https://www.linkedin.com/company/101931236/"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Belgrade",
      "addressCountry": "Serbia"
    },
    "description": "C++ Serbia is a vibrant community of C++ developers in Serbia, organizing meetups, workshops, and conferences to promote knowledge sharing and networking among C++ enthusiasts."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationData, null, 2),
      }}
    />
  );
}
