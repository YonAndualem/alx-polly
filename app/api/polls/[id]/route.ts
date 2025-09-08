import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Corresponds to getPollById
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const id = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ poll: null, error: "Poll not found." }, { status: 404 });
  }
  
  return NextResponse.json({ 
    poll: data, 
    error: null, 
    canEdit: user?.id === data.user_id 
  });
}

// Corresponds to deletePoll
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const id = params.id;

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "You must be logged in to delete a poll." }, { status: 401 });
    }

    const { error } = await supabase
        .from("polls")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); 
    
    if (error) {
        return NextResponse.json({ error: "Failed to delete poll. You can only delete your own polls." }, { status: 500 });
    }
  
    revalidatePath("/polls");
    return NextResponse.json({ error: null }, { status: 200 });
}

// Corresponds to updatePoll
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const pollId = params.id;
    const formData = await request.formData();

    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];

    if (!question || question.trim().length === 0) {
        return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }
    if (question.length > 500) {
        return NextResponse.json({ error: "Question must be less than 500 characters." }, { status: 400 });
    }
    if (options.length < 2) {
        return NextResponse.json({ error: "Please provide at least two options." }, { status: 400 });
    }
    if (options.length > 10) {
        return NextResponse.json({ error: "Maximum 10 options allowed." }, { status: 400 });
    }
    
    for (const option of options) {
        if (!option || option.trim().length === 0) {
            return NextResponse.json({ error: "All options must have text." }, { status: 400 });
        }
        if (option.length > 200) {
            return NextResponse.json({ error: "Options must be less than 200 characters." }, { status: 400 });
        }
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "You must be logged in to update a poll." }, { status: 401 });
    }

    const { data: existingPoll, error: fetchError } = await supabase
        .from("polls")
        .select("user_id")
        .eq("id", pollId)
        .single();

    if (fetchError || !existingPoll) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
    }

    if (existingPoll.user_id !== user.id) {
        return NextResponse.json({ error: "You can only edit your own polls." }, { status: 403 });
    }

    const { error } = await supabase
        .from("polls")
        .update({ 
          question: question.trim(),
          options: options.map(opt => opt.trim())
        })
        .eq("id", pollId)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: "Failed to update poll." }, { status: 500 });
    }

    return NextResponse.json({ error: null }, { status: 200 });
}
