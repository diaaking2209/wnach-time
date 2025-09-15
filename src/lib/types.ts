
export type Product = {
  id: string;
  name: string;
  price: number; // in USD
  original_price?: number; // in USD
  discount?: number;
  platforms?: ("PC" | "Xbox" | "Playstation" | "Mobile")[];
  tags?: string[];
  image_url: string;
  banner_url?: string;
  description?: string;
  ai_hint?: string;
  category?: string;
  stock_status?: 'In Stock' | 'Out of Stock';
  is_active?: boolean;
  stock_type: 'INFINITE' | 'LIMITED';
  stock_quantity: number | null;
};

export type CarouselDeal = {
    title: string;
    imageUrl: string;
    aiHint: string;
    link: string;
}

export type ReviewWithUser = {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    is_featured: boolean;
    user_profiles: {
        username: string;
        avatar_url: string;
    } | null;
};
