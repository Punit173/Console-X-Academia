"use client";

import { useEffect, useState, use } from "react";
import { SocialService } from "@/lib/socialService";
import { Club, Post } from "@/types/social";
import { useAppData } from "@/components/AppDataContext";
import PostCard from "@/components/social/PostCard";
import { ArrowLeft, Globe, Link as LinkIcon, Lock, Users, Verified } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PageProps {
    params: Promise<{ clubId: string }>;
}

export default function ClubDetailsPage({ params }: PageProps) {
    // Unwrap params in Next.js 15+ (or use directly if < 15, but `await` or `use` is safer for future proofing if params is a promise)
    // The user's env seems to be Next.js (based on file structure). 
    // I'll treat params as a Promise to be safe with newer Next.js versions or just await it effectively.
    // However, in "use client" components, we often receive params as props directly in older versions, 
    // but in App Router, page props are async.
    // Let's use `use` hook if available (React 19/Next 15) or standard useEffect.
    // For broad compatibility in App Router client components:

    const { clubId } = use(params);
    const router = useRouter();
    const { credentials } = useAppData();
    const currentUserEmail = credentials?.email;
    const userTruncated = currentUserEmail ? currentUserEmail.split('@')[0] : undefined;

    const [club, setClub] = useState<Club | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Subscribe Logic State
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);

    useEffect(() => {
        loadData();
    }, [clubId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [clubData, postsData] = await Promise.all([
                SocialService.getClubById(clubId),
                SocialService.getClubPosts(clubId, true) // approvedOnly = true matched Android default
            ]);

            setClub(clubData);
            setPosts(postsData);

            // Init Subscribe State
            if (clubData) {
                setSubscriberCount(clubData.subscribers.length);
                if (userTruncated) {
                    setIsSubscribed(clubData.subscribers.includes(userTruncated));
                }
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load club details");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!userTruncated) {
            alert("Please log in to subscribe.");
            return;
        }

        // Optimistic Update
        const previousState = isSubscribed;
        const previousCount = subscriberCount;

        setIsSubscribed(!previousState);
        setSubscriberCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            const response = await SocialService.toggleSubscription(clubId, userTruncated);
            const isNowSubscribed = response.status === 'subscribed';

            // Reconcile if server differs
            if (isNowSubscribed !== !previousState) {
                setIsSubscribed(isNowSubscribed);
                setSubscriberCount(isNowSubscribed ? previousCount + 1 : previousCount - (previousState ? 1 : 0));
            }

            alert(isNowSubscribed
                ? `You subscribed! You will receive mail when ${club?.name} uploads`
                : `You unsubscribed from ${club?.name}`
            );
        } catch (e) {
            console.error(e);
            alert("Failed to update subscription");
            // Revert
            setIsSubscribed(previousState);
            setSubscriberCount(previousCount);
        }
    };

    const handleLike = async (postId: string) => {
        if (!userTruncated) return;
        try {
            await SocialService.toggleLike(postId, userTruncated);
        } catch (e) {
            console.error(e);
        }
    };

    // Render Logic
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <p className="text-red-400 mb-4">{error || "Club not found"}</p>
                <button onClick={() => router.back()} className="text-white/60 hover:text-white underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">

            {/* 1. Header with Banner & Floating Icon */}
            <div className="relative mb-16">
                {/* Banner */}
                <div className="h-48 md:h-64 bg-zinc-900 relative">
                    {club.banner_url && (
                        <Image
                            src={club.banner_url}
                            alt="Banner"
                            fill
                            className="object-cover opacity-80"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors z-10"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                {/* Floating Icon */}
                <div className="absolute -bottom-12 left-6 md:left-10">
                    <div className="w-24 h-24 rounded-full p-1 bg-black">
                        <div className="w-full h-full rounded-full bg-zinc-800 relative overflow-hidden text-white/20 flex items-center justify-center border border-white/10">
                            {club.icon_url ? (
                                <Image src={club.icon_url} alt={club.name} fill className="object-cover" />
                            ) : (
                                <Users size={32} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Content Container */}
            <div className="px-6 md:px-10 max-w-4xl mx-auto">

                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold">{club.name}</h1>
                            <Verified className="text-blue-500 fill-blue-500/10" size={20} />
                        </div>
                        <p className="text-white/40 text-sm font-bold tracking-widest">@{club.name.replace(/\s+/g, '')}</p>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 mt-6">
                            <div>
                                <p className="text-xl font-bold">{subscriberCount}</p>
                                <p className="text-xs text-white/40 uppercase tracking-wider">Subscribers</p>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div>
                                <p className="text-xl font-bold">{posts.length}</p>
                                <p className="text-xs text-white/40 uppercase tracking-wider">Posts</p>
                            </div>
                        </div>
                    </div>

                    {/* Subscribe Action */}
                    <button
                        onClick={handleSubscribe}
                        className={`px-8 py-3 rounded-full font-bold text-sm transition-all transform active:scale-95 ${isSubscribed
                                ? "bg-transparent border border-white/30 text-white hover:bg-white/5"
                                : "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
                            }`}
                    >
                        {isSubscribed ? "Following" : "Follow"}
                    </button>
                </div>

                <div className="h-px bg-white/10 w-full mb-8"></div>

                {/* About Section */}
                <div className="mb-10">
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">About</h3>
                    <p className="text-white/80 leading-relaxed text-sm md:text-base">
                        {club.description}
                    </p>
                </div>

                {/* Core & Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Core Team */}
                    {club.core_members && club.core_members.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Core Team</h3>
                            <div className="flex flex-wrap gap-2">
                                {club.core_members.map((member, i) => (
                                    <div key={i} className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-xs font-medium text-white/70">
                                        {member}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Links */}
                    {club.links && club.links.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Links</h3>
                            <div className="flex flex-wrap gap-2">
                                {club.links.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                    >
                                        <LinkIcon size={12} />
                                        {new URL(link).hostname.replace('www.', '')}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Activity (Posts) */}
                <div>
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard
                                    key={post.post_id}
                                    post={post}
                                    onLike={handleLike}
                                    currentUserEmail={credentials?.email}
                                />
                            ))
                        ) : (
                            <div className="text-center py-10 text-white/30 text-sm">
                                <p>No posts yet.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
