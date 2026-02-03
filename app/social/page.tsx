"use client";

import { useEffect, useState } from "react";
import { SocialService } from "@/lib/socialService";
import { Club, Post } from "@/types/social";
import FilterBar from "@/components/social/FilterBar";
import PostCard from "@/components/social/PostCard";
import ClubCard from "@/components/social/ClubCard";
import CreatePostModal from "@/components/social/CreatePostModal";
import SocialSidebar from "@/components/social/SocialSidebar";
import SocialRightPanel from "@/components/social/SocialRightPanel"; // Assume this maps to the right file
import { useAppData } from "@/components/AppDataContext";
import { Loader2, Plus, Users } from "lucide-react";

export default function SocialPage() {
    const { credentials } = useAppData();
    const currentUserEmail = credentials?.email;

    const [activeTab, setActiveTab] = useState("Posts"); // "Posts" | "Groups" | "Bookmarks" -> Maps to Sidebar IDs
    const [posts, setPosts] = useState<Post[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [page, setPage] = useState(0);

    // Helper to truncate email for service calls
    const truncateEmail = (email: string) => email.split('@')[0];
    const userTruncated = currentUserEmail ? truncateEmail(currentUserEmail) : undefined;

    // Initial Load
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            if (activeTab === "Posts") {
                const [postRes, clubRes] = await Promise.all([
                    SocialService.getPosts(0, 20),
                    SocialService.getClubs() // Fetch clubs for "Suggested Communities" panel
                ]);
                setPosts(postRes.posts);
                setClubs(clubRes);
                setPage(1);
            } else if (activeTab === "Groups") {
                const res = await SocialService.getClubs();
                setClubs(res);
            } else if (activeTab === "Bookmarks") {
                // Load from LocalStorage
                const saved = localStorage.getItem("user_bookmarks");
                if (saved) {
                    setPosts(JSON.parse(saved));
                } else {
                    setPosts([]);
                }
            }
        } catch (e) {
            setError("Failed to load data. Please check your connection.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (activeTab !== "Posts") return;
        try {
            const res = await SocialService.getPosts(page * 20, 20);
            if (res.posts.length > 0) {
                setPosts(prev => [...prev, ...res.posts]);
                setPage(prev => prev + 1);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreatePost = async (data: any) => {
        if (!userTruncated) {
            alert("Please log in to post.");
            return;
        }
        try {
            const newPost = await SocialService.createPost({
                ...data,
                // If it's an individual post, ensure owner_individual is explicitly "true" and pass the email
                // If it's a club post, owner_individual is "false", we still pass the user's email for logging? 
                // Android app sends 'individual_email': _truncatedUserEmail regardless of mode.
                individual_email: userTruncated
            });
            // Prepend new post
            setPosts(prev => [newPost, ...prev]);
        } catch (e) {
            console.error(e);
            alert("Failed to create post. If posting as a club, check your credentials.");
        }
    };

    const handleLike = async (postId: string) => {
        if (!userTruncated) return; // PostCard handles alert
        try {
            await SocialService.toggleLike(postId, userTruncated);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            await SocialService.deletePost(postId);
            setPosts(prev => prev.filter(p => p.post_id !== postId));
        } catch (e) {
            console.error(e);
            alert("Failed to delete post.");
        }
    };

    const handleSubscribe = async (clubId: string) => {
        if (!userTruncated) {
            alert("Please log in to subscribe.");
            return;
        }

        const clubIndex = clubs.findIndex(c => c.club_id === clubId);
        if (clubIndex === -1) return;
        const club = clubs[clubIndex];
        const isCurrentlySubscribed = club.subscribers.includes(userTruncated);

        // Optimistic Update
        const newSubscribers = isCurrentlySubscribed
            ? club.subscribers.filter(s => s !== userTruncated)
            : [...club.subscribers, userTruncated];

        const updatedClub = { ...club, subscribers: newSubscribers };
        const updatedClubs = [...clubs];
        updatedClubs[clubIndex] = updatedClub;

        setClubs(updatedClubs);

        try {
            const response = await SocialService.toggleSubscription(clubId, userTruncated);

            // Verify status if needed, but we rely on optimistic update mostly.
            // If response.status !== 'subscribed' (and we expected it), revert?
            // The Android app sets state based on response.
            // Let's follow Android logic:
            const isSubscribedNow = response.status === 'subscribed';

            // Correct state data based on server response if different
            if (isSubscribedNow !== !isCurrentlySubscribed) {
                // Revert or fix
                const correctedSubscribers = isSubscribedNow
                    ? [...club.subscribers, userTruncated] // Unique add
                    : club.subscribers.filter(s => s !== userTruncated);

                const correctedClub = { ...club, subscribers: correctedSubscribers };
                const correctedClubs = [...clubs];
                correctedClubs[clubIndex] = correctedClub;
                setClubs(correctedClubs);
            }

            alert(isSubscribedNow
                ? `You subscribed! You will receive mail when ${club.name} uploads`
                : `You unsubscribed from ${club.name}`
            );

        } catch (e) {
            console.error(e);
            alert("Failed to update subscription");
            // Revert on error
            const revertedClubs = [...clubs];
            revertedClubs[clubIndex] = club; // old object
            setClubs(revertedClubs);
        }
    };

    // Search functionality removed to match Android App
    // const [searchTerm, setSearchTerm] = useState("");

    const filteredPosts = posts;

    const filteredClubs = clubs;

    return (
        <div className="min-h-screen text-white">
            <div className="max-w-7xl mx-auto flex justify-center">

                {/* LEFT SIDEBAR (Desktop Only) */}
                <SocialSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                {/* MAIN FEED */}
                <main className="w-full md:max-w-xl lg:max-w-2xl border-x border-white/10 min-h-screen pb-20 relative">

                    {/* MOBILE FILTER BAR (Sticky Top - Only visible on Mobile/Tablet) */}
                    <div className="lg:hidden">
                        <FilterBar activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>

                    {/* Page Title (Desktop Only) */}
                    <div className="hidden lg:flex items-center justify-between px-6 py-4 sticky top-0 bg-black/80 backdrop-blur-xl z-20 border-b border-white/10">
                        <h1 className="text-xl font-bold tracking-tight">{activeTab}</h1>
                    </div>

                    <div className="p-0">
                        {error && (
                            <div className="m-4 bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-center">
                                {error}
                                <button onClick={loadData} className="ml-2 underline hover:text-red-400">Retry</button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-white/50" size={32} />
                            </div>
                        ) : (
                            <>
                                {/* POSTS & BOOKMARKS TAB */}
                                {(activeTab === "Posts" || activeTab === "Bookmarks") && (
                                    <div className="space-y-px">
                                        {filteredPosts.filter(p => p && p.post_id).map(post => (
                                            <PostCard
                                                key={post.post_id}
                                                post={post}
                                                onLike={handleLike}
                                                onDelete={handleDelete}
                                                currentUserEmail={credentials?.email} // Pass Full Email
                                            />
                                        ))}
                                        {filteredPosts.length === 0 && (
                                            <div className="text-center text-white/40 py-20 flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                    <div className="w-8 h-8 opacity-50">👻</div>
                                                </div>
                                                <p>{activeTab === "Bookmarks" ? "No bookmarks yet." : "No posts found."}</p>
                                            </div>
                                        )}
                                        {activeTab === "Posts" && filteredPosts.length > 0 && (
                                            <div className="flex justify-center py-8">
                                                <button
                                                    onClick={handleLoadMore}
                                                    className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold tracking-widest transition-colors"
                                                >
                                                    LOAD MORE
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* GROUPS TAB */}
                                {activeTab === "Groups" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                        {filteredClubs.map(club => (
                                            <ClubCard
                                                key={club.club_id}
                                                club={club}
                                                onSubscribe={handleSubscribe}
                                                isSubscribed={userTruncated ? club.subscribers.includes(userTruncated) : false}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>

                {/* RIGHT PANEL (Desktop Only) */}
                <SocialRightPanel
                    suggestedClubs={clubs} // We might need to ensure 'clubs' are loaded even if on 'Posts' tab
                />

            </div>

            {/* Floating Action Button (Always Visible) */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all z-40 active:scale-90"
            >
                <Plus size={24} strokeWidth={3} />
            </button>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreatePost}
            />
        </div>
    );
}
