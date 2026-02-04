'use client';

interface RoomMapProps {
  roomName: string;
  tower?: string;
  location?: string;
}

const RoomMap = ({ roomName, tower, location }: RoomMapProps) => {
  // Google Maps embed URL for M Place South Triangle Tower D, Diliman, Quezon City
  const mapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.5889374956847!2d121.03087197584714!3d14.639809577537995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b603c2fec51b%3A0xdf26cdeed4a6fa95!2sStaycation%20Haven%20PH%20Quezon%20City!5e0!3m2!1sen!2sph!4v1234567890123";

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
      <iframe
        src={mapsEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full"
      />
    </div>
  );
};

export default RoomMap;