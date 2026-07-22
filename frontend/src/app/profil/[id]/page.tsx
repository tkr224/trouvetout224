import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PublicProfilPage from './ProfilePageClient';

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/${params.id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return {};
    const json = await res.json();
    const profile = json.data;
    if (!profile) return {};

    const hasShop = profile.shopActive && profile.shopName;
    const name: string = hasShop
      ? profile.shopName
      : `${profile.firstName} ${profile.lastName}`;
    const image: string | undefined =
      profile.shopLogo || profile.shopBanner || profile.avatar || undefined;
    const t = await getTranslations('profil');
    const rawDesc: string = profile.shopDescription || '';
    const description = rawDesc.length > 0
      ? rawDesc.slice(0, 155) + (rawDesc.length > 155 ? '…' : '')
      : t('public.metaDescriptionFallback', { name });

    return {
      title: name,
      description,
      openGraph: {
        title: name,
        description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: name,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function Page() {
  return <PublicProfilPage />;
}
