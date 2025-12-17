import SearchBarSticky from "@/Components/HeroSection/SearchBarSticky";
import HotelRoomListings from "@/Components/Rooms/HotelRoomListings";
import Footer from "@/Components/Footer";


const getAllHavens = async () => {
  const res = await fetch(`${process.env.API_URL}/api/haven`, {
    cache: 'no-cache'
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function RoomsPage() {
  const response = await getAllHavens();
  const havens = response?.data || [];
  return (
    <>
      <SearchBarSticky />
      {/* Add top padding to account for fixed header + sticky search bar - responsive sizing */}
      <div className="pt-[280px] sm:pt-[320px] md:pt-[400px] lg:pt-[450px]">
        <HotelRoomListings initialHavens={havens}/>
      </div>
      <Footer />
    </>
  )
}