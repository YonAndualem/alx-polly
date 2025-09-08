import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function isUserAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { data: userData } = await supabase.auth.getUser();
    
    const adminEmails = ['admin@alxpolly.com', 'root@alxpolly.com'];
    return adminEmails.includes(userData.user?.email || '');
}

// Corresponds to getAllPolls
export async function GET() {
    const supabase = await createClient();
    
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
        return NextResponse.json({ polls: [], error: "Authentication required." }, { status: 401 });
    }

    if (!(await isUserAdmin(user.id))) {
        return NextResponse.json({ polls: [], error: "Admin access required." }, { status: 403 });
    }

    const { data, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ polls: [], error: "Failed to fetch polls." }, { status: 500 });
    }
    
    return NextResponse.json({ polls: data ?? [], error: null });
}
