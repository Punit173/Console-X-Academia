export interface Club {
    club_id: string; // Mapped from 'id' in Dart, assuming JSON uses club_id based on toJson
    name: string;
    description: string;
    icon_url?: string;
    banner_url?: string;
    core_members: string[]; // List of strings
    links: string[];
    club_password?: string;
    subscribers: string[];
    posts: string[]; // List of post IDs
}

export interface Post {
    post_id: string;
    owner_individual: boolean;
    content: string;
    id_club?: string;
    club_name?: string;
    club_icon_url?: string;
    approved: string; // 'yes' | 'no'
    images: string[];
    likes: string[]; // List of emails/IDs
    timestamp: number;
    individual_email?: string;
    expiry_time?: number;
}

export interface MultiPartPostData {
    owner_individual: string; // "true" or "false"
    content: string;
    id_club?: string;
    club_pass?: string;
    individual_email?: string;
    expiry_time?: string;
    images?: File[];
}

export interface PostsResponse {
    posts: Post[];
    total: number;
}
