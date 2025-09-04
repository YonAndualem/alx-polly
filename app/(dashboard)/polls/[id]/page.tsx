import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound } from 'next/navigation';
import { PollDetailClient } from './PollDetailClient';

export default async function PollDetailPage({ params }: { params: { id: string } }) {
  const { poll, error, canEdit } = await getPollById(params.id);

  if (error || !poll) {
    notFound();
  }

  return <PollDetailClient poll={poll} canEdit={canEdit || false} />;
}