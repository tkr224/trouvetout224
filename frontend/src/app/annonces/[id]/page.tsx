import type { Metadata } from 'next';
import AnnonceDetailPage from './AnnonceDetailClient';

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/annonces/${params.id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return {};
    const json = await res.json();
    const annonce = json.data;
    if (!annonce) return {};

    const image: string | undefined = annonce.images?.[0]?.url;
    const price = annonce.price != null
      ? ` · ${annonce.price.toLocaleString('fr-GN')} GNF`
      : '';
    const city = annonce.city?.name ? ` à ${annonce.city.name}` : '';
    const rawDesc = annonce.description || '';
    const description = rawDesc.length > 0
      ? rawDesc.slice(0, 155) + (rawDesc.length > 155 ? '…' : '')
      : `${annonce.title}${price}${city}`;

    return {
      title: annonce.title,
      description,
      openGraph: {
        title: annonce.title,
        description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: annonce.title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function Page() {
  return <AnnonceDetailPage />;
}
