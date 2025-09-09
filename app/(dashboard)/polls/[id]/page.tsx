import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound } from 'next/navigation';
import { PollDetailClient } from './PollDetailClient';

export default async function PollDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const { poll, error, canEdit } = await getPollById(id);

  if (error || !poll) {
    notFound();
  }

  return <PollDetailClient poll={poll} canEdit={canEdit || false} />;
}