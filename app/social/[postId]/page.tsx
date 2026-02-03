"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SocialService } from "@/lib/socialService";
import { Post } from "@/types/social";
import PostCard from "@/components/social/PostCard";
import { useAppData } from "@/components/AppDataContext";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SinglePostPage() {
    const params = useParams();
    const { credentials } = useAppData();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const postId = params.postId as string;

    useEffect(() => {
        if (!postId) return;

        const loadPost = async () => {
            setLoading(true);
            try {
                const fetchedPost = await SocialService.getPostById(postId);
                setPost(fetchedPost);
            } catch (e) {
                setError("Post not found or deleted.");
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [postId]);

    const handleLike = async (id: string) => {
        if (!credentials?.email) return;
        try {
            const truncatedEmail = credentials.email.split('@')[0];
            await SocialService.toggleLike(id, truncatedEmail);
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        // Redirect to feed after delete?
        alert("Cannot delete from share view");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="animate-spin text-white/50" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
                <div className="text-red-500">{error || "Post unavailable"}</div>
                <Link href="/social" className="text-sm underline text-white/60 hover:text-white">
                    Back to Feed
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center pt-20 px-4">

            <div className="w-full max-w-xl mb-6">
                <Link href="/social" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium">
                    <ArrowLeft size={18} />
                    Back to Feed
                </Link>
            </div>

            <div className="w-full max-w-xl">
                <PostCard
                    post={post}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    currentUserEmail={credentials?.email}
                />
            </div>

        </div>
    );
}
