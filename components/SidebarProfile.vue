<template>
	<view class="sidebar-container">
		<view class="profile-section">
			<uni-icons type="person-circle-filled" size="60" color="#007AFF"></uni-icons>
			<text class="username">Username</text>
		</view>
		<uni-list>
			<!-- Add a click event handler to navigate to the settings page -->
			<uni-list-item title="Settings" showArrow clickable @click="goToSettings"></uni-list-item>
			<uni-list-item title="My Account" showArrow clickable></uni-list-item>
			<uni-list-item title="Logout" showArrow clickable></uni-list-item>
		</uni-list>
	</view>
</template>

<script>
	export default {
		name: "SidebarProfile",
		data() {
			return {
				
			};
		},
		methods: {
			/**
			 * Navigates to the Settings page.
			 */
			goToSettings() {
				uni.navigateTo({
					url: '/pages/index/Settings' // Ensure this path matches your file structure in pages.json
				});
			}
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