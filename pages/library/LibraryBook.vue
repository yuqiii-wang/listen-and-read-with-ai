<template>
	<view class="reader-container">
		<!-- Top Bar -->
		<transition name="fade">
			<view v-if="barsVisible" class="top-bar" @click.stop>
				<view class="top-bar-content">
					<uni-icons type="back" size="24" color="#333" @click.stop="goBack"></uni-icons>
					<view class="actions">
						<uni-icons type="info" size="24" color="#333"></uni-icons>
						<text class="action-btn" @click.stop="openAiSidebar">AI Info</text>
					</view>
				</view>
			</view>
		</transition>

		<!-- Book Content Area -->
		<scroll-view scroll-y class="content-scroll" @scroll="handleScroll" ref="scrollView" @click="toggleBars">
			<view class="book-content">
				<text class="book-title-header">{{ bookTitle }}</text>
				<text class="book-text" selectable="true" @touchend="checkForSelection">{{ bookContent }}</text>
			</view>
		</scroll-view>

		<!-- Bottom Audio Play Bar -->
		<transition name="fade">
			<!-- CORRECTION: Changed 'vif' to 'v-if' -->
			<book-audio-play
				v-if="barsVisible"
				:read-progress="readProgress"
				:current-time="currentTime"
				:estimated-read-time="estimatedReadTime"
				:is-playing="isPlaying"
				@select-voice="selectVoice"
				@adjust-volume="adjustVolume"
				@volume-change="handleVolumeChange"
				@toggle-play="togglePlay"
				@next-chapter="nextChapter"
			></book-audio-play>
		</transition>

		<!-- AI Info Sidebar -->
		<sidebar-info 
			v-if="isSidebarOpen" 
			:mode="sidebarMode"
			:user-input-text="selectedText"
			@close="closeAiSidebar"
			@insert-content="handleInsertContent"
		></sidebar-info>
	</view>
</template>

<script>
	import BookAudioPlay from '@/components/BookAudioPlay';
	import SidebarInfo from '@/components/SidebarInfo';

	export default {
		components: {
			BookAudioPlay,
			SidebarInfo
		},
		data() {
			return {
				bookId: null,
				bookTitle: 'Loading...',
				bookContent: 'This is the beginning of the great book... '.repeat(100),
				barsVisible: true,
				isPlaying: false,
				sidebarMode: 'default',
				selectedText: '',
				readProgress: 0,
				estimatedReadTime: 0,
				totalWords: 0,
				scrollViewHeight: 0,
				volume: 80, 
				isSidebarOpen: false,
			};
		},
		computed: {
			currentTime() {
				if (this.estimatedReadTime === 0) return '0:00';
				const totalSeconds = this.estimatedReadTime * 60;
				const currentSeconds = Math.floor(totalSeconds * (this.readProgress / 100));
				const minutes = Math.floor(currentSeconds / 60);
				const seconds = currentSeconds % 60;
				return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
			}
		},
		onLoad(options) {
			this.bookId = options.id;
			this.bookTitle = decodeURIComponent(options.title);
			this.calculateReadTime();
			setTimeout(() => { this.barsVisible = false; }, 3000);
		},
		onReady() {
			uni.createSelectorQuery().in(this).select('.content-scroll').boundingClientRect(data => {
				if (data) { this.scrollViewHeight = data.height; }
			}).exec();
		},
		methods: {
			// This method is called when the "AI Info" button is clicked
			openAiSidebar() {
				this.sidebarMode = 'default';
				this.isSidebarOpen = true;
			},
			
			// This method toggles the visibility of both top and bottom bars
			toggleBars() { 
				this.barsVisible = !this.barsVisible; 
			},
			
			goBack() { uni.navigateBack(); },
			
			calculateReadTime() {
				const words = this.bookContent.split(/\s+/).filter(word => word.length > 0);
				this.totalWords = words.length;
				this.estimatedReadTime = Math.ceil(this.totalWords / 225);
			},
			
			handleScroll(event) {
				const { scrollTop, scrollHeight } = event.detail;
				const scrollableDistance = scrollHeight - this.scrollViewHeight;
				if (scrollableDistance <= 0) { this.readProgress = 0; return; }
				const progress = (scrollTop / scrollableDistance) * 100;
				this.readProgress = Math.min(100, Math.max(0, progress));
			},
			
			selectVoice() { uni.showToast({ title: 'Select Voice', icon: 'none' }); },
			nextChapter() { uni.showToast({ title: 'Next Chapter', icon: 'none' }); },
			togglePlay() { this.isPlaying = !this.isPlaying; },
			editContent() { uni.showToast({ title: 'Edit clicked', icon: 'none' }); },
			
			closeAiSidebar() { 
				this.isSidebarOpen = false; 
				this.selectedText = '';
			},
			
			adjustVolume() { console.log('Adjust volume action triggered.'); },
			handleVolumeChange(newVolume) { this.volume = newVolume; },
			
			checkForSelection() {
				// #ifdef H5
				setTimeout(() => {
					const selection = window.getSelection();
					const selectedText = selection.toString().trim();

					if (selectedText.length > 0) {
						this.selectedText = selectedText;
						this.showSelectionActionSheet();
					}
				}, 50);
				// #endif
			},
			
			showSelectionActionSheet() {
				uni.showActionSheet({
					itemList: ['Copy', 'Ask AI'],
					success: (res) => {
						if (res.tapIndex === 0) { // Copy
							uni.setClipboardData({
								data: this.selectedText,
								success: () => uni.showToast({ title: 'Copied!', icon: 'none' })
							});
						} else if (res.tapIndex === 1) { // Ask AI
							this.sidebarMode = 'userInput';
							this.isSidebarOpen = true;
						}
					},
					fail: () => {
						this.selectedText = '';
					}
				});
			},
			
			handleInsertContent(payload) {
				switch (payload.action) {
					case 'summary':
						this.bookContent = `[AI Summary for ${payload.scope}]\n${payload.content}\n\n---\n\n${this.bookContent}`;
						uni.showToast({ title: 'Summary added!', icon: 'none' });
						break;
						
					case 'rewrite':
						this.bookContent = payload.content;
						uni.showToast({ title: 'Content rewritten!', icon: 'none' });
						break;
						
					default:
						console.warn('Unknown action type:', payload.action);
						break;
				}
				this.closeAiSidebar();
				this.calculateReadTime();
			}
		}
	}
</script>

<style scoped>
	.reader-container {
		height: 100vh;
		background-color: #f5f5f5;
	}
	.top-bar {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		background-color: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		z-index: 100;
		padding: 0 15px;
		padding-top: var(--status-bar-height);
		border-bottom: 1px solid #e5e5e5;
	}
	.top-bar-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 44px;
	}
	.actions .action-btn {
		margin-left: 20px;
		font-size: 16px;
		color: #007AFF;
		cursor: pointer;
	}
	.content-scroll {
		height: 100vh;
	}
	.book-content {
		padding: 20px;
		padding-top: calc(var(--status-bar-height) + 44px + 20px);
		padding-bottom: calc(var(--safe-area-inset-bottom) + 120px + 20px);
	}
	.book-title-header {
		display: block;
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 20px;
		color: #333;
	}
	.book-text {
		font-size: 16px;
		line-height: 1.8;
		color: #333;
		white-space: pre-wrap;
	}
	.fade-enter-active, .fade-leave-active {
		transition: opacity 0.3s ease;
	}
	.fade-enter, .fade-leave-to {
		opacity: 0;
	}
</style>