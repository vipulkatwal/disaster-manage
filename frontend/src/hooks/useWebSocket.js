import { useState, useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const WS_BASE_URL = process.env.REACT_APP_WS_URL || "ws://localhost:5000";

export const useWebSocket = () => {
	const [connected, setConnected] = useState(false);
	const [error, setError] = useState(null);
	const [lastMessage, setLastMessage] = useState(null);
	const socketRef = useRef(null);
	const reconnectTimeoutRef = useRef(null);
	const reconnectAttemptsRef = useRef(0);
	const maxReconnectAttempts = 5;
	const connectionAttemptsRef = useRef(0);
	const lastConnectionAttemptRef = useRef(0);

	const connect = useCallback(() => {
		try {
			// Rate limiting: prevent connection attempts more than once per second
			const now = Date.now();
			if (now - lastConnectionAttemptRef.current < 1000) {
				console.warn("WebSocket: Connection attempt throttled");
				return;
			}
			lastConnectionAttemptRef.current = now;

			// Prevent excessive connection attempts
			if (connectionAttemptsRef.current > 5) {
				console.warn("WebSocket: Too many connection attempts, stopping");
				return;
			}

			if (socketRef.current?.connected) {
				console.log("WebSocket: Already connected");
				return;
			}

			if (socketRef.current) {
				socketRef.current.disconnect();
			}

			connectionAttemptsRef.current++;
			console.log(
				`WebSocket: Attempting connection #${connectionAttemptsRef.current}`
			);

			socketRef.current = io(WS_BASE_URL, {
				transports: ["websocket", "polling"],
				timeout: 10000,
				reconnection: true,
				reconnectionAttempts: maxReconnectAttempts,
				reconnectionDelay: 2000,
				forceNew: true,
			});

			socketRef.current.on("connect", () => {
				console.log("🔌 WebSocket connected");
				setConnected(true);
				setError(null);
				reconnectAttemptsRef.current = 0;
				connectionAttemptsRef.current = 0;
				window.socket = socketRef.current;
			});

			socketRef.current.on("connect_error", (error) => {
				console.error("🔌 WebSocket connection error:", error);
				setError(error.message);
				setConnected(false);
				reconnectAttemptsRef.current += 1;

				if (reconnectAttemptsRef.current < maxReconnectAttempts) {
					reconnectTimeoutRef.current = setTimeout(() => {
						connect();
					}, 2000);
				}
			});

			socketRef.current.on("disconnect", (reason) => {
				console.log("🔌 WebSocket disconnected:", reason);
				setConnected(false);

				// Only attempt to reconnect for certain disconnect reasons
				if (reason === "io server disconnect" || reason === "transport close") {
					// Wait longer before attempting to reconnect
					setTimeout(() => {
						if (!connected) {
							connect();
						}
					}, 3000);
				}
			});

			socketRef.current.on("reconnect", (attemptNumber) => {
				console.log(
					"🔌 WebSocket reconnected after",
					attemptNumber,
					"attempts"
				);
				setConnected(true);
				setError(null);
				reconnectAttemptsRef.current = 0;
				connectionAttemptsRef.current = 0;
				toast.success("Reconnected to real-time services");
			});

			socketRef.current.on("reconnect_error", (error) => {
				console.error("🔌 WebSocket reconnection error:", error);
				setError(error.message);
			});

			socketRef.current.on("message", (data) => {
				setLastMessage(data);
			});

			socketRef.current.on("error", (error) => {
				console.error("🔌 WebSocket error:", error);
				setError(error.message);
			});
		} catch (err) {
			console.error("Error creating WebSocket connection:", err);
			setConnected(false);
		}
	}, []);

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
		}

		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
		}

		setConnected(false);
		setLastMessage(null);
		connectionAttemptsRef.current = 0;
	}, []);

	const emit = useCallback(
		(event, data) => {
			if (socketRef.current && connected) {
				socketRef.current.emit(event, data);
				return true;
			} else {
				console.warn("WebSocket not connected, cannot emit:", event);
				return false;
			}
		},
		[connected]
	);

	const on = useCallback((event, callback) => {
		if (socketRef.current) {
			socketRef.current.on(event, callback);
		}
	}, []);

	const off = useCallback((event, callback) => {
		if (socketRef.current) {
			socketRef.current.off(event, callback);
		}
	}, []);

	// Auto-connect on mount
	useEffect(() => {
		connect();

		return () => {
			disconnect();
		};
	}, [connect, disconnect]);

	// Handle page visibility changes
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Page is hidden, disconnect to save resources
				if (socketRef.current?.connected) {
					socketRef.current.disconnect();
				}
			} else {
				// Page is visible, reconnect if needed
				if (!connected && socketRef.current?.disconnected) {
					connect();
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [connected, connect]);

	useEffect(() => {
		const handleOnline = () => {
			if (!connected) {
				connect();
			}
		};

		const handleOffline = () => {
			setConnected(false);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [connected, connect]);

	return {
		connected,
		error,
		lastMessage,
		connect,
		disconnect,
		emit,
		on,
		off,
		socket: socketRef.current,
	};
};
