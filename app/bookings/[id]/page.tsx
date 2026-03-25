import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import BookingDetailsClient from '../../../Components/BookingDetailsClient';

export const metadata = {
  title: "Booking Details - Staycation Haven"
}

const getBookingDetails = async (bookingId: string) => {
  try {
    const res = await fetch(`${process.env.API_URL}/api/bookings/${bookingId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return null;
  }
}

interface Props {
  params: Promise<{
    id: string;
  }>
}

const BookingDetailsPage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-bookings');
  }

  const { id } = await params;
  const bookingData = await getBookingDetails(id);

  if (!bookingData || !bookingData.success) {
    redirect('/my-bookings');
  }

  return <BookingDetailsClient booking={bookingData.data} userId={session.user.id} />;
}

export default BookingDetailsPage;
