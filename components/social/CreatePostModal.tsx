"use client";

import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface PostData {
    content: string;
    images: File[];
    owner_individual: string;
    id_club?: string;
    club_pass?: string;
    expiry_time?: string;
}

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PostData) => Promise<void>;
}

export default function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
    const [content, setContent] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Fields
    const [isIndividual, setIsIndividual] = useState(true);
    const [clubId, setClubId] = useState("");
    const [clubPass, setClubPass] = useState("");
    const [expiryDays, setExpiryDays] = useState(7);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const calculateExpiryTimestamp = () => {
        const date = new Date();
        date.setDate(date.getDate() + expiryDays);
        return Math.floor(date.getTime() / 1000).toString();
    };

    const handleSubmit = async () => {
        if (!content.trim() && images.length === 0) {
            alert("Post content cannot be empty");
            return;
        }
        if (!isIndividual && (!clubId.trim() || !clubPass.trim())) {
            alert("Club ID and Password are required for club posts");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                content,
                images,
                owner_individual: isIndividual ? "true" : "false",
                id_club: isIndividual ? undefined : clubId,
                club_pass: isIndividual ? undefined : clubPass,
                expiry_time: calculateExpiryTimestamp()
            });
            // Reset form
            setContent("");
            setImages([]);
            setIsIndividual(true);
            setClubId("");
            setClubPass("");
            setExpiryDays(7);

            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose} // Close on backdrop click
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                className="bg-[#121212] border border-white/10 w-full md:max-w-lg h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col fixed md:relative inset-0 md:inset-auto"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A] shrink-0">
                    <h2 className="text-lg font-bold text-white">New Post</h2>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Identity Selector */}
                    <div className="bg-[#1C1C1E] p-1 rounded-full flex">
                        <button
                            onClick={() => setIsIndividual(true)}
                            className={`flex-1 py-2 text-xs font-black tracking-widest rounded-full transition-all ${isIndividual ? "bg-[#2C2C2E] text-white shadow-lg" : "text-white/30 hover:text-white/50"}`}
                        >
                            INDIVIDUAL
                        </button>
                        <button
                            onClick={() => setIsIndividual(false)}
                            className={`flex-1 py-2 text-xs font-black tracking-widest rounded-full transition-all ${!isIndividual ? "bg-[#2C2C2E] text-white shadow-lg" : "text-white/30 hover:text-white/50"}`}
                        >
                            CLUB
                        </button>
                    </div>

                    {/* Club Fields */}
                    {!isIndividual && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <input
                                value={clubId}
                                onChange={(e) => setClubId(e.target.value)}
                                placeholder="CLUB ID"
                                className="w-full bg-[#1C1C1E] text-white p-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                            <input
                                type="password"
                                value={clubPass}
                                onChange={(e) => setClubPass(e.target.value)}
                                placeholder="CLUB PASS"
                                className="w-full bg-[#1C1C1E] text-white p-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                        </div>
                    )}

                    {/* Content Area */}
                    <div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full h-32 bg-transparent text-white placeholder-white/30 resize-none focus:outline-none text-lg leading-relaxed"
                        />
                    </div>

                    {/* Image Previews */}
                    {images.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden group border border-white/10">
                                    <img src={URL.createObjectURL(img)} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Expiry Slider */}
                    <div className="bg-[#1C1C1E] p-4 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black tracking-widest text-white/40">VISIBILITY DURATION</span>
                            <span className="text-xs font-black text-white">{expiryDays} DAYS</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={expiryDays}
                            onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>

                    {/* Disclaimer */}
                    <div className="flex gap-3 px-2">
                        <div className="mt-1">
                            <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center">
                                <span className="text-[10px] text-white/50 font-bold">i</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                            By posting, you acknowledge that your user handle will be logged. Posts automatically expire after the selected duration.
                        </p>
                    </div>

                    {/* Apply for Club Access */}
                    <div className="pt-4 pb-2">
                        <a
                            href="mailto:console.business.team@gmail.com?subject=Club%20Access%20Request&body=I%20would%20like%20to%20request%20access%20to%20post%20as%20a%20club."
                            className="bg-[#1C1C1E] rounded-3xl p-4 flex items-center justify-center gap-2 group hover:bg-[#2C2C2E] transition-colors"
                        >
                            <span className="text-[10px] font-black tracking-widest text-white/40 group-hover:text-white/60">WANT TO POST AS A GROUP?</span>
                            <span className="text-[10px] font-black tracking-widest text-white underline decoration-white/30 group-hover:decoration-white">APPLY FOR ACCESS</span>
                        </a>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 flex justify-between items-center bg-[#0A0A0A]">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold tracking-widest"
                    >
                        <ImageIcon size={18} />
                        MEDIA
                    </button>
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-white text-black px-8 py-3 rounded-full font-black text-xs tracking-widest hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-transform active:scale-95"
                    >
                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                        POST
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
