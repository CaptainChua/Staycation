import { notFound } from "next/navigation";
import HavenDetailsClient from "./HavenDetailsClient";

interface Props {
  params: Promise<{
    id: string;
  }>
}

const getHavenRooms = async (havenId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';
  const res = await fetch(`${baseUrl}/api/haven`, {
    cache: 'no-cache'
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  // Filter havens by the haven number
  if (data?.data) {
    interface Haven {
      haven_name?: string;
      name?: string;
    }
    const filteredHavens = data.data.filter((haven: Haven) => {
      const havenName = haven.haven_name || haven.name || '';
      const havenMatch = havenName.match(/Haven (\d+)/);
      return havenMatch && havenMatch[1] === havenId;
    });

    return { data: filteredHavens };
  }

  return null;
}

const HavenDetailsPageRoute = async ({ params }: Props) => {
  const { id } = await params;
  const response = await getHavenRooms(id);

  if (!response?.data || response.data.length === 0) {
    return notFound();
  }

  return <HavenDetailsClient havenId={id} havens={response.data} />
}

export default HavenDetailsPageRoute;
