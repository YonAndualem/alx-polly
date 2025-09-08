import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Corresponds to getUserPolls
export async function GET() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ polls: [], error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ polls: [], error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ polls: data ?? [], error: null });
}

// Corresponds to createPoll
export async function POST(request: Request) {
  const supabase = await createClient();
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
    return NextResponse.json({ error: "You must be logged in to create a poll." }, { status: 401 });
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: question.trim(),
      options: options.map(opt => opt.trim()),
    },
  ]);

  if (error) {
    return NextResponse.json({ error: "Failed to create poll." }, { status: 500 });
  }

  revalidatePath("/polls");
  return NextResponse.json({ error: null }, { status: 201 });
}
