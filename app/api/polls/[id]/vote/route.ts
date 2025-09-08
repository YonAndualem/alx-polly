import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Corresponds to submitVote
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const pollId = params.id;
    const { optionIndex } = await request.json();

    if (!pollId || typeof optionIndex !== 'number' || optionIndex < 0) {
        return NextResponse.json({ error: "Invalid vote data." }, { status: 400 });
    }

    const { data: poll, error: pollError } = await supabase
        .from("polls")
        .select("options")
        .eq("id", pollId)
        .single();

    if (pollError || !poll) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
    }

    if (optionIndex >= poll.options.length) {
        return NextResponse.json({ error: "Invalid option selected." }, { status: 400 });
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        const { data: existingVote } = await supabase
            .from("votes")
            .select("id")
            .eq("poll_id", pollId)
            .eq("user_id", user.id)
            .single();

        if (existingVote) {
            return NextResponse.json({ error: "You have already voted on this poll." }, { status: 409 });
        }
    }

    const { error } = await supabase.from("votes").insert([
        {
        poll_id: pollId,
        user_id: user?.id ?? null,
        option_index: optionIndex,
        },
    ]);

    if (error) {
        return NextResponse.json({ error: "Failed to submit vote." }, { status: 500 });
    }
    
    return NextResponse.json({ error: null }, { status: 200 });
}
