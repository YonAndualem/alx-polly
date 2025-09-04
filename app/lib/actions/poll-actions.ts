"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper function to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Check if user has admin role in profiles table or use a hardcoded admin email
  const { data: userData } = await supabase.auth.getUser();
  
  // For now, check if user email is in admin list
  // In production, this should be stored in database with proper role management
  const adminEmails = ['admin@alxpolly.com', 'root@alxpolly.com']; // Move to env vars later
  return adminEmails.includes(userData.user?.email || '');
}

// Admin function to get all polls
export async function getAllPolls() {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { polls: [], error: "Authentication required." };
  }

  // Check if user is admin
  if (!(await isUserAdmin(user.id))) {
    return { polls: [], error: "Admin access required." };
  }

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: "Failed to fetch polls." };
  return { polls: data ?? [], error: null };
}

// Admin function to delete any poll
export async function adminDeletePoll(id: string) {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "Authentication required." };
  }

  // Check if user is admin
  if (!(await isUserAdmin(user.id))) {
    return { error: "Admin access required." };
  }

  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: "Failed to delete poll." };
  
  revalidatePath("/admin");
  return { error: null };
}

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation
  if (!question || question.trim().length === 0) {
    return { error: "Question is required." };
  }
  if (question.length > 500) {
    return { error: "Question must be less than 500 characters." };
  }
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }
  if (options.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }
  
  // Validate each option
  for (const option of options) {
    if (!option || option.trim().length === 0) {
      return { error: "All options must have text." };
    }
    if (option.length > 200) {
      return { error: "Options must be less than 200 characters." };
    }
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: "Authentication failed." };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: question.trim(),
      options: options.map(opt => opt.trim()),
    },
  ]);

  if (error) {
    return { error: "Failed to create poll." };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Get user from session for authorization check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: "Poll not found." };
  
  // Check if user has permission to view this poll
  // For now, allow viewing all polls, but restrict editing
  return { poll: data, error: null, canEdit: user?.id === data.user_id };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Input validation
  if (!pollId || typeof optionIndex !== 'number' || optionIndex < 0) {
    return { error: "Invalid vote data." };
  }

  // Verify poll exists and get its options
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found." };
  }

  // Validate option index
  if (optionIndex >= poll.options.length) {
    return { error: "Invalid option selected." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user already voted (if authenticated)
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return { error: "You have already voted on this poll." };
    }
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: "Failed to submit vote." };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: "Authentication failed." };
  }
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Only allow deleting polls owned by the user (unless admin)
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
    
  if (error) return { error: "Failed to delete poll. You can only delete your own polls." };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation
  if (!question || question.trim().length === 0) {
    return { error: "Question is required." };
  }
  if (question.length > 500) {
    return { error: "Question must be less than 500 characters." };
  }
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }
  if (options.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }
  
  // Validate each option
  for (const option of options) {
    if (!option || option.trim().length === 0) {
      return { error: "All options must have text." };
    }
    if (option.length > 200) {
      return { error: "Options must be less than 200 characters." };
    }
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: "Authentication failed." };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Verify ownership before updating
  const { data: existingPoll, error: fetchError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", pollId)
    .single();

  if (fetchError || !existingPoll) {
    return { error: "Poll not found." };
  }

  if (existingPoll.user_id !== user.id) {
    return { error: "You can only edit your own polls." };
  }

  // Update the poll
  const { error } = await supabase
    .from("polls")
    .update({ 
      question: question.trim(), 
      options: options.map(opt => opt.trim()) 
    })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update poll." };
  }

  return { error: null };
}
