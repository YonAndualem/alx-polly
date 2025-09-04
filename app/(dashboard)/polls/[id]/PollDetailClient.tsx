'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { submitVote, deletePoll } from '@/app/lib/actions/poll-actions';
import VulnerableShare from '../vulnerable-share';

interface PollDetailClientProps {
  poll: {
    id: string;
    question: string;
    options: string[];
    user_id: string;
    created_at: string;
  };
  canEdit: boolean;
}

export function PollDetailClient({ poll, canEdit }: PollDetailClientProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteResults, setVoteResults] = useState<any[]>([]);
  const router = useRouter();

  const handleVote = async () => {
    if (selectedOption === null) return;
    
    setIsSubmitting(true);
    
    const result = await submitVote(poll.id, selectedOption);
    
    if (!result.error) {
      setHasVoted(true);
      // In a real app, you would fetch updated vote counts here
      setVoteResults(poll.options.map((option, index) => ({
        text: option,
        votes: Math.floor(Math.random() * 10), // Mock data for now
        percentage: Math.floor(Math.random() * 100)
      })));
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this poll?')) {
      const result = await deletePoll(poll.id);
      if (!result.error) {
        router.push('/polls');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        {canEdit && (
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/polls/${poll.id}/edit`}>Edit Poll</Link>
            </Button>
            <Button 
              variant="outline" 
              className="text-red-500 hover:text-red-700"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVoted ? (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === index ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </div>
              ))}
              <Button 
                onClick={handleVote} 
                disabled={selectedOption === null || isSubmitting} 
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {voteResults.map((result, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{result.text}</span>
                    <span>{result.percentage}% ({result.votes} votes)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Poll ID: {poll.id}</span>
          <span>Created: {new Date(poll.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      <VulnerableShare pollId={poll.id} pollTitle={poll.question} />
    </div>
  );
}
