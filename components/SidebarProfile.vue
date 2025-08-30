<template>
	<view class="sidebar-container">
		<view class="profile-section" @click="goToProfile">
			<uni-icons type="person-circle-filled" size="60" color="#007AFF"></uni-icons>
			<text class="username">{{ username }}</text>
		</view>
		<uni-list>
			<uni-list-item title="Settings" showArrow clickable @click="goToSettings"></uni-list-item>
			<uni-list-item title="BookManagement" showArrow clickable @click="goToBookManagement"></uni-list-item>
			<uni-list-item title="My Account" showArrow clickable @click="goToProfile"></uni-list-item>
		</uni-list>
	</view>
</template>

<script>
	export default {
		name: "SidebarProfile",
		data() {
			return {
				// The default username to show before the user profile is loaded
				username: 'Visitor'
			};
		},
		created() {
			// Check for logged-in user on component creation
			this.updateUsernameFromStorage();

			// Listen for profile updates (e.g., username change)
			uni.$on('userLoggedIn', this.updateUsername);
		},
		beforeDestroy() {
			// Clean up the event listener to prevent memory leaks
			uni.$off('userLoggedIn', this.updateUsername);
		},
		methods: {
			// Renamed for clarity: this method now only updates the username from storage
			updateUsernameFromStorage() {
				const user = uni.getStorageSync('user');
				if (user && user.username) {
					this.username = user.username;
				} else {
					// Fallback in case storage is empty on initial load
					this.username = 'Visitor';
				}
			},
			// This method handles the event when a user's data is updated
			updateUsername(user) {
				if (user && user.username) {
					this.username = user.username;
				}
			},
			goToProfile() {
				uni.navigateTo({
					url: '/pages/index/Profile'
				});
			},
			goToSettings() {
				uni.navigateTo({
					url: '/pages/index/Settings'
				});
			},
			goToBookManagement() {
				uni.navigateTo({
					url: '/pages/index/BookManagement'
				});
			},
		}
	}
</script>

<style scoped>
	.sidebar-container {
		padding: 15px;
		background-color: #fff;
		height: 100%;
	}
	.profile-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 0;
		border-bottom: 1px solid #e5e5e5;
		margin-bottom: 10px;
	}
	.username {
		margin-top: 10px;
		font-size: 18px;
		font-weight: 600;
	}
</style>