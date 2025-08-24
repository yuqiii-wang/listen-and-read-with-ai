<template>
	<!-- UPDATED: Main wrapper to use flexbox for footer positioning -->
	<view class="info-panel-wrapper">
		<view class="info-panel-content">
			<view class="panel-header">
				<text class="panel-title">{{ info.title }}</text>
				<uni-icons type="close" size="24" color="#666" @click="closePanel"></uni-icons>
			</view>
			<scroll-view scroll-y class="panel-body">
				<text>{{ info.content }}</text>
			</scroll-view>
		</view>

		<!-- NEW: Footer with the action button -->
		<view class="panel-footer">
			<button class="add-button" @click="addToText">Add in Text</button>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'InfoPanel',
		props: {
			info: {
				type: Object,
				default: () => ({ title: 'Information', content: 'No content available.' })
			}
		},
		methods: {
			closePanel() {
				this.$emit('close');
			},
			// NEW: Method to emit the event to the parent
			addToText() {
				// Signal the parent (SidebarInfo) that the user wants to add this content
				this.$emit('add-to-text');
			}
		}
	};
</script>

<style scoped>
	.info-panel-wrapper {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 66.67vh; /* 2/3 of the viewport height */
		background-color: #ffffff;
		border-top-left-radius: 16px;
		border-top-right-radius: 16px;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		z-index: 1001; /* Must be on top of the sidebar */
		display: flex;
		flex-direction: column;
		animation: slide-up 0.3s ease-out;
	}

	.info-panel-content {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		/* Important for the scroll-view to not overflow */
		min-height: 0;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		border-bottom: 1px solid #e5e5e5;
		flex-shrink: 0;
	}

	.panel-title {
		font-size: 18px;
		font-weight: bold;
	}

	.panel-body {
		padding: 20px;
		flex-grow: 1;
		overflow-y: auto;
		height: 100%;
	}
	
	/* NEW: Styles for the footer and button */
	.panel-footer {
		padding: 15px 20px;
		padding-bottom: calc(var(--safe-area-inset-bottom) + 15px);
		border-top: 1px solid #e5e5e5;
		flex-shrink: 0;
		background-color: #fff;
	}
	
	.add-button {
		background-color: #007AFF;
		color: white;
		border-radius: 8px;
		font-size: 16px;
		height: 44px;
		line-height: 44px;
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>