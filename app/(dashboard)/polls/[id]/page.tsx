
import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound } from 'next/navigation';
import { PollDetailClient } from './PollDetailClient';
import { Suspense } from 'react';

export default async function PollDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-8">Loading poll details...</div>}>
      <PollDetailPageContent params={params} />
    </Suspense>
  );
}

async function PollDetailPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { poll, error, canEdit } = await getPollById(id);

  if (error || !poll) {
    notFound();
  }

  return <PollDetailClient poll={poll} canEdit={canEdit || false} />;
}