'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SharedDictionaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!id) return;
    router.replace(`/?dict=${encodeURIComponent(id)}`);
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <p style={{ color: 'var(--gray-text)' }}>Opening shared dictionary…</p>
    </div>
  );
}
