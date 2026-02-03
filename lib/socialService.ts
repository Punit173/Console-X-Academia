import { Club, Post, PostsResponse, MultiPartPostData } from "@/types/social";

const BASE_URL = "/api/proxy";

export class SocialService {

    // --- CLUBS ---

    static async getClubs(): Promise<Club[]> {
        try {
            const response = await fetch(`${BASE_URL}/clubs`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store' // Don't cache too aggressively
            });

            if (!response.ok) {
                throw new Error(`Error fetching clubs: ${response.statusText}`);
            }

            const data = await response.json();
            // The API returns a list of clubs directly
            return data as Club[];
        } catch (error) {
            console.error("getClubs error:", error);
            throw error;
        }
    }

    static async getClubById(clubId: string): Promise<Club> {
        try {
            const response = await fetch(`${BASE_URL}/clubs/${clubId}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error("Failed to fetch club");
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    static async toggleSubscription(clubId: string, email: string): Promise<any> {
        try {
            const formBody = new URLSearchParams();
            formBody.append('subscriber_email', email);

            const response = await fetch(`${BASE_URL}/clubs/${clubId}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: formBody
            });

            if (!response.ok) throw new Error("Failed to toggle subscription");
            return await response.json();
        } catch (error) {
            console.error("toggleSubscription error:", error);
            throw error;
        }
    }

    static async createClub(data: FormData): Promise<Club> {
        try {
            const response = await fetch(`${BASE_URL}/clubs`, {
                method: 'POST',
                body: data,
            });
            if (!response.ok) throw new Error("Failed to create club");
            const resJson = await response.json();
            return resJson.club;
        } catch (error) {
            console.error("createClub error:", error);
            throw error;
        }
    }

    // --- POSTS ---

    static async getPostById(postId: string): Promise<Post> {
        try {
            const response = await fetch(`${BASE_URL}/posts/${postId}`);
            if (!response.ok) throw new Error("Failed to fetch post");
            return await response.json();
        } catch (error) {
            console.error("getPostById error:", error);
            throw error;
        }
    }

    static async getPosts(offset: number = 0, limit: number = 20): Promise<PostsResponse> {
        try {
            const response = await fetch(`${BASE_URL}/posts?offset=${offset}&limit=${limit}`, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Error fetching posts: ${response.statusText}`);
            }

            const data = await response.json();

            // Enrich posts logic is handled on server or client? 
            // In Dart code, client enriches it. We might need to do the same if the API doesn't.
            // Dart Code: _enrichPostsWithClubData
            // Let's implement basic enrichment here if needed, or assume UI handles it.
            // For now, let's return raw data and see. Use 'any' cast if structure differs momentarily.

            return data as PostsResponse;
        } catch (error) {
            console.error("getPosts error:", error);
            throw error;
        }
    }

    static async getClubPosts(clubId: string, approvedOnly: boolean = false, offset: number = 0, limit: number = 20): Promise<Post[]> {
        try {
            // /posts/club/$clubId?approved_only=$approvedOnly&offset=$offset&limit=$limit
            const response = await fetch(`${BASE_URL}/posts/club/${clubId}?approved_only=${approvedOnly}&offset=${offset}&limit=${limit}`);
            if (!response.ok) throw new Error("Failed to fetch club posts");
            const data = await response.json();
            return data.posts || [];
        } catch (error) {
            console.error("getClubPosts error:", error);
            throw error;
        }
    }

    static async createPost(postData: MultiPartPostData): Promise<Post> {
        try {
            console.log("createPost: Received postData:", postData);

            const formData = new FormData();
            formData.append('owner_individual', postData.owner_individual);
            formData.append('content', postData.content || " "); // Ensure not null/empty string if backend implies it
            if (postData.id_club) formData.append('id_club', postData.id_club);
            if (postData.club_pass) formData.append('club_pass', postData.club_pass);
            if (postData.individual_email) formData.append('individual_email', postData.individual_email);
            if (postData.expiry_time) formData.append('expiry_time', postData.expiry_time);

            if (postData.images && postData.images.length > 0) {
                postData.images.forEach((file) => {
                    formData.append('images', file);
                });
            }

            // Debug FormData
            // @ts-ignore
            for (var pair of formData.entries()) {
                console.log("FormData Entry: " + pair[0] + ', ' + pair[1]);
            }

            const response = await fetch(`${BASE_URL}/posts`, {
                method: 'POST',
                body: formData, // Fetch automatically sets Content-Type to multipart/form-data
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create post: ${errorText}`);
            }

            const resJson = await response.json();
            return resJson.post;
        } catch (error) {
            console.error("createPost error:", error);
            throw error;
        }
    }

    static async toggleLike(postId: string, email: string): Promise<any> {
        try {
            const formBody = new URLSearchParams();
            formBody.append('user_email', email);

            const response = await fetch(`${BASE_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: formBody
            });

            if (!response.ok) throw new Error("Failed to like post");
            return await response.json();
        } catch (error) {
            console.error("toggleLike error:", error);
            throw error;
        }
    }

    static async deletePost(postId: string): Promise<void> {
        try {
            const response = await fetch(`${BASE_URL}/posts/${postId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error("Failed to delete post");
        } catch (error) {
            console.error("deletePost error:", error);
            throw error;
        }
    }
}
