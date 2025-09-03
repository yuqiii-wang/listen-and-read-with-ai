<template>
	<view class="profile-container">
		<!-- The component now uses the UserProfileCacheService, which ensures a profile always exists. -->
		<view v-if="userProfile" class="profile-info">
			<!-- User Profile Section -->
			<view class="profile-header">
				<uni-icons type="person-circle-filled" size="80" color="#007AFF"></uni-icons>
				<!-- View Mode -->
				<view v-if="!isEditing" class="profile-details">
					<text class="username">{{ userProfile.username }}</text>
					<text class="email">{{ userProfile.email || 'No email provided' }}</text>
					<button class="edit-btn" size="mini" @click="handleEdit">Edit Profile</button>
				</view>
				<!-- Edit Mode -->
				<view v-else class="profile-edit-form">
					<uni-easyinput class="input-field" v-model="editableUser.username" placeholder="Enter your name" />
					<uni-easyinput class="input-field" v-model="editableUser.email" placeholder="Enter your email" />
					<view class="form-buttons">
						<button size="mini" type="primary" @click="handleSave">Save</button>
						<button size="mini" @click="handleCancel">Cancel</button>
					</view>
				</view>
			</view>

			<!-- AI Budget Section -->
			<view class="profile-section">
				<view class="budget-item">
					<view class="budget-left">
						<uni-icons type="wallet" size="24" color="#007AFF"></uni-icons>
						<text class="section-title">AI Budget</text>
						<text class="budget-value">{{ userProfile.aiBudget }}</text>
					</view>
					<button class="top-up-btn" size="mini" type="default" @click="handleTopUp">Top up</button>
				</view>
				<view class="rules-item" @click="showConsumptionRules">
					<uni-icons type="help-filled" size="20" color="#999"></uni-icons>
					<text class="rules-text">AI budget consumption rules</text>
				</view>
			</view>

			<!-- ALIGNED: History Section bound to userProfile.readHistory -->
			<view class="profile-section">
				<view class="history-item">
					<uni-icons type="calendar" size="24" color="#007AFF"></uni-icons>
					<text class="section-title">Reading History</text>
				</view>
				<uni-list class="history-list" :border="false">
					<uni-list-item title="Total reading time" :rightText="userProfile.readHistory.totalReadingTime"></uni-list-item>
					<uni-list-item title="This month" :rightText="userProfile.readHistory.thisMonthReadingTime"></uni-list-item>
					<uni-list-item title="Total read books" :rightText="String(userProfile.readHistory.totalReadBooks)"></uni-list-item>
					<uni-list-item title="Total finished read book" :rightText="String(userProfile.readHistory.totalFinishedBooks)"></uni-list-item>
					
					<uni-list-item :border="true">
						<template v-slot:body>
							<view class="favorite-books-area">
								<view class="favorite-books-header" @click="isFavoriteBooksExpanded = !isFavoriteBooksExpanded">
									<text class="custom-item-title">Favorite Books</text>
									<uni-icons :type="isFavoriteBooksExpanded ? 'up' : 'down'" size="16" color="#666"></uni-icons>
								</view>
								<!-- ALIGNED: Loop over favoriteBooksDetails to show titles -->
								<view v-show="isFavoriteBooksExpanded" class="favorite-books-container">
									<view v-if="favoriteBooksDetails.length === 0">
										<text class="book-title">No favorite books yet.</text>
									</view>
									<view v-for="book in favoriteBooksDetails" :key="book.bookId" class="book-entry">
										<text class="book-title">{{ book.title }}</text>
									</view>
								</view>
							</view>
						</template>
					</uni-list-item>
				</uni-list>
			</view>
		</view>
	</view>
</template>

<script>
	// --- ALIGNED: Import the correct services ---
	import userProfileCacheService from '@/services/UserProfileCacheService';
	import bookCacheService from '@/services/BookCacheService';

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
				// UI state for the favorites list
				isFavoriteBooksExpanded: false,
				// ALIGNED: Holds metadata for favorite books (title, etc.)
				favoriteBooksDetails: [],
			};
		},
		onShow() {
			// This single method now handles loading and initialization
			this.loadUserProfile();
		},
		methods: {
			/**
			 * ALIGNED: Loads the profile from the service.
			 * This service handles creating a profile if one doesn't exist
			 * and always recalculates reading stats.
			 */
			loadUserProfile() {
				this.userProfile = userProfileCacheService.getUserProfile();
				this.loadFavoriteBookDetails();
			},
			/**
			 * ALIGNED: Fetches details for favorite books.
			 * The profile stores book IDs, so we need to get the metadata (like title)
			 * from the BookCacheService to display them.
			 */
			loadFavoriteBookDetails() {
				if (this.userProfile && this.userProfile.readHistory.favoriteBooks) {
					this.favoriteBooksDetails = this.userProfile.readHistory.favoriteBooks
						.map(bookId => bookCacheService.getBookMetadata(bookId))
						.filter(book => book !== null); // Filter out any potential nulls if a book was deleted
				} else {
					this.favoriteBooksDetails = [];
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
	/* --- General --- */
	.profile-container {
		padding: 20px;
		box-sizing: border-box;
	}

	/* --- Logged In View --- */
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
	}

	.username {
		font-size: 24px;
		font-weight: bold;
	}

	.email {
		font-size: 16px;
		color: #666;
		margin-top: 5px;
	}

	.edit-btn {
		margin-top: 15px;
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

	/* --- Profile Sections (Budget, History) --- */
	.profile-section {
		width: 100%;
		padding: 15px;
		background-color: #f9f9f9;
		border-radius: 8px;
		box-sizing: border-box;
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
		color: #007AFF;
		margin-left: 15px;
	}

	.top-up-btn {
		border: 1px solid #007AFF !important;
		color: #007AFF !important;
		background-color: #fff !important;
		margin-right: 5px;
	}

	.rules-item {
		display: flex;
		align-items: center;
		margin-top: 15px;
		padding-top: 10px;
		border-top: 1px solid #e5e5e5;
	}

	.rules-text {
		font-size: 14px;
		color: #666;
		margin-left: 8px;
	}

	/* --- History Section --- */
	.history-item {
		display: flex;
		align-items: center;
	}

	.history-list {
		margin-top: 10px;
		background-color: transparent;
	}

	/* --- Favorite Books Styling --- */
	.favorite-books-area {
		width: 100%;
	}

	.favorite-books-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		cursor: pointer;
	}

	.custom-item-title {
		font-size: 15px;
		color: #3b4144;
	}

	.favorite-books-container {
		padding: 8px 0 0 0;
		box-sizing: border-box;
	}

	.book-entry {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		border-top: 1px solid #f5f5f5;
	}

	.book-title {
		font-size: 14px;
		color: #666;
	}
</style>