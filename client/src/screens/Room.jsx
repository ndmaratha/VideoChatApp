import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
	const socket = useSocket();
	const [remoteSocketId, setRemoteSocketId] = useState(null);
	const [myStream, setMyStream] = useState();
	const [remoteStream, setRemoteStream] = useState();

	const handleUserJoined = useCallback(({ email, id }) => {
		console.log(`Email ${email} joined room`);
		setRemoteSocketId(id);
	}, []);

	const handleCallUser = useCallback(async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});
		const offer = await peer.getOffer();
		socket.emit("user:call", { to: remoteSocketId, offer });
		setMyStream(stream);
	}, [remoteSocketId, socket]);

	const handleIncommingCall = useCallback(
		async ({ from, offer }) => {
			setRemoteSocketId(from);
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			});
			setMyStream(stream);
			console.log(`Incoming Call`, from, offer);
			const ans = await peer.getAnswer(offer);
			socket.emit("call:accepted", { to: from, ans });
		},
		[socket]
	);

	const sendStreams = useCallback(() => {
		for (const track of myStream.getTracks()) {
			peer.peer.addTrack(track, myStream);
		}
	}, [myStream]);

	const handleCallAccepted = useCallback(
		({ from, ans }) => {
			peer.setLocalDescription(ans);
			console.log("Call Accepted!");
			sendStreams();
		},
		[sendStreams]
	);

	const handleNegoNeeded = useCallback(async () => {
		const offer = await peer.getOffer();
		socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
	}, [remoteSocketId, socket]);

	useEffect(() => {
		peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
		return () => {
			peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
		};
	}, [handleNegoNeeded]);

	const handleNegoNeedIncomming = useCallback(
		async ({ from, offer }) => {
			const ans = await peer.getAnswer(offer);
			socket.emit("peer:nego:done", { to: from, ans });
		},
		[socket]
	);

	const handleNegoNeedFinal = useCallback(async ({ ans }) => {
		await peer.setLocalDescription(ans);
	}, []);

	useEffect(() => {
		peer.peer.addEventListener("track", async (ev) => {
			const remoteStream = ev.streams;
			console.log("GOT TRACKS!!");
			setRemoteStream(remoteStream[0]);
		});
	}, []);

	useEffect(() => {
		socket.on("user:joined", handleUserJoined);
		socket.on("incomming:call", handleIncommingCall);
		socket.on("call:accepted", handleCallAccepted);
		socket.on("peer:nego:needed", handleNegoNeedIncomming);
		socket.on("peer:nego:final", handleNegoNeedFinal);

		return () => {
			socket.off("user:joined", handleUserJoined);
			socket.off("incomming:call", handleIncommingCall);
			socket.off("call:accepted", handleCallAccepted);
			socket.off("peer:nego:needed", handleNegoNeedIncomming);
			socket.off("peer:nego:final", handleNegoNeedFinal);
		};
	}, [
		socket,
		handleUserJoined,
		handleIncommingCall,
		handleCallAccepted,
		handleNegoNeedIncomming,
		handleNegoNeedFinal,
	]);

	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6'>
			<h1 className='text-3xl font-bold mb-4'>You Are In The Room</h1>

			{/* Instructions */}
			<div className='bg-gray-800 p-4 rounded-lg shadow-md text-center w-full max-w-lg mb-6'>
				<h2 className='text-xl font-semibold mb-2'>Instructions:</h2>
				<ul className='list-decimal list-inside text-gray-300 text-sm text-left'>
					<li>First, **allow camera & microphone permissions**.</li>
					<li>Click **"CALL"** to connect with your friend.</li>
					<li>Click **"Send Stream"** to share your video.</li>
					<li>Enjoy your video call! 🎉</li>
				</ul>
			</div>

			{/* Connection Status */}
			<h4 className='text-lg font-medium mb-4'>
				{remoteSocketId ? "✅ Connected" : "⚠ No one in room. Invite someone!"}
			</h4>

			{/* Buttons */}
			<div className='flex gap-4'>
				{remoteSocketId && (
					<button
						onClick={handleCallUser}
						className='px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium'
					>
						CALL
					</button>
				)}
				{myStream && (
					<button
						onClick={sendStreams}
						className='px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium'
					>
						Send Stream
					</button>
				)}
			</div>

			{/* Video Call UI */}
			<div className='mt-6 flex flex-col md:flex-row gap-6 items-center justify-center w-full max-w-4xl'>
				{myStream && (
					<div className='relative w-full md:w-1/2 bg-gray-800 p-2 rounded-lg shadow-lg overflow-hidden'>
						<h2 className='absolute top-2 left-2 bg-black/50 text-white px-2 py-1 text-xs rounded-md'>
							You
						</h2>
						<ReactPlayer
							playing
							muted
							width='100%'
							height='auto'
							className='rounded-lg border-2 border-gray-600 shadow-md'
							url={myStream}
						/>
					</div>
				)}
				{remoteStream && (
					<div className='relative w-full md:w-1/2 bg-gray-800 p-2 rounded-lg shadow-lg overflow-hidden'>
						<h2 className='absolute top-2 left-2 bg-black/50 text-white px-2 py-1 text-xs rounded-md'>
							Friend
						</h2>
						<ReactPlayer
							playing
							width='100%'
							height='auto'
							className='rounded-lg border-2 border-gray-600 shadow-md'
							url={remoteStream}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default RoomPage;
