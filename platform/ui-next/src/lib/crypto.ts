const ALGORITHM = "AES-CBC";
const IV_LENGTH = 16;
const KEY_HEX = process.env.VITE_ENCRYPTION_KEY;

function hexToBytes(hex: string): ArrayBuffer {
	if (!hex) return new ArrayBuffer(0);
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes.buffer;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function encrypt(data: string): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const key = await window.crypto.subtle.importKey(
		"raw",
		hexToBytes(KEY_HEX),
		{ name: ALGORITHM },
		false,
		["encrypt"],
	);
	const encrypted = await window.crypto.subtle.encrypt(
		{ name: ALGORITHM, iv },
		key,
		new TextEncoder().encode(data),
	);
	// Concatenate encrypted + iv
	const encryptedBytes = new Uint8Array(encrypted);
	const result = new Uint8Array(encryptedBytes.length + iv.length);
	result.set(encryptedBytes, 0);
	result.set(iv, encryptedBytes.length);
	return bytesToHex(result);
}

export async function decrypt(data: string): Promise<string> {
	const binaryData = new Uint8Array(hexToBytes(data));
	const iv = binaryData.slice(-IV_LENGTH);
	const encryptedData = binaryData.slice(0, binaryData.length - IV_LENGTH);
	const key = await window.crypto.subtle.importKey(
		"raw",
		hexToBytes(KEY_HEX),
		{ name: ALGORITHM },
		false,
		["decrypt"],
	);
	const decrypted = await window.crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encryptedData);
	return new TextDecoder().decode(decrypted);
}
