<template>
	<view class="profile-container" :style="containerStyle">
		<!-- The component now uses the UserProfileCacheService, which ensures a profile always exists. -->
		<view v-if="userProfile" class="profile-info">
			<!-- User Profile Section -->
			<view class="profile-header">
				<uni-icons type="person-circle-filled" size="80" :color="themeStyles.activeColor"></uni-icons>
				<!-- View Mode -->
				<view v-if="!isEditing" class="profile-details">
					<text class="username" :style="usernameStyle">{{ userProfile.username }}</text>
					<text class="email" :style="emailStyle">{{ userProfile.email || 'No email provided' }}</text>
					<button class="edit-btn" :style="editButtonStyle" size="mini" @click="handleEdit">Edit Profile</button>
				</view>
				<!-- Edit Mode -->
				<view v-else class="profile-edit-form">
					<uni-easyinput 
						class="input-field" 
						v-model="editableUser.username" 
						placeholder="Enter your name"
						:styles="inputStyles" />
					<uni-easyinput 
						class="input-field" 
						v-model="editableUser.email" 
						placeholder="Enter your email"
						:styles="inputStyles" />
					<view class="form-buttons">
						<button size="mini" :style="primaryButtonStyle" @click="handleSave">Save</button>
						<button size="mini" :style="secondaryButtonStyle" @click="handleCancel">Cancel</button>
					</view>
				</view>
			</view>

			<!-- AI Budget Section -->
			<view class="profile-section" :style="sectionStyle">
				<view class="budget-item">
					<view class="budget-left">
						<uni-icons type="wallet" size="24" :color="themeStyles.activeColor"></uni-icons>
						<text class="section-title" :style="titleStyle">AI Budget</text>
						<text class="budget-value" :style="budgetValueStyle">{{ userProfile.aiBudget }}</text>
					</view>
					<button class="top-up-btn" :style="topUpButtonStyle" size="mini" @click="handleTopUp">Top up</button>
				</view>
				<view class="rules-item" @click="showConsumptionRules" :style="rulesItemStyle">
					<uni-icons type="help-filled" size="20" :color="themeStyles.secondaryTextColor"></uni-icons>
					<text class="rules-text" :style="rulesTextStyle">AI budget consumption rules</text>
				</view>
			</view>

			<!-- ALIGNED: History Section bound to userProfile.readHistory -->
			<view class="profile-section" :style="sectionStyle">
				<view class="history-item">
					<uni-icons type="calendar" size="24" :color="themeStyles.activeColor"></uni-icons>
					<text class="section-title" :style="titleStyle">Reading History</text>
				</view>
				<uni-list class="history-list" :border="false" :style="listStyle">
					<uni-list-item 
						title="Total reading time" 
						:rightText="userProfile.readHistory.totalReadingTime"
						:style="listItemStyle">
					</uni-list-item>
					<uni-list-item 
						title="This month" 
						:rightText="userProfile.readHistory.thisMonthReadingTime"
						:style="listItemStyle">
					</uni-list-item>
					<uni-list-item 
						title="Total read books" 
						:rightText="String(userProfile.readHistory.totalReadBooks)"
						:style="listItemStyle">
					</uni-list-item>
					<uni-list-item 
						title="Total finished read book" 
						:rightText="String(userProfile.readHistory.totalFinishedBooks)"
						:style="listItemStyle">
					</uni-list-item>
					
					<uni-list-item :border="true" :style="listItemStyle">
						<template v-slot:body>
							<view class="longestReading-books-area">
								<view class="longestReading-books-header" @click="isLongestReadingBooksExpanded = !isLongestReadingBooksExpanded">
									<text class="custom-item-title" :style="itemTitleStyle">LongestReading Books</text>
									<uni-icons 
										:type="isLongestReadingBooksExpanded ? 'up' : 'down'" 
										size="16" 
										:color="themeStyles.secondaryTextColor">
									</uni-icons>
								</view>
								<!-- ALIGNED: Loop over longestReadingBooksDetails to show titles and reading time -->
								<view v-show="isLongestReadingBooksExpanded" class="longestReading-books-container">
									<view v-if="longestReadingBooksDetails.length === 0">
										<text class="book-title" :style="bookTitleStyle">No books with reading time yet.</text>
									</view>
									<view v-for="book in longestReadingBooksDetails" :key="book.bookId" class="book-entry" :style="bookEntryStyle">
										<text class="book-title" :style="bookTitleStyle">{{ book.title }}</text>
										<text class="book-time" :style="bookTitleStyle">{{ formatReadingTime(book.readTime) }}</text>
									</view>
								</view>
							</view>
						</template>
					</uni-list-item>
				</uni-list>
			</view>

			<!-- Consumption History Section -->
			<view class="profile-section" :style="sectionStyle">
				<view class="history-item">
					<uni-icons type="wallet-filled" size="24" :color="themeStyles.activeColor"></uni-icons>
					<text class="section-title" :style="titleStyle">Consumption History</text>
				</view>
				<view v-if="displayedConsumptionHistory.length === 0" class="no-history-message">
					<text :style="bookTitleStyle">No consumption history yet.</text>
				</view>
				<view v-else class="consumption-history-list">
					<view v-for="(record, index) in displayedConsumptionHistory" :key="index" class="consumption-entry" :style="bookEntryStyle">
						<view class="consumption-info">
							<text class="consumption-task" :style="itemTitleStyle">{{ record.aiTask }}</text>
							<text class="consumption-date" :style="bookTitleStyle">{{ formatDate(record.spentAt) }}</text>
						</view>
						<view class="consumption-details">
							<text class="consumption-book" :style="bookTitleStyle">{{ getBookTitle(record.bookId) }}</text>
							<text class="consumption-amount" :style="budgetValueStyle">-{{ record.spentAmount }}</text>
						</view>
					</view>
					<view v-if="canLoadMoreConsumption" class="load-more-container" @click="loadMoreConsumption">
						<uni-icons type="down" size="16" :color="themeStyles.secondaryTextColor"></uni-icons>
						<text class="load-more-text" :style="bookTitleStyle">Load more</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	// --- ALIGNED: Import the correct services ---
	import userProfileCacheService from '@/services/userProfileCacheService';
	import bookCacheService from '@/services/bookCacheService';
	import settingsCacheService from '@/services/settingsCacheService';

	export default {
		data() {
			return {
				// ALIGNED: Main data object from the service
				userProfile: null,
				// State for the edit form
				isEditing: false,
				editableUser: {
					username: '',
					email: ''
				},
				// UI state for the longestReadings list
				isLongestReadingBooksExpanded: false,
				// ALIGNED: Holds metadata for longestReading books (title, etc.)
				longestReadingBooksDetails: [],
				// Theme styles
				themeStyles: {},
				// Consumption history pagination
				consumptionHistoryOffset: 0,
				consumptionHistoryPageSize: 5,
				displayedConsumptionHistory: [],
			};
		},
		computed: {
			// Container and general styles
			containerStyle() {
				return {
					backgroundColor: this.themeStyles.backgroundColor,
				};
			},
			sectionStyle() {
				return {
					backgroundColor: this.themeStyles.listItem?.backgroundColor || this.themeStyles.backgroundColor,
					borderColor: this.themeStyles.borderColor,
				};
			},
			
			// Text styles
			usernameStyle() {
				return {
					color: this.themeStyles.primaryTextColor,
				};
			},
			emailStyle() {
				return {
					color: this.themeStyles.secondaryTextColor,
				};
			},
			titleStyle() {
				return {
					color: this.themeStyles.primaryTextColor,
				};
			},
			budgetValueStyle() {
				return {
					color: this.themeStyles.activeColor,
				};
			},
			itemTitleStyle() {
				return {
					color: this.themeStyles.primaryTextColor,
				};
			},
			bookTitleStyle() {
				return {
					color: this.themeStyles.secondaryTextColor,
				};
			},
			rulesTextStyle() {
				return {
					color: this.themeStyles.secondaryTextColor,
				};
			},

			// Button styles
			editButtonStyle() {
				return {
					backgroundColor: this.themeStyles.backgroundColor,
					color: this.themeStyles.activeColor,
					border: `1px solid ${this.themeStyles.activeColor}`,
				};
			},
			primaryButtonStyle() {
				return {
					backgroundColor: this.themeStyles.button?.backgroundColor || this.themeStyles.activeColor,
					color: this.themeStyles.button?.textColor || this.themeStyles.backgroundColor,
				};
			},
			secondaryButtonStyle() {
				return {
					backgroundColor: this.themeStyles.input?.backgroundColor || this.themeStyles.backgroundColor,
					color: this.themeStyles.primaryTextColor,
					border: `1px solid ${this.themeStyles.borderColor}`,
				};
			},
			topUpButtonStyle() {
				return {
					backgroundColor: this.themeStyles.backgroundColor,
					color: this.themeStyles.activeColor,
					border: `1px solid ${this.themeStyles.activeColor}`,
				};
			},

			// Input styles
			inputStyles() {
				return {
					backgroundColor: this.themeStyles.input?.backgroundColor || this.themeStyles.backgroundColor,
					color: this.themeStyles.input?.textColor || this.themeStyles.primaryTextColor,
					borderColor: this.themeStyles.input?.borderColor || this.themeStyles.borderColor,
				};
			},

			// List styles
			listStyle() {
				return {
					backgroundColor: 'transparent',
				};
			},
			listItemStyle() {
				return {
					backgroundColor: this.themeStyles.listItem?.backgroundColor,
					color: this.themeStyles.listItem?.textColor,
					borderColor: this.themeStyles.listItem?.borderColor,
				};
			},

			// Item styles
			rulesItemStyle() {
				return {
					borderTopColor: this.themeStyles.borderColor,
				};
			},
			bookEntryStyle() {
				return {
					borderTopColor: this.themeStyles.borderColor,
				};
			},

			// Consumption history computed properties
			canLoadMoreConsumption() {
				if (!this.userProfile || !this.userProfile.consumptionHistory) return false;
				return this.consumptionHistoryOffset + this.consumptionHistoryPageSize < this.userProfile.consumptionHistory.length;
			},
		},
		onShow() {
			// This single method now handles loading and initialization
			this.loadUserProfile();
			this.loadTheme();
		},
		methods: {
			/**
			 * Loads the current theme from the settings service and applies it.
			 */
			loadTheme() {
				const settings = settingsCacheService.getSettings();
				this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
			},
			
			/**
			 * ALIGNED: Loads the profile from the service.
			 * This service handles creating a profile if one doesn't exist
			 * and always recalculates reading stats.
			 */
			loadUserProfile() {
				this.userProfile = userProfileCacheService.getUserProfile();
				this.loadLongestReadingBookDetails();
				this.loadConsumptionHistory();
			},
			
			/**
			 * ALIGNED: Fetches details for longestReading books.
			 * Gets books from user's library sorted by reading time (descending).
			 */
			loadLongestReadingBookDetails() {
				const libraryBookIds = bookCacheService.getLibraryBooks();
				const booksWithReadTime = [];
				
				// Get reading time for each book in library
				for (const bookId of libraryBookIds) {
					const readerMeta = bookCacheService.getReaderMetadata(bookId);
					const bookMeta = bookCacheService.getBookMetadata(bookId);
					
					if (readerMeta && bookMeta && readerMeta.readTime > 0) {
						booksWithReadTime.push({
							bookId: bookId,
							title: bookMeta.title,
							readTime: readerMeta.readTime
						});
					}
				}
				
				// Sort by reading time (descending) and take top 5
				this.longestReadingBooksDetails = booksWithReadTime
					.sort((a, b) => b.readTime - a.readTime)
					.slice(0, 5);
			},

			/**
			 * Loads initial consumption history records (first 5)
			 */
			loadConsumptionHistory() {
				this.consumptionHistoryOffset = 0;
				if (this.userProfile && this.userProfile.consumptionHistory) {
					// Sort by spentAt descending (newest first)
					const sortedHistory = this.userProfile.consumptionHistory
						.slice()
						.sort((a, b) => b.spentAt - a.spentAt);
					this.displayedConsumptionHistory = sortedHistory.slice(0, this.consumptionHistoryPageSize);
				} else {
					this.displayedConsumptionHistory = [];
				}
			},

			/**
			 * Loads next 5 consumption history records
			 */
			loadMoreConsumption() {
				if (!this.canLoadMoreConsumption) return;
				
				this.consumptionHistoryOffset += this.consumptionHistoryPageSize;
				const sortedHistory = this.userProfile.consumptionHistory
					.slice()
					.sort((a, b) => b.spentAt - a.spentAt);
				
				const nextBatch = sortedHistory.slice(
					this.consumptionHistoryOffset, 
					this.consumptionHistoryOffset + this.consumptionHistoryPageSize
				);
				
				this.displayedConsumptionHistory = [...this.displayedConsumptionHistory, ...nextBatch];
			},

			/**
			 * Formats timestamp to readable date
			 * @param {number} timestamp - Unix timestamp
			 * @returns {string} Formatted date string
			 */
			formatDate(timestamp) {
				const date = new Date(timestamp);
				const now = new Date();
				const diffTime = Math.abs(now - date);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				
				if (diffDays === 1) {
					return 'Today';
				} else if (diffDays === 2) {
					return 'Yesterday';
				} else if (diffDays <= 7) {
					return `${diffDays - 1} days ago`;
				} else {
					return date.toLocaleDateString();
				}
			},

			/**
			 * Gets book title by book ID
			 * @param {number} bookId - Book ID
			 * @returns {string} Book title or fallback
			 */
			getBookTitle(bookId) {
				const bookMeta = bookCacheService.getBookMetadata(bookId);
				return bookMeta ? bookMeta.title : `Book #${bookId}`;
			},

			/**
			 * Formats reading time from seconds to readable format
			 * @param {number} seconds - Reading time in seconds
			 * @returns {string} Formatted time string
			 */
			formatReadingTime(seconds) {
				const h = Math.floor(seconds / 3600);
				const m = Math.floor((seconds % 3600) / 60);
				if (h > 0) {
					return `${h}h ${m}m`;
				} else {
					return `${m}m`;
				}
			},

			handleEdit() {
				this.editableUser.username = this.userProfile.username;
				this.editableUser.email = this.userProfile.email;
				this.isEditing = true;
			},
			
			/**
			 * ALIGNED: Saves user info using the dedicated service method.
			 */
			handleSave() {
				userProfileCacheService.updateUserInfo({
					username: this.editableUser.username,
					email: this.editableUser.email,
				});
				this.isEditing = false;
				// Reload the profile to ensure the UI is updated with the latest data
				this.loadUserProfile(); 
				uni.showToast({
					title: 'Profile updated!',
					icon: 'success'
				});
			},

			handleCancel() {
				this.isEditing = false;
			},
			
			handleTopUp() {
				// In a real app, this would navigate to a top-up page.
				// For now, we can add a mock top-up using the service.
				userProfileCacheService.addTopUp(100);
				this.loadUserProfile(); // Refresh to show the new balance
				uni.showToast({
					title: 'Added 100 to AI Budget!',
					icon: 'none'
				});
			},
			
			showConsumptionRules() {
				uni.showModal({
					title: 'Consumption Rules',
					content: 'AI budget is used for various AI-powered tasks like generating new book versions or enhancing content.',
					showCancel: false
				});
			}
		}
	}
</script>

<style scoped>
	/* --- General Container --- */
	.profile-container {
		padding: 20px;
		box-sizing: border-box;
		min-height: 100vh;
	}

	/* --- Profile Info Layout --- */
	.profile-info {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 25px;
	}

	.profile-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}

	.profile-details {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 10px;
		gap: 5px;
	}

	.username {
		font-size: 24px;
		font-weight: bold;
	}

	.email {
		font-size: 16px;
	}

	.edit-btn {
		margin-top: 15px;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		border: none;
	}

	/* --- Edit Form --- */
	.profile-edit-form {
		width: 90%;
		margin-top: 10px;
	}

	.input-field {
		margin-bottom: 10px;
	}

	.form-buttons {
		display: flex;
		justify-content: center;
		gap: 15px;
		margin-top: 10px;
	}

	.form-buttons button {
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		border: none;
		min-width: 70px;
	}

	/* --- Profile Sections (Budget, History) --- */
	.profile-section {
		width: 100%;
		padding: 15px;
		border-radius: 8px;
		box-sizing: border-box;
		border: 1px solid;
	}

	.section-title {
		font-size: 16px;
		font-weight: 600;
		margin-left: 8px;
	}

	/* --- Budget Section --- */
	.budget-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.budget-left {
		display: flex;
		align-items: center;
	}

	.budget-value {
		font-size: 18px;
		font-weight: bold;
		margin-left: 15px;
	}

	.top-up-btn {
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 14px;
		border: 1px solid;
	}

	.rules-item {
		display: flex;
		align-items: center;
		margin-top: 15px;
		padding-top: 10px;
		border-top: 1px solid;
	}

	.rules-text {
		font-size: 14px;
		margin-left: 8px;
	}

	/* --- History Section --- */
	.history-item {
		display: flex;
		align-items: center;
		margin-bottom: 10px;
	}

	.history-list {
		margin-top: 10px;
		background-color: transparent;
	}

	/* --- LongestReading Books Styling --- */
	.longestReading-books-area {
		width: 100%;
	}

	.longestReading-books-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		cursor: pointer;
	}

	.custom-item-title {
		font-size: 15px;
	}

	.longestReading-books-container {
		padding: 8px 0 0 0;
		box-sizing: border-box;
	}

	.book-entry {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		border-top: 1px solid;
	}

	.book-title {
		font-size: 14px;
		flex: 1;
	}

	.book-time {
		font-size: 12px;
		margin-left: 10px;
	}

	/* --- Consumption History Styling --- */
	.no-history-message {
		padding: 15px 0;
		text-align: center;
	}

	.consumption-history-list {
		padding-top: 10px;
	}

	.consumption-entry {
		display: flex;
		flex-direction: column;
		padding: 12px 0;
		border-top: 1px solid;
		gap: 4px;
	}

	.consumption-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.consumption-task {
		font-size: 14px;
		font-weight: 500;
		flex: 1;
	}

	.consumption-date {
		font-size: 12px;
	}

	.consumption-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.consumption-book {
		font-size: 12px;
		flex: 1;
	}

	.consumption-amount {
		font-size: 14px;
		font-weight: 600;
	}

	.load-more-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
		cursor: pointer;
		gap: 8px;
	}

	.load-more-text {
		font-size: 14px;
	}

	/* --- Global uni-list overrides for theme support --- */
	:deep(.uni-list) {
		background-color: transparent !important;
	}
	
	:deep(.uni-list-item) {
		background-color: transparent !important;
	}

	:deep(.uni-list-item__content-title) {
		color: inherit !important;
	}
	
	:deep(.uni-list-item__content-note) {
		color: inherit !important;
	}

	:deep(.uni-icons) {
		color: inherit !important;
	}
</style>