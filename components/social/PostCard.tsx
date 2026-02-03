"use client";

import { Post } from "@/types/social";
import { Heart, MessageCircle, Share2, MoreHorizontal, User, ShieldCheck, Bookmark, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PostCardProps {
    post: Post;
    onLike?: (postId: string) => void;
    onDelete?: (postId: string) => void;
    currentUserEmail?: string;
}

export default function PostCard({ post, onLike, onDelete, currentUserEmail }: PostCardProps) {
    const [liked, setLiked] = useState<boolean>(false);
    const [likeCount, setLikeCount] = useState<number>(post.likes.length);
    const [imageIndex, setImageIndex] = useState<number>(0);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Helper to truncate email (e.g. "student@srmist..." -> "student")
    const truncateEmail = (email: string) => email.split('@')[0];
    const userTruncated = currentUserEmail ? truncateEmail(currentUserEmail) : null;

    useEffect(() => {
        // Check Like status
        if (userTruncated) {
            setLiked(post.likes.includes(userTruncated));
        }

        // Check Bookmark status from LocalStorage
        const savedBookmarks = localStorage.getItem("user_bookmarks");
        if (savedBookmarks) {
            const bookmarks = JSON.parse(savedBookmarks);
            const exists = bookmarks.some((p: any) => p.post_id === post.post_id);
            setIsBookmarked(exists);
        }
    }, [currentUserEmail, post.likes, post.post_id, userTruncated]);

    const handleLike = () => {
        if (!onLike) return;
        if (!userTruncated) {
            alert("Please login to like posts");
            return;
        }

        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        onLike(post.post_id);
    };

    const handleBookmark = () => {
        const savedBookmarks = localStorage.getItem("user_bookmarks");
        let bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];

        if (isBookmarked) {
            bookmarks = bookmarks.filter((p: any) => p.post_id !== post.post_id);
        } else {
            bookmarks.push(post);
        }

        localStorage.setItem("user_bookmarks", JSON.stringify(bookmarks));
        setIsBookmarked(!isBookmarked);
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this post?")) {
            onDelete?.(post.post_id);
        }
    };

    const timeAgo = (timestamp: number) => {
        try {
            const date = new Date(timestamp * 1000); // API uses seconds? Check dart code.
            // Dart: widget.post.timestamp is int. _formatTimestamp does * 1000. So API is Seconds.
            // JS Date takes millis. So timestamp * 1000.
            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + "y ago";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + "mo ago";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + "d ago";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + "h ago";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + "m ago";
            return "Just now";
        } catch (e) {
            return "";
        }
    };

    // Parsing logic for mentions and links
    const renderContent = (text: string) => {
        const parts = text.split(/((?:https?:\/\/[^\s]+)|(?:\B@\w+))/g);
        return parts.map((part, i) => {
            if (part.match(/^https?:\/\//)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a>;
            } else if (part.match(/^@\w+/)) {
                return <span key={i} className="text-blue-400 font-bold">{part}</span>;
            }
            return part;
        });
    };

    const isClubPost = post.owner_individual === false && post.club_name;
    const isOwner = userTruncated && post.individual_email && userTruncated === truncateEmail(post.individual_email);

    const handleShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/social/${post.post_id}`;
            await navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };



    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden mb-6 hover:border-white/10 transition-colors shadow-2xl shadow-black/50"
        >
            {/* Glassmorphism Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Header */}
            <div className="relative p-5 flex items-start justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border border-white/10 shadow-lg ${isClubPost ? 'bg-black' : 'bg-gradient-to-br from-violet-600 to-indigo-600'}`}>
                        {isClubPost ? (
                            post.club_icon_url ? <Image src={post.club_icon_url} alt="Club" width={44} height={44} className="object-cover w-full h-full" /> : <ShieldCheck size={20} className="text-white" />
                        ) : (
                            <User size={22} className="text-white/90" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white tracking-wide">
                                {isClubPost ? post.club_name : (post.individual_email ? truncateEmail(post.individual_email) : "Student")}
                            </h4>
                            {isClubPost && <ShieldCheck size={14} className="text-blue-400" />}
                        </div>
                        <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider mt-0.5">
                            {timeAgo(post.timestamp)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">

                    <button
                        onClick={handleBookmark}
                        className="p-2 text-white/20 hover:text-white transition-colors rounded-full hover:bg-white/5"
                    >
                        <Bookmark size={18} className={isBookmarked ? "fill-yellow-500 text-yellow-500" : ""} />
                    </button>

                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            className="p-2 text-white/20 hover:text-red-500 transition-colors rounded-full hover:bg-white/5"
                            title="Delete Post"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Text */}
            {post.content && (
                <div className="relative px-5 pb-4 z-10">
                    <p className="text-[15px] text-white/80 leading-7 font-light whitespace-pre-wrap">
                        {renderContent(post.content)}
                    </p>
                </div>
            )}

            {/* Images - Aspect Ratio Handling */}
            {post.images && post.images.length > 0 && (
                <div className="relative w-full bg-black/50 border-y border-white/5">
                    {/* If single image, allow natural height but capped */}
                    <div className={`relative w-full ${post.images.length === 1 ? 'max-h-[600px]' : 'aspect-square'}`}>
                        <Image
                            src={post.images[imageIndex]}
                            alt="Post Media"
                            width={1200}
                            height={1200}
                            className={`w-full h-full object-contain ${post.images.length === 1 ? 'max-h-[600px] object-center' : ''}`}
                            unoptimized
                        />
                    </div>

                    {post.images.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                            {post.images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setImageIndex(idx)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${imageIndex === idx ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Actions Footer */}
            <div className="relative p-4 flex items-center justify-between z-10 mt-1">
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-2 group"
                    >
                        <div className={`p-2 rounded-full transition-colors ${liked ? "bg-red-500/10" : "group-hover:bg-white/5"}`}>
                            <Heart
                                size={20}
                                className={`transition-all duration-300 ${liked ? "fill-red-500 text-red-500" : "text-white/40 group-hover:text-white"}`}
                            />
                        </div>
                        <span className={`text-sm font-medium tabular-nums ${liked ? "text-red-500" : "text-white/40 group-hover:text-white"}`}>
                            {likeCount}
                        </span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
