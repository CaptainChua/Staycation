import { notFound } from "next/navigation";
import RoomDetailsClient from "./RoomDetailsClient";


// import { useParams, useRouter } from "next/navigation";
// import RoomsDetailsPage from "@/Components/Rooms/RoomsDetailsPage";

// // Room data - in a real app, this would come from an API or database
// // const rooms = [
// //   {
// //     id: '1',
// //     name: 'Deluxe Room with City View',
// //     price: '₱2,499',
// //     pricePerNight: 'per night',
// //     images: [
// //       '/Images/haven_9_Living Area_haven_5_jpg_30.jpg',
// //       '/Images/haven9_Living_Area_haven_4_1763025826_3659.jpg',
// //       '/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg',
// //     ],
// //     rating: 4.8,
// //     reviews: 245,
// //     capacity: 2,
// //     amenities: ['WiFi', 'AC', 'TV', 'Minibar'],
// //     description: 'Spacious room with stunning city views, modern amenities, and premium comfort.',
// //     fullDescription: 'Experience luxury at its finest in our Deluxe Room with City View. This spacious accommodation features floor-to-ceiling windows offering breathtaking panoramic views of the city. With modern furnishings, premium bedding, and state-of-the-art facilities, this room is perfect for discerning travelers.',
// //     beds: 'King Size Bed',
// //     roomSize: '35 sq.m',
// //     photoTour: {
// //       livingArea: [
// //         '/Images/haven_9_Living Area_haven_5_jpg_30.jpg',
// //         '/Images/haven9_Living_Area_haven_4_1763025826_3659.jpg',
// //         '/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg',
// //       ],
// //       kitchenette: [
// //         '/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg',
// //       ],
// //       fullBathroom: [
// //         '/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg',
// //       ],
// //       bedroom: [
// //         '/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg',
// //       ],
// //     },
// //     youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
// //   },
// //   {
// //     id: '2',
// //     name: 'Family Suite',
// //     price: '₱3,999',
// //     pricePerNight: 'per night',
// //     images: [
// //       '/Images/haven_9_Living Area_haven_5_jpg_31.jpg',
// //       '/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg',
// //       '/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg',
// //     ],
// //     rating: 4.9,
// //     reviews: 189,
// //     capacity: 4,
// //     amenities: ['WiFi', 'AC', 'Kitchen', 'Living Room'],
// //     description: 'Perfect for families with separate sleeping and living areas, fully equipped kitchen.',
// //     fullDescription: 'Our Family Suite is the ideal choice for families and groups. Featuring separate sleeping areas and a spacious living room, this suite provides the perfect combination of comfort and functionality. The fully equipped kitchen allows you to prepare meals at your convenience.',
// //     beds: '1 King + 2 Single Beds',
// //     roomSize: '55 sq.m',
// //   },
// //   {
// //     id: '3',
// //     name: 'Luxury Suite',
// //     price: '₱5,499',
// //     pricePerNight: 'per night',
// //     images: [
// //       '/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg',
// //       '/Images/haven_9_Dining Area_haven_7_jpg_35.jpg',
// //       '/Images/haven9_Pool_Black_and_Orange_Illustrative_Happy_Halloween_Instagram_Post_1763025712_1833.jpg',
// //     ],
// //     rating: 5,
// //     reviews: 312,
// //     capacity: 2,
// //     amenities: ['WiFi', 'AC', 'Jacuzzi', 'Butler Service'],
// //     description: 'Ultimate luxury experience with premium furnishings, spa bath, and exclusive services.',
// //     fullDescription: 'Indulge in pure luxury with our exclusive Luxury Suite. This opulent accommodation features a private Jacuzzi, premium furnishings, and world-class amenities. Enjoy personalized butler service and access to exclusive facilities for an unforgettable experience.',
// //     beds: 'King Size Bed',
// //     roomSize: '65 sq.m',
// //   },
// //   {
// //     id: '4',
// //     name: 'Cozy Standard Room',
// //     price: '₱1,299',
// //     pricePerNight: 'per night',
// //     images: [
// //       '/Images/haven_9_Living Area_haven_5_jpg_30.jpg',
// //       '/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg',
// //       '/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg',
// //     ],
// //     rating: 4.6,
// //     reviews: 567,
// //     capacity: 1,
// //     amenities: ['WiFi', 'AC', 'Comfortable Bed'],
// //     description: 'Comfortable and budget-friendly option with all essential amenities for a pleasant stay.',
// //     fullDescription: 'Our Cozy Standard Room offers exceptional value without compromising on comfort. Perfect for solo travelers and business visitors, this room provides all the essentials you need for a pleasant and relaxing stay.',
// //     beds: 'Twin Bed',
// //     roomSize: '25 sq.m',
// //   },
// //   {
// //     id: '5',
// //     name: 'Premium Double Room',
// //     price: '₱2,899',
// //     pricePerNight: 'per night',
// //     images: [
// //       '/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg',
// //       '/Images/haven_9_Dining Area_haven_7_jpg_35.jpg',
// //       '/Images/haven_9_Garage_haven_4_jpg_37.jpg',
// //     ],
// //     rating: 4.7,
// //     reviews: 421,
// //     capacity: 2,
// //     amenities: ['WiFi', 'AC', 'Rain Shower', 'Work Desk'],
// //     description: 'Elegant room designed for business and leisure travelers, featuring modern workspace.',
// //     fullDescription: 'Designed with both business and leisure travelers in mind, our Premium Double Room combines elegance with functionality. Features a dedicated work desk, modern amenities, and a luxurious rain shower for the ultimate in comfort.',
// //     beds: 'Double Bed',
// //     roomSize: '30 sq.m',
// //   },
// //   {
// //     id: '6',
// //     name: 'Penthouse',
// //     price: '₱7,999',
// //     pricePerNight: 'per night',
// //     images: [
// //       '/Images/haven_9_Exterior_haven_5_jpg_38.jpg',
// //       '/Images/haven9_Pool_Black_and_Orange_Illustrative_Happy_Halloween_Instagram_Post_1763025712_1833.jpg',
// //       '/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg',
// //     ],
// //     rating: 5,
// //     reviews: 98,
// //     capacity: 4,
// //     amenities: ['WiFi', 'AC', 'Private Terrace', 'Full Bar'],
// //     description: 'Exclusive penthouse with panoramic views, private terrace, and world-class amenities.',
// //     fullDescription: 'Our crown jewel, the Penthouse offers an unparalleled luxury experience. With panoramic city views, a private terrace, and a fully stocked bar, this exclusive accommodation is perfect for those seeking the ultimate in sophistication and comfort.',
// //     beds: '1 King + 1 Queen Bed',
// //     roomSize: '85 sq.m',
// //   },
// // ];

// const RoomDetailsPageRoute = () => {
//   const params = useParams();
//   const router = useRouter();
//   const roomId = params.id as string;

//   // Find the room by ID
//   // const room = rooms.find((r) => r.id === roomId);

//   // If room not found, show error
//   if (!room) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-gray-800 mb-4">Room Not Found</h1>
//           <button
//             onClick={() => router.push('/')}
//             className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return <RoomsDetailsPage room={roomId} onBack={() => router.push('/')} />;
// };

// export default RoomDetailsPageRoute;

// 'use client';

// import { useParams, useRouter } from "next/navigation";
// import RoomsDetailsPage from "@/Components/Rooms/RoomsDetailsPage";
// import { useGetHavenByIdQuery } from "@/redux/api/roomApi";

// const RoomDetailsPageRoute = () => {
//   const params = useParams();
//   const router = useRouter();
//   const roomId = params.id as string;

//   const { data: room, isLoading, isError } = useGetHavenByIdQuery(roomId);
//   if (isLoading) return <p>Loading room...</p>;
//   if (isError || !room) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="text-center">
//         <h1 className="text-2xl font-bold text-gray-800 mb-4">Room Not Found</h1>
//         <button
//           onClick={() => router.push('/')}
//           className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg"
//         >
//           Back to Home
//         </button>
//       </div>
//     </div>
//   );
//   return <RoomsDetailsPage room={room} onBack={() => router.push('/')} />;
// };

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const getRoomById = async (id: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';
  const res = await fetch(`${baseUrl}/api/haven/${id}`, {
    cache: 'no-cache'
  })

  if (!res.ok) {
    return null
  }

  return res.json();
}

const RoomDetailsPageRoute = async ({ params }: Props) => {
  const { id } = await params;
  const response =  await getRoomById(id);

  if (!response?.success || !response?.data) {
    return notFound();
  }

  return <RoomDetailsClient room={response.data} />
}

export default RoomDetailsPageRoute;

