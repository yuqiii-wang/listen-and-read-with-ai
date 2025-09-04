<template>
	<!-- MODIFIED: Added @click.stop to the root view to prevent clicks from bubbling up to the parent -->
	<view @click.stop>
		<!-- Top Bar UI -->
		<uni-transition mode-class="fade" :show="show">
			<view v-if="show" class="top-bar" :style="{ backgroundColor: topBarBackgroundColor }">
				<view class="top-bar-content">
					<uni-icons type="back" size="24" :color="iconColor" @click.stop="goBackIndex"></uni-icons>
					<view class="top-bar-actions">
						<text 
							v-if="totalVersionNum > 1 && this.selectedText.length === 0" 
							class="action-btn" 
							:style="{ color: actionColor }" 
							@click.stop="toggleHistoryPanel"
						>AI History</text>
						<text 
							class="action-btn" 
							:style="{ color: actionColor }" 
							@click.stop="handleShowAiInfo"
						>{{ topBarActionText }}</text>
					</view>
				</view>
			</view>
		</uni-transition>

		<uni-transition mode-class="fade" :show="isHistoryPanelVisible">
			<view class="overlay" @click="toggleHistoryPanel"></view>
		</uni-transition>
				
		<view :class="['history-panel-container', { 'panel-visible': isHistoryPanelVisible }]" :style="{ backgroundColor: historyPanelBackgroundColor }">
			<!-- MODIFIED: Ensured all necessary props are passed to BookHistoryVersions -->
			<BookHistoryVersions
				v-if="isHistoryPanelMounted"
				:show="isHistoryPanelVisible"
				:allVersions="allVersions"
				:bookId="bookId"
				:theme="theme"
				:current-version-id="currentVersionId" 
				:just-completed-a-i-versions="justCompletedAIVersions"
				@delete-version="$emit('delete-version', $event)"
				@switch-version="$emit('switch-version', $event)"
				@reset-just-completed-versions="$emit('reset-just-completed-versions')"
				@cancel-ai-task="$emit('cancel-ai-task', $event)"
				@accelerate-ai-task="$emit('accelerate-ai-task', $event)"
			/>
		</view>

		<sidebar-info
			v-if="isSidebarOpen"
			:mode="sidebarMode"
			:user-input-text="committedSelectedText"
			:bookId="bookId"
			:theme="theme"
			@close="closeAiSidebar"
			@insert-content="$emit('insert-content', $event)"
			@task-started="$emit('task-started')"
		></sidebar-info>
	</view>
</template>

<script>
	import SidebarInfo from '@/components/SidebarInfo';
	import BookHistoryVersions from '@/components/BookHistoryVersions';

	export default {
		name: 'BookAICheckBar',
		components: { SidebarInfo, BookHistoryVersions },
		props: {
			bookId: { type: [String, Number], required: true },
			show: { type: Boolean, default: false },
			theme: { type: Object, required: true },
			topBarActionText: { type: String, default: 'AI Rewrite' },
			totalVersionNum: { type: Number, default: 0 },
			isAiActionPending: { type: Boolean, default: false },
			selectedText: { type: String, default: '' },
			allVersions: { type: Array, default: () => [] },
			currentVersionId: { type: Number, default: 1 },
			justCompletedAIVersions: { type: Array, default: () => [] }
		},
		emits: [
			'task-started', 
			'insert-content', 
			'ai-action-committed', 
			'cancel-ai-action',
			'delete-version',
			'switch-version',
			'reset-just-completed-versions',
			'cancel-ai-task',
			'accelerate-ai-task'
		],
		data() {
			return {
				isSidebarOpen: false,
				sidebarMode: 'default',
				committedSelectedText: '',
				isHistoryPanelVisible: false,
				isHistoryPanelMounted: false,
			};
		},
		watch: {
			show(newVal) {
				if (!newVal) {
					this.isHistoryPanelVisible = false;
				}
			},
			isHistoryPanelVisible(newVal) {
				if (newVal && !this.isHistoryPanelMounted) {
					this.isHistoryPanelMounted = true;
				}
			}
		},
		computed: {
			topBarBackgroundColor() {
				const navColor = this.theme.navBar?.backgroundColor || '#FFFFFF';
				return this.hexToRgba(navColor, 0.95);
			},
			historyPanelBackgroundColor() {
				return this.theme.backgroundColor || '#FFFFFF';
			},
			iconColor() {
				return this.theme.primaryTextColor;
			},
			actionColor() {
				return this.theme.activeColor;
			}
		},
		methods: {
			hexToRgba(hex, opacity) {
				if (!hex) return `rgba(255, 255, 255, ${opacity})`;
				let r = 0, g = 0, b = 0;
				if (hex.length == 4) {
					r = parseInt(hex[1] + hex[1], 16);
					g = parseInt(hex[2] + hex[2], 16);
					b = parseInt(hex[3] + hex[3], 16);
				} else if (hex.length == 7) {
					r = parseInt(hex.substring(1, 3), 16);
					g = parseInt(hex.substring(3, 5), 16);
					b = parseInt(hex.substring(5, 7), 16);
				}
				return `rgba(${r}, ${g}, ${b}, ${opacity})`;
			},
			goBackIndex() {
				uni.navigateTo({
					url: "/pages/index/index"
				});
			},
			toggleHistoryPanel() {
				this.isHistoryPanelVisible = !this.isHistoryPanelVisible;
			},
			handleShowAiInfo() {
				if (this.isAiActionPending) {
					if (this.selectedText.length > 0) {
						this.committedSelectedText = this.selectedText;
						this.sidebarMode = 'userInput';
						this.isSidebarOpen = true;
						this.$emit('ai-action-committed');
					} else {
						uni.showToast({ title: 'Please select some text first', icon: 'none' });
					}
				} else {
					// In default mode, also set committedSelectedText if there's selected text
					if (this.selectedText.length > 0) {
						this.committedSelectedText = this.selectedText;
						this.sidebarMode = 'userInput';
					} else {
						this.committedSelectedText = '';
						this.sidebarMode = 'default';
					}
					this.isSidebarOpen = true;
				}
			},
			closeAiSidebar() {
				this.isSidebarOpen = false;
				this.$emit('cancel-ai-action');
			},
		}
	}
</script>

<style scoped>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		z-index: 140; /* Position it below the panel but above the page content */
	}
	.history-panel-container {
		position: fixed;
		top: calc(var(--status-bar-height) + 45px);
		left: 0; 
		right: 0; 
		z-index: 150;
		background-color: #ffffff;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		border-bottom-left-radius: 10px;
		border-bottom-right-radius: 10px;
		
		/* Initial state: hidden above the screen */
		transform: translateY(-100%);
		opacity: 0;
		transition: transform 0.3s ease, opacity 0.3s ease;
		pointer-events: none; /* Prevent interaction when hidden */
	}

	.history-panel-container.panel-visible {
		/* Visible state: slides into view */
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto; /* Allow interaction when visible */
	}
	
	.top-bar {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		backdrop-filter: blur(10px);
		z-index: 200;
		padding: 0 15px;
		padding-top: var(--status-bar-height);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}
	.top-bar-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 44px;
	}
	.top-bar-actions {
		display: flex;
		gap: 20px;
	}
	.action-btn {
		font-size: 16px;
		cursor: pointer;
	}
</style>