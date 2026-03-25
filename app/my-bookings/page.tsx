import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MyBookingsClient from "@/Components/MyBookings";

export const metadata = {
  title: "Staycation Haven | My Bookings"
}

const getBookings = async (userId: string) => {
  try {
    const res = await fetch(`${process.env.API_URL}/api/bookings/user/${userId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch bookings');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, data: [] };
  }
}

const MyBookingsPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-bookings');
  }

  const initialData = await getBookings(session.user.id);

  return <MyBookingsClient initialData={initialData} userId={session.user.id} />;
}

export default MyBookingsPage;