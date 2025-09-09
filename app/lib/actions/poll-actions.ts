"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Determines if a user has administrative privileges in the system.
 * 
 * This function checks if the current user's email is in the predefined list
 * of admin emails. In a production environment, this should be replaced with
 * a database-based role management system.
 * 
 * @param userId - The ID of the user to check (currently unused, kept for future extensibility)
 * @returns Promise<boolean> - True if user has admin privileges, false otherwise
 * 
 * @example
 * ```typescript
 * const isAdmin = await isUserAdmin("user-id-123");
 * if (isAdmin) {
 *   // Allow admin operations
 * }
 * ```
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  // Check if user has admin role in profiles table or use a hardcoded admin email
  const { data: userData } = await supabase.auth.getUser();

  // For security, check if user email is in admin list
  // In production, this should be stored in database with proper role management
  const adminEmails = ['admin@alxpolly.com', 'root@alxpolly.com'];
  // TODO: Move to database-based role management for production
  return adminEmails.includes(userData.user?.email || '');
}

/**
 * Retrieves all polls in the system for administrative purposes.
 * 
 * This function is restricted to users with administrative privileges.
 * It fetches all polls from the database, regardless of ownership,
 * for system administration and moderation purposes.
 * 
 * @returns Promise<{polls: Poll[], error: string | null}> Object containing polls array and potential error
 * 
 * @throws {Error} Returns error object if user lacks admin privileges or database query fails
 * 
 * @example
 * ```typescript
 * const {polls, error} = await getAllPolls();
 * if (error) {
 *   console.error('Admin access required:', error);
 * } else {
 *   console.log(`Found ${polls.length} polls in system`);
 * }
 * ```
 */
export async function getAllPolls(): Promise<{ polls: any[]; error: string | null }> {
  const supabase = await createClient();

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { polls: [], error: "Authentication required." };
  }

  // Check if user is admin - critical security check
  if (!(await isUserAdmin(user.id))) {
    return { polls: [], error: "Admin access required." };
  }

  // Fetch all polls with admin privileges
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: "Failed to fetch polls." };
  return { polls: data ?? [], error: null };
}

/**
 * Deletes any poll in the system (admin-only function).
 * 
 * This administrative function allows authorized admins to delete any poll
 * in the system, regardless of ownership. Used for content moderation
 * and system administration purposes.
 * 
 * @param id - The unique identifier of the poll to delete
 * @returns Promise<{error: string | null}> Object indicating success or failure
 * 
 * @security Requires admin privileges - validates user authorization before deletion
 * 
 * @example
 * ```typescript
 * const result = await adminDeletePoll("poll-uuid-123");
 * if (result.error) {
 *   console.error('Delete failed:', result.error);
 * } else {
 *   console.log('Poll deleted successfully');
 * }
 * ```
 */
export async function adminDeletePoll(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Authentication required." };
  }

  // Critical security check - only admins can delete any poll
  if (!(await isUserAdmin(user.id))) {
    return { error: "Admin access required." };
  }

  // Perform deletion with admin privileges
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: "Failed to delete poll." };

  // Revalidate admin page to refresh the UI
  revalidatePath("/admin");
  return { error: null };
}

/**
 * Creates a new poll with comprehensive validation and security checks.
 * 
 * This function handles the complete poll creation workflow:
 * - Validates and sanitizes all user input
 * - Authenticates the user session
 * - Stores the poll in the database with proper ownership
 * - Revalidates the polls page for immediate UI updates
 * 
 * @param formData - FormData object containing poll question and options
 * @returns Promise<{error: string | null}> Object indicating success or validation errors
 * 
 * @validation
 * - Question: Required, 1-500 characters
 * - Options: 2-10 options, each 1-200 characters
 * - Authentication: User must be logged in
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.set('question', 'What is your favorite color?');
 * formData.append('options', 'Red');
 * formData.append('options', 'Blue');
 * 
 * const result = await createPoll(formData);
 * if (result.error) {
 *   console.error('Poll creation failed:', result.error);
 * }
 * ```
 */
export async function createPoll(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Extract and validate form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Comprehensive input validation
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

  // Validate each option individually
  for (const option of options) {
    if (!option || option.trim().length === 0) {
      return { error: "All options must have text." };
    }
    if (option.length > 200) {
      return { error: "Options must be less than 200 characters." };
    }
  }

  // Authenticate user session
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

  // Insert poll with sanitized data and user ownership
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: question.trim(), // Sanitize by trimming whitespace
      options: options.map(opt => opt.trim()), // Sanitize all options
    },
  ]);

  if (error) {
    return { error: "Failed to create poll." };
  }

  // Trigger UI refresh for immediate feedback
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls owned by the currently authenticated user.
 * 
 * This function implements user-specific data access, ensuring users
 * can only see their own polls. Results are ordered by creation date
 * with the most recent polls appearing first.
 * 
 * @returns Promise<{polls: Poll[], error: string | null}> User's polls and potential error
 * 
 * @security Only returns polls owned by the authenticated user
 * 
 * @example
 * ```typescript
 * const {polls, error} = await getUserPolls();
 * if (error) {
 *   console.error('Failed to fetch user polls:', error);
 * } else {
 *   console.log(`User has ${polls.length} polls`);
 * }
 * ```
 */
export async function getUserPolls(): Promise<{ polls: any[]; error: string | null }> {
  const supabase = await createClient();

  // Authenticate user session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  // Fetch only polls owned by the current user
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id) // Critical: filter by user ownership
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a specific poll by ID with authorization context.
 * 
 * This function fetches a poll from the database and determines whether
 * the current user has edit permissions. Edit permissions are granted
 * only to the poll owner, implementing proper access control.
 * 
 * @param id - The unique identifier of the poll to retrieve
 * @returns Promise<{poll: Poll | null, error: string | null, canEdit?: boolean}> 
 *          Poll data, error status, and edit permission flag
 * 
 * @security 
 * - Returns poll data regardless of ownership (for public viewing)
 * - Sets canEdit flag only for poll owners
 * - Validates poll existence before returning
 * 
 * @example
 * ```typescript
 * const {poll, error, canEdit} = await getPollById("poll-uuid-123");
 * if (error) {
 *   console.error('Poll not found:', error);
 * } else if (canEdit) {
 *   console.log('User can edit this poll');
 * }
 * ```
 */
export async function getPollById(id: string): Promise<{ poll: any | null; error: string | null; canEdit?: boolean }> {
  const supabase = await createClient();

  // Get user from session for authorization check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the requested poll
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: "Poll not found." };

  // Determine edit permissions based on ownership
  // Public polls can be viewed by anyone, but only owners can edit
  return {
    poll: data,
    error: null,
    canEdit: user?.id === data.user_id
  };
}

/**
 * Submits a vote for a specific poll option with comprehensive validation.
 * 
 * This function handles the complete voting workflow:
 * - Validates vote data and poll existence
 * - Prevents duplicate voting from authenticated users
 * - Validates option selection against poll structure
 * - Records the vote with optional user association
 * 
 * @param pollId - The unique identifier of the poll being voted on
 * @param optionIndex - Zero-based index of the selected option
 * @returns Promise<{error: string | null}> Success status or error message
 * 
 * @security
 * - Validates poll existence before accepting vote
 * - Prevents duplicate voting for authenticated users
 * - Validates option index against poll structure
 * - Allows anonymous voting but tracks user if authenticated
 * 
 * @example
 * ```typescript
 * // Vote for option 0 (first option) in poll
 * const result = await submitVote("poll-uuid-123", 0);
 * if (result.error) {
 *   console.error('Vote failed:', result.error);
 * } else {
 *   console.log('Vote recorded successfully');
 * }
 * ```
 */
export async function submitVote(pollId: string, optionIndex: number): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Input validation - ensure vote data integrity
  if (!pollId || typeof optionIndex !== 'number' || optionIndex < 0) {
    return { error: "Invalid vote data." };
  }

  // Verify poll exists and get its options for validation
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found." };
  }

  // Validate option index against poll structure
  if (optionIndex >= poll.options.length) {
    return { error: "Invalid option selected." };
  }

  // Get current user for duplicate vote prevention
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Prevent duplicate voting for authenticated users
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

  // Record the vote with optional user association
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null, // Associate with user if authenticated
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: "Failed to submit vote." };
  return { error: null };
}

/**
 * Deletes a poll owned by the current user with ownership verification.
 * 
 * This function implements secure poll deletion by ensuring users can only
 * delete polls they own. The deletion includes cascading removal of associated
 * votes through database foreign key constraints.
 * 
 * @param id - The unique identifier of the poll to delete
 * @returns Promise<{error: string | null}> Success status or error message
 * 
 * @security 
 * - Verifies user authentication before deletion
 * - Enforces ownership through database query constraints
 * - Uses user_id filter to prevent unauthorized deletion
 * 
 * @example
 * ```typescript
 * const result = await deletePoll("poll-uuid-123");
 * if (result.error) {
 *   console.error('Delete failed:', result.error);
 * } else {
 *   console.log('Poll deleted successfully');
 * }
 * ```
 */
export async function deletePoll(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Authenticate user session
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

  // Delete poll with ownership verification
  // The user_id constraint ensures users can only delete their own polls
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Critical: ownership verification

  if (error) return { error: "Failed to delete poll. You can only delete your own polls." };

  // Refresh the polls page to reflect changes
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll with comprehensive validation and ownership verification.
 * 
 * This function handles the complete poll update workflow:
 * - Validates and sanitizes all input data
 * - Verifies user authentication and poll ownership
 * - Updates poll content while maintaining data integrity
 * - Provides detailed validation feedback
 * 
 * @param pollId - The unique identifier of the poll to update
 * @param formData - FormData containing updated question and options
 * @returns Promise<{error: string | null}> Success status or detailed error message
 * 
 * @validation
 * - Question: Required, 1-500 characters, trimmed
 * - Options: 2-10 options, each 1-200 characters, trimmed
 * - Ownership: User must own the poll being updated
 * 
 * @security
 * - Verifies poll ownership before allowing updates
 * - Validates poll existence independently
 * - Uses database constraints to prevent unauthorized access
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.set('question', 'Updated question?');
 * formData.append('options', 'New Option 1');
 * formData.append('options', 'New Option 2');
 * 
 * const result = await updatePoll("poll-uuid-123", formData);
 * if (result.error) {
 *   console.error('Update failed:', result.error);
 * }
 * ```
 */
export async function updatePoll(pollId: string, formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Extract and validate form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Comprehensive input validation
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

  // Validate each option individually
  for (const option of options) {
    if (!option || option.trim().length === 0) {
      return { error: "All options must have text." };
    }
    if (option.length > 200) {
      return { error: "Options must be less than 200 characters." };
    }
  }

  // Authenticate user session
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

  // Verify poll ownership before allowing updates
  const { data: existingPoll, error: fetchError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", pollId)
    .single();

  if (fetchError || !existingPoll) {
    return { error: "Poll not found." };
  }

  // Security check: ensure user owns the poll
  if (existingPoll.user_id !== user.id) {
    return { error: "You can only edit your own polls." };
  }

  // Update the poll with sanitized data and ownership constraint
  const { error } = await supabase
    .from("polls")
    .update({
      question: question.trim(), // Sanitize by trimming whitespace
      options: options.map(opt => opt.trim()) // Sanitize all options
    })
    .eq("id", pollId)
    .eq("user_id", user.id); // Double-check ownership in update query

  if (error) {
    return { error: "Failed to update poll." };
  }

  return { error: null };
}
