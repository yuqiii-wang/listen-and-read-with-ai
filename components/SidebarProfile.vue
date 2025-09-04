<template>
	<view 
		class="sidebar-container" 
		:style="{ 
			backgroundColor: themeStyles.backgroundColor,
			'--theme-list-item-bg': themeStyles.listItem?.backgroundColor || themeStyles.backgroundColor,
			'--theme-list-item-text': themeStyles.listItem?.textColor || themeStyles.primaryTextColor,
			'--theme-border-color': themeStyles.borderColor
		}">
		<view class="profile-section" @click="goToProfile" :style="{ borderBottomColor: themeStyles.borderColor }">
			<uni-icons type="person-circle-filled" size="60" color="#007AFF"></uni-icons>
			<text class="username" :style="{ color: themeStyles.primaryTextColor }">{{ username }}</text>
		</view>
		<uni-list>
			<uni-list-item 
				title="Settings" 
				showArrow 
				clickable 
				@click="goToSettings">
			</uni-list-item>
			<uni-list-item 
				title="BookManagement" 
				showArrow 
				clickable 
				@click="goToBookManagement">
			</uni-list-item>
			<uni-list-item 
				title="My Account" 
				showArrow 
				clickable 
				@click="goToProfile">
			</uni-list-item>
		</uni-list>
	</view>
</template>

<script>
	import settingsCacheService from '@/services/settingsCacheService';

	export default {
		name: "SidebarProfile",
		data() {
			return {
				// The default username to show before the user profile is loaded
				username: 'Visitor',
				themeStyles: {}
			};
		},
		created() {
			// Check for logged-in user on component creation
			this.updateUsernameFromStorage();
			this.loadTheme();

			// Listen for profile updates (e.g., username change)
			uni.$on('userLoggedIn', this.updateUsername);
			uni.$on('themeChanged', this.loadTheme);
		},
		beforeDestroy() {
			// Clean up the event listener to prevent memory leaks
			uni.$off('userLoggedIn', this.updateUsername);
			uni.$off('themeChanged', this.loadTheme);
		},
		methods: {
			/**
			 * Loads the current theme from the settings service and applies it.
			 */
			loadTheme() {
				const settings = settingsCacheService.getSettings();
				this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
			},
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
		height: 100%;
	}
	.profile-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 0;
		border-bottom: 1px solid;
		margin-bottom: 10px;
	}
	.username {
		margin-top: 10px;
		font-size: 18px;
		font-weight: 600;
	}

	/* Theme-aware list item styling */
	::v-deep .uni-list {
		background-color: transparent !important;
	}
	
	::v-deep .uni-list-item {
		background-color: var(--theme-list-item-bg, #ffffff) !important;
	}

	::v-deep .uni-list-item__content-title {
		color: var(--theme-list-item-text, #333) !important;
	}
	
	::v-deep .uni-icons {
		color: var(--theme-list-item-text, #333) !important;
	}
</style>