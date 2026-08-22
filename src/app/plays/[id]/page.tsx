import { redirect } from 'next/navigation';

export default async function PlayLegacyRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  redirect(`/sahne/${resolved.id}`);
}
