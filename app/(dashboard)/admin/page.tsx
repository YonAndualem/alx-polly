"use client";


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllPolls, adminDeletePoll } from "@/app/lib/actions/poll-actions";

interface Poll {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  options: string[];
}

export default function AdminPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllPolls = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await getAllPolls();
    if (result.error) {
      setError(result.error);
    } else {
      setPolls(result.polls);
    }
    setLoading(false);
  };

  const handleDelete = async (pollId: string) => {
    setDeleteLoading(pollId);
    setError(null);
    setSuccess(null);
    const result = await adminDeletePoll(pollId);
    if (result.error) {
      setError(result.error);
    } else {
      setPolls(polls.filter((poll) => poll.id !== pollId));
      setSuccess('Poll deleted successfully!');
    }
    setDeleteLoading(null);
  };

  if (loading) {
    return <div className="p-6" aria-busy="true">Loading admin panel...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          View and manage all polls in the system. (Admin access required)
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 rounded p-3">
          {success}
        </div>
      )}

      <div className="grid gap-4" role="list" aria-label="All polls">
        {polls.map((poll) => (
          <Card key={poll.id} className="border-l-4 border-l-blue-500" role="listitem">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{poll.question}</CardTitle>
                  <CardDescription>
                    <div className="space-y-1 mt-2">
                      <div>
                        Poll ID:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {poll.id}
                        </code>
                      </div>
                      <div>
                        Owner ID:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {poll.user_id}
                        </code>
                      </div>
                      <div>
                        Created:{" "}
                        {new Date(poll.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(poll.id)}
                  disabled={deleteLoading === poll.id}
                  aria-disabled={deleteLoading === poll.id}
                  aria-label={`Delete poll ${poll.question}`}
                >
                  {deleteLoading === poll.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium">Options:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {poll.options.map((option, index) => (
                    <li key={index} className="text-gray-700">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {polls.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No polls found in the system.
        </div>
      )}
    </div>
  );
}
