import { redirect } from 'next/navigation';

export default async function SahneDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  redirect(`/oyunlar/${resolved.id}`);
}
