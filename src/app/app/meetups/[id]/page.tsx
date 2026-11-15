import { MeetupRoomClient } from "@/components/MeetupRoomClient";

export default async function MeetupRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeetupRoomClient roomId={id} />;
}
