export default function sitemap() {
  return [
    {
      url: 'https://familylegends.com',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
  ];
}
