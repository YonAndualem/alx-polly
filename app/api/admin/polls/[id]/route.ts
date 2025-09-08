import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

async function isUserAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { data: userData } = await supabase.auth.getUser();
    
    const adminEmails = ['admin@alxpolly.com', 'root@alxpolly.com'];
    return adminEmails.includes(userData.user?.email || '');
}

// Corresponds to adminDeletePoll
export async function DELETE(request: Request, { params }: { params: { id:string } }) {
    const supabase = await createClient();
    const id = params.id;

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!(await isUserAdmin(user.id))) {
        return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { error } = await supabase.from("polls").delete().eq("id", id);
    if (error) {
        return NextResponse.json({ error: "Failed to delete poll." }, { status: 500 });
    }
    
    revalidatePath("/admin");
    return NextResponse.json({ error: null }, { status: 200 });
}
