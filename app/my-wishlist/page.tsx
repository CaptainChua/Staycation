import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MyWishlistClient from "@/Components/MyWishlist";

export const metadata = {
  title: "Staycation Haven | My Wishlist"
}

const getWishlist = async (userId: string) => {
  try {
    const res = await fetch(`${process.env.API_URL}/api/wishlist/${userId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch wishlist');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return { success: false, data: [] };
  }
}

const MyWishlistPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-wishlist');
  }

  const initialData = await getWishlist(session.user.id);

  return <MyWishlistClient initialData={initialData} userId={session.user.id} />;
}

export default MyWishlistPage;