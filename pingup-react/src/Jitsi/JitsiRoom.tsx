import React from "react";
import { useJitsi } from "./useJitsi";

interface JitsiRoomProps {
  roomName: string;
  userName: string;
}

const JitsiRoom: React.FC<JitsiRoomProps> = ({ roomName, userName }) => {
  const jitsiContainerRef = useJitsi(roomName, userName);

  return <div ref={jitsiContainerRef} style={{ width: "100%", height: "600px" }} />;
};

export default JitsiRoom;
