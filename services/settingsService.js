// A simple service to manage user settings persistence.
const VOLUME_KEY = 'user_volume';
const VOICE_KEY = 'user_voice';
const FONT_SIZE_KEY = 'user_font_size';
const SPEED_KEY = 'user_speed';
const BACKGROUND_KEY = 'user_background';
const LISTENING_MODE_KEY = 'user_listening_mode';
const LIBRARY_BOOKS_KEY = 'user_library_books';
const READING_TIME_KEY = 'user_reading_time'; // Key for total reading time

const settingsService = {
	/**
	 * Retrieves all user settings from storage.
	 * @returns {object} An object containing all user settings.
	 */
	getSettings() {
		return {
			volume: uni.getStorageSync(VOLUME_KEY) || 80,
			voice: uni.getStorageSync(VOICE_KEY) || 'Female Voice',
			fontSize: uni.getStorageSync(FONT_SIZE_KEY) || 16,
			speed: uni.getStorageSync(SPEED_KEY) || 1.0,
			background: uni.getStorageSync(BACKGROUND_KEY) || { name: 'White', color: '#FFFFFF' },
			listeningMode: uni.getStorageSync(LISTENING_MODE_KEY) || 'Once'
		};
	},

	// ... other save methods (saveVolume, saveVoice, etc.) ...
	saveVolume(volume) { uni.setStorageSync(VOLUME_KEY, volume); },
	saveVoice(voice) { uni.setStorageSync(VOICE_KEY, voice); },
	saveFontSize(size) { uni.setStorageSync(FONT_SIZE_KEY, size); },
	saveSpeed(speed) { uni.setStorageSync(SPEED_KEY, speed); },
	saveBackground(theme) { uni.setStorageSync(BACKGROUND_KEY, theme); },
	saveListeningMode(mode) { uni.setStorageSync(LISTENING_MODE_KEY, mode); },
	
	/**
	 * Retrieves the total accumulated reading time.
	 * @returns {number} The total reading time in seconds.
	 */
	getReadingTime() {
		return uni.getStorageSync(READING_TIME_KEY) || 0;
	},

	/**
	 * UPDATED: Saves the new total reading time.
	 * @param {number} totalSeconds - The new total reading time in seconds to save.
	 */
	updateReadingTime(totalSeconds) {
		uni.setStorageSync(READING_TIME_KEY, totalSeconds);
	},

	// --- Library Functions ---

	getLibraryBooks() {
		return uni.getStorageSync(LIBRARY_BOOKS_KEY) || [];
	},
	
	addBookToLibrary(book) {
		const library = this.getLibraryBooks();
		if (!library.some(b => b.marketId === book.marketId)) {
			library.push(book);
			uni.setStorageSync(LIBRARY_BOOKS_KEY, library);
		}
	},
	
	removeBookFromLibrary(marketId) {
		let library = this.getLibraryBooks();
		library = library.filter(b => b.marketId !== marketId);
		uni.setStorageSync(LIBRARY_BOOKS_KEY, library);
	},

	updateBookInLibrary(updatedBook) {
		let library = this.getLibraryBooks();
		const index = library.findIndex(b => b.marketId === updatedBook.marketId);
		if (index !== -1) {
			library[index] = updatedBook;
			uni.setStorageSync(LIBRARY_BOOKS_KEY, library);
		}
	},
	
	isBookInLibrary(marketId) {
		const library = this.getLibraryBooks();
		return library.some(b => b.marketId === marketId);
	}
};

export default settingsService;