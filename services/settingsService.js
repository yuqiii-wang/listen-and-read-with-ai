// A simple service to manage user settings persistence.
const VOLUME_KEY = 'user_volume';
const VOICE_KEY = 'user_voice';

const settingsService = {
	/**
	 * Retrieves the saved volume and voice from storage.
	 * Returns default values if nothing is saved.
	 * @returns {{volume: number, voice: string}}
	 */
	getSettings() {
		return {
			volume: uni.getStorageSync(VOLUME_KEY) || 80, // Default volume is 80
			voice: uni.getStorageSync(VOICE_KEY) || 'Female Voice' // Default voice
		};
	},

	/**
	 * Saves the volume setting to the device's storage.
	 * @param {number} volume - The volume level to save (0-100).
	 */
	saveVolume(volume) {
		uni.setStorageSync(VOLUME_KEY, volume);
	},

	/**
	 * Saves the selected voice setting to the device's storage.
	 * @param {string} voice - The name of the voice to save.
	 */
	saveVoice(voice) {
		uni.setStorageSync(VOICE_KEY, voice);
	}
};

export default settingsService;