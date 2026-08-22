import { redirect } from 'next/navigation';

export default async function BlogDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  redirect(`/yayin/${resolved.id}`);
}
