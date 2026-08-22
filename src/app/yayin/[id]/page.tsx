import { redirect } from 'next/navigation';

export default async function YayinDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  redirect(`/kulis/${resolved.id}`);
}
