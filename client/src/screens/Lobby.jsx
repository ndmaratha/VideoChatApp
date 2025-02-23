import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
	const [email, setEmail] = useState("");
	const [room, setRoom] = useState("");
	const [loading, setLoading] = useState(false);

	const socket = useSocket();
	const navigate = useNavigate();

	const handleSubmitForm = useCallback(
		(e) => {
			e.preventDefault();
			setLoading(true);
			socket.emit("room:join", { email, room });
		},
		[email, room, socket]
	);

	const handleJoinRoom = useCallback(
		(data) => {
			const { room } = data;
			setLoading(false);
			navigate(`/room/${room}`);
		},
		[navigate]
	);

	useEffect(() => {
		socket.on("room:join", handleJoinRoom);
		return () => {
			socket.off("room:join", handleJoinRoom);
		};
	}, [socket, handleJoinRoom]);

	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6'>
			<h1 className='text-3xl font-bold mb-6'>Lobby</h1>

			{/* Instructions */}
			<div className='bg-gray-800 p-4 rounded-lg shadow-md text-center w-full max-w-md mb-6'>
				<h2 className='text-xl font-semibold mb-2'>Instructions:</h2>
				<ul className='list-disc list-inside text-gray-300 text-sm'>
					<li>Enter your **Email ID** and any secret **Room Number**.</li>
					<li>Tell your friend to enter the **same Room Number**.</li>
					<li>Click **Join** to enter the room.</li>
				</ul>
			</div>

			{/* Form */}
			<form
				onSubmit={handleSubmitForm}
				className='bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md'
			>
				<div className='mb-4'>
					<label htmlFor='email' className='block text-gray-300 mb-1'>
						Email ID
					</label>
					<input
						type='email'
						id='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className='w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
						required
					/>
				</div>

				<div className='mb-4'>
					<label htmlFor='room' className='block text-gray-300 mb-1'>
						Room Number
					</label>
					<input
						type='text'
						id='room'
						value={room}
						onChange={(e) => setRoom(e.target.value)}
						className='w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
						required
					/>
				</div>

				<button
					type='submit'
					disabled={loading}
					className={`w-full ${
						loading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-500"
					} text-white font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center`}
				>
					{loading ? (
						<svg
							className='animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full'
							viewBox='0 0 24 24'
						></svg>
					) : (
						"Join"
					)}
				</button>
			</form>
		</div>
	);
};

export default LobbyScreen;
