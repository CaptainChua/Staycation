import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MyWishlistClient from "@/Components/MyWishlist";

export const metadata = {
  title: "Staycation Haven | My Wishlist",
};

const getWishlist = async (userId: string) => {
  try {
    const res = await fetch(`${process.env.API_URL}/api/wishlist/${userId}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch wishlist");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return { success: false, data: [] };
  }
};

const MyWishlistPage = async () => {
  const session = await getServerSession(authOptions);

  // Don't create guest cookies server-side. If the user is authenticated we fetch their wishlist.
  // Guest users will get a client-side guest token (handled in the client component).
  const userIdentifier = session?.user?.id ?? null;
  const initialData = userIdentifier
    ? await getWishlist(userIdentifier)
    : { success: false, data: [] };

  return (
    <MyWishlistClient initialData={initialData} userId={userIdentifier ?? ""} />
  );
};

export default MyWishlistPage;
