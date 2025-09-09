
import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/lib/actions/auth-actions';
import EditPollForm from './EditPollForm';
import { Suspense } from 'react';

export default async function EditPollPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // Add suspense fallback for async loading
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-8">Loading poll...</div>}>
      <EditPollPageContent params={params} />
    </Suspense>
  );
}

async function EditPollPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { poll, error } = await getPollById(id);
  const user = await getCurrentUser();

  if (error || !poll) {
    notFound();
  }

  // Check if user owns this poll
  if (!user || poll.user_id !== user.id) {
    redirect('/polls');
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Poll</h1>
      <EditPollForm poll={poll} />
    </div>
  );
}