<template>
	<view class="profile-container">
		<!-- The component now assumes the user is always logged in (as a visitor or registered user) -->
		<!-- Logged In View -->
		<view v-if="isLoggedIn" class="profile-info">
			<!-- User Profile Section -->
			<view class="profile-header">
				<uni-icons type="person-circle-filled" size="80" color="#007AFF"></uni-icons>
				<!-- View Mode -->
				<view v-if="!isEditing" class="profile-details">
					<text class="username">{{ user.username }}</text>
					<text class="email">{{ user.email || 'No email provided' }}</text>
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
						<text class="budget-value">{{ user.aiBudget }}</text>
					</view>
					<button class="top-up-btn" size="mini" type="default" @click="handleTopUp">Top up</button>
				</view>
				<view class="rules-item" @click="showConsumptionRules">
					<uni-icons type="help-filled" size="20" color="#999"></uni-icons>
					<text class="rules-text">AI budget consumption rules</text>
				</view>
			</view>

			<!-- History Section -->
			<view class="profile-section">
				<view class="history-item">
					<uni-icons type="calendar" size="24" color="#007AFF"></uni-icons>
					<text class="section-title">Reading History</text>
				</view>
				<uni-list class="history-list" :border="false">
					<uni-list-item title="Total reading time" :rightText="user.history.totalReadingTime"></uni-list-item>
					<uni-list-item title="This month" :rightText="user.history.thisMonthReadingTime"></uni-list-item>
					<uni-list-item title="Total read books" :rightText="String(user.history.totalReadBooks)"></uni-list-item>
					<uni-list-item title="Total finished read book" :rightText="String(user.history.totalFinishedBooks)"></uni-list-item>
					
					<uni-list-item :border="true">
						<template v-slot:body>
							<view class="favorite-books-area">
								<view class="favorite-books-header" @click="isFavoriteBooksExpanded = !isFavoriteBooksExpanded">
									<text class="custom-item-title">Favorite Books</text>
									<uni-icons :type="isFavoriteBooksExpanded ? 'up' : 'down'" size="16" color="#666"></uni-icons>
								</view>
								<view v-show="isFavoriteBooksExpanded" class="favorite-books-container">
									<view v-for="(book, index) in user.history.favoriteBooks" :key="index" class="book-entry">
										<text class="book-title">{{ book.title }}</text>
										<text class="book-time">{{ book.time }}</text>
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
	export default {
		data() {
			return {
				isLoggedIn: false,
				user: {},
				isEditing: false,
				editableUser: {
					username: '',
					email: ''
				},
				isFavoriteBooksExpanded: false
			};
		},
		onShow() {
			this.checkLoginStatus();
		},
		methods: {
			checkLoginStatus() {
				const loggedInUser = uni.getStorageSync('user');
				if (loggedInUser) {
					this.isLoggedIn = true;
					this.user = loggedInUser;
				} else {
					const rememberedVisitor = uni.getStorageSync('visitor_profile');
					if (rememberedVisitor) {
						this.loginUser(rememberedVisitor);
					} else {
						this.signUpAsVisitor();
					}
				}
			},
			generateUUID() {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					var r = Math.random() * 16 | 0,
						v = c == 'x' ? r : (r & 0x3 | 0x8);
					return v.toString(16);
				});
			},
			signUpAsVisitor() {
				const randomString = Math.random().toString(36).substring(2, 8);
				const visitorUsername = `Visitor_${randomString}`;

				const newUser = {
					uuid: this.generateUUID(),
					username: visitorUsername,
					email: '',
					aiBudget: 100,
					history: {
						totalReadingTime: '5h 32m',
						thisMonthReadingTime: '1h 15m',
						totalReadBooks: 12,
						totalFinishedBooks: 5,
						favoriteBooks: [{
							title: 'The Midnight Library',
							time: '2h 10m'
						}, {
							title: 'Project Hail Mary',
							time: '1h 45m'
						}, {
							title: 'Klara and the Sun',
							time: '1h 37m'
						}]
					}
				};

				uni.setStorageSync('visitor_profile', newUser);
				this.loginUser(newUser);
			},
			loginUser(userData) {
				uni.setStorageSync('user', userData);
				this.isLoggedIn = true;
				this.user = userData;
				uni.$emit('userLoggedIn', userData);
			},
			handleEdit() {
				this.editableUser.username = this.user.username;
				this.editableUser.email = this.user.email;
				this.isEditing = true;
			},
			handleSave() {
				this.user.username = this.editableUser.username;
				this.user.email = this.editableUser.email;
				uni.setStorageSync('user', this.user);

				// If the user being edited is the stored visitor, update the visitor profile as well
				const visitorProfile = uni.getStorageSync('visitor_profile');
				if (visitorProfile && visitorProfile.uuid === this.user.uuid) {
					uni.setStorageSync('visitor_profile', this.user);
				}

				uni.$emit('userLoggedIn', this.user);
				this.isEditing = false;
				uni.showToast({
					title: 'Profile updated!',
					icon: 'success'
				});
			},
			handleCancel() {
				this.isEditing = false;
			},
			handleOAuthLogin(provider) {
				uni.showToast({
					title: `Initiating ${provider} login...`,
					icon: 'none'
				});
			},
			handleTopUp() {
				uni.showToast({
					title: 'Redirecting to top-up page...',
					icon: 'none'
				});
			},
			showConsumptionRules() {
				uni.showModal({
					title: 'Consumption Rules',
					content: '1. Each AI interaction consumes 1 unit.\n2. Budgets are refilled monthly.',
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

	.book-time {
		font-size: 14px;
		color: #999;
	}
</style>