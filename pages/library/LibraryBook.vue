<template>
	<!-- Template remains largely the same, but note the changes to <book-audio-play> -->
	<view class="reader-container" @click="handleContainerClick" :style="readerStyles">
		<!-- Top Bar -->
		<uni-transition mode-class="fade" :show="barsVisible || isAiActionPending">
			<view v-if="barsVisible || isAiActionPending" class="top-bar" @click.stop :style="{ backgroundColor: topBarBackgroundColor }">
				<view class="top-bar-content">
					<uni-icons type="back" size="24" :color="theme.textColor" @click.stop="goBack"></uni-icons>
					<text class="action-btn" :style="{ color: theme.actionColor }" @click.stop="handleTopBarAction">{{ topBarActionText }}</text>
				</view>
			</view>
		</uni-transition>

		<scroll-view
			scroll-y
			class="content-scroll"
			ref="scrollView"
			:scroll-top="scrollTop"
			@scroll="handleScroll"
			@touchstart="handleTouchStart"
			@touchend="handleTouchEnd"
		>
			<view class="book-content">
				<text class="book-title-header" :style="{ color: theme.textColor }">{{ bookTitle }}</text>
				<text
					class="book-text"
					selectable="true"
					:prop="dummyProp"
					:change:prop="selection.setupListener"
					:data-clear-trigger="clearSelectionTrigger"
					:change:data-clear-trigger="selection.onClearTrigger"
					:style="bookTextStyle"
				>{{ bookContent }}</text>
			</view>
		</scroll-view>

		<!-- Bottom Audio Play Bar -->
		<uni-transition mode-class="fade" :show="barsVisible">
			<!-- *** MODIFIED: Pass theme prop and listen for change events *** -->
			<book-audio-play
				v-if="barsVisible"
				:read-progress="readProgress"
				:current-time="currentTime"
				:estimated-read-time="estimatedReadTime"
				:is-playing="isPlaying"
				:theme="theme"
				@font-size-change="handleFontSizeChange"
				@background-changed="handleBackgroundChange"
				@toggle-play="togglePlay"
				@next-chapter="nextPage"
				@volume-change="handleVolumeChange"
			></book-audio-play>
		</uni-transition>

		<!-- AI Info Sidebar -->
		<sidebar-info
			v-if="isSidebarOpen"
			:mode="sidebarMode"
			:user-input-text="committedSelectedText"
			@close="closeAiSidebar"
			@insert-content="handleInsertContent"
		></sidebar-info>
	</view>
</template>

<script>
	import BookAudioPlay from '@/components/BookAudioPlay';
	import SidebarInfo from '@/components/SidebarInfo';
	import settingsService from '@/services/settingsService';

	export default {
		// ... components, data, computed properties are unchanged ...
		components: { BookAudioPlay, SidebarInfo },
		data() {
			return {
				// --- Existing state ---
				bookId: null,
				bookTitle: 'Loading...',
				bookContent: 'This is the beginning of the great book... '.repeat(300),
				barsVisible: true,
				isPlaying: false,
				sidebarMode: 'default',
				selectedText: '',
				committedSelectedText: '',
				isSidebarOpen: false,
				isAiActionPending: false,
				dummyProp: 0,
				clearSelectionTrigger: 0,
				readProgress: 0,
				estimatedReadTime: 0,
				totalWords: 0,
				scrollViewHeight: 0,
				volume: 80,
				scrollTop: 0,
				currentScrollTop: 0,
				touchStartY: 0,
				readingTimer: null,
				totalReadingTimeSeconds: 0,

				// --- Settings state ---
				fontSize: 16,
				theme: {
					name: 'White',
					color: '#FFFFFF',
					textColor: '#333333',
					actionColor: '#007AFF'
				},
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
			},
			topBarActionText() {
				return this.isAiActionPending ? 'Ask AI' : 'AI Info';
			},
			readerStyles() {
				return { backgroundColor: this.theme.color };
			},
			bookTextStyle() {
				return {
					fontSize: `${this.fontSize}px`,
					color: this.theme.textColor,
				};
			},
			topBarBackgroundColor() {
				if (this.theme.name === 'Black') {
					return 'rgba(40, 40, 40, 0.95)';
				}
				return 'rgba(255, 255, 255, 0.9)';
			}
		},
		onLoad(options) {
			this.bookId = options.id;
			this.bookTitle = decodeURIComponent(options.title);
			this.loadAndApplySettings();
			this.loadReadingPosition();
			this.calculateReadTime();
			this.startReadingTimer();
			setTimeout(() => { this.barsVisible = false; }, 3000);
		},
		onShow() {
			this.loadAndApplySettings();
		},
		onReady() {
			uni.createSelectorQuery().in(this).select('.content-scroll').boundingClientRect(data => {
				if (data) { this.scrollViewHeight = data.height; }
			}).exec();
		},
		onUnload() {
			this.saveReadingPosition();
			this.stopAndSaveReadingTime();
		},
		methods: {
			// *** NEW: Centralized method to apply a theme object ***
			applyTheme(themeSetting) {
				let textColor = '#333333';
				let actionColor = '#007AFF';

				if (themeSetting.name === 'Black') {
					textColor = '#e0e0e0'; // Light grey for dark background
					actionColor = '#4daaff'; // A lighter blue for better visibility
				} else if (themeSetting.name === 'Light Brown') {
					textColor = '#5c4033'; // Dark brown text for a sepia look
				}
				
				// Set the component's reactive theme property, which triggers updates
				this.theme = { ...themeSetting, textColor, actionColor };
			},
			
			// *** MODIFIED: Uses the new applyTheme helper ***
			loadAndApplySettings() {
				const settings = settingsService.getSettings();
				this.fontSize = settings.fontSize || 16;
				const themeSetting = settings.background || { name: 'White', color: '#FFFFFF' };
				this.applyTheme(themeSetting); // Use the helper
			},

			// *** NEW: Event handler for font size changes from child ***
			handleFontSizeChange(newSize) {
				this.fontSize = newSize;
			},
			
			// *** NEW: Event handler for theme changes from child ***
			handleBackgroundChange(newTheme) {
				this.applyTheme(newTheme); // Use the helper to update the entire view
			},

			handleContainerClick() {
				if (this.isSidebarOpen) return;
				if (this.isAiActionPending) {
					this.cancelAiAction();
					this.clearSelectionTrigger++;
				} else {
					this.barsVisible = !this.barsVisible;
				}
			},
			
			// ... other methods remain unchanged ...
			startReadingTimer() {
				this.totalReadingTimeSeconds = settingsService.getReadingTime();
				if (this.readingTimer) clearInterval(this.readingTimer);
				this.readingTimer = setInterval(() => { this.totalReadingTimeSeconds++; }, 1000);
			},
			stopAndSaveReadingTime() {
				clearInterval(this.readingTimer);
				settingsService.updateReadingTime(this.totalReadingTimeSeconds);
			},
			handleTouchStart(e) { this.touchStartY = e.touches[0].clientY; },
			handleTouchEnd(e) {
				const touchEndY = e.changedTouches[0].clientY;
				const deltaY = touchEndY - this.touchStartY;
				const swipeThreshold = 50;
				if (Math.abs(deltaY) > swipeThreshold && !this.barsVisible) {
					if (deltaY < 0) this.scrollTop = this.currentScrollTop + this.scrollViewHeight;
					else this.scrollTop = this.currentScrollTop - this.scrollViewHeight;
				}
			},
			handleScroll(event) {
				this.currentScrollTop = event.detail.scrollTop;
				const { scrollHeight } = event.detail;
				const scrollableDistance = scrollHeight - this.scrollViewHeight;
				if (scrollableDistance <= 0) { this.readProgress = 0; return; }
				const progress = (this.currentScrollTop / scrollableDistance) * 100;
				this.readProgress = Math.min(100, Math.max(0, progress));
			},
			saveReadingPosition() {
				if (this.bookId) uni.setStorageSync(`reading_pos_${this.bookId}`, this.currentScrollTop);
			},
			loadReadingPosition() {
				if (this.bookId) {
					const pos = uni.getStorageSync(`reading_pos_${this.bookId}`);
					if (pos) { this.scrollTop = pos; this.currentScrollTop = pos; }
				}
			},
			activateAiAction() {
				this.isAiActionPending = true;
				this.committedSelectedText = '';
			},
			updateSelectedText(text) { this.selectedText = text; },
			cancelAiAction() {
				if (this.isAiActionPending) {
					this.isAiActionPending = false;
					this.selectedText = '';
				}
			},
			handleTopBarAction() {
				if (this.isAiActionPending) {
					if (this.selectedText.length > 0) {
						this.committedSelectedText = this.selectedText;
						this.sidebarMode = 'userInput';
						this.isSidebarOpen = true;
						this.clearSelectionTrigger++;
						this.isAiActionPending = false;
					} else {
						uni.showToast({ title: 'Please select some text first', icon: 'none' });
					}
				} else {
					this.sidebarMode = 'default';
					this.isSidebarOpen = true;
				}
			},
			goBack() { uni.navigateBack(); },
			calculateReadTime() {
				const words = this.bookContent.split(/\s+/).filter(Boolean);
				this.totalWords = words.length;
				this.estimatedReadTime = Math.ceil(this.totalWords / 225);
			},
			closeAiSidebar() {
				this.isSidebarOpen = false;
				this.cancelAiAction();
			},
			handleInsertContent(payload) {
                switch (payload.action) {
					case 'summary': this.bookContent = `[AI Summary for ${payload.scope}]\n${payload.content}\n\n---\n\n${this.bookContent}`; break;
					case 'rewrite': this.bookContent = payload.content; break;
					default: console.warn('Unknown action type:', payload.action); break;
				}
				this.calculateReadTime();
				this.closeAiSidebar();
			},
			togglePlay() { this.isPlaying = !this.isPlaying; },
			selectVoice() { uni.showToast({ title: 'Select Voice', icon: 'none' }); },
			adjustVolume() {},
			handleVolumeChange(newVolume) { this.volume = newVolume; },
			nextPage() { this.scrollTop = this.currentScrollTop + this.scrollViewHeight; },
		}
	}
</script>

<!-- The renderjs script and styles for library-book.vue remain unchanged -->
<script module="selection" lang="renderjs">
	export default {
		data() { return { isListenerAttached: false, longPressTimer: null, isLongPressActive: false } },
		methods: {
			setupListener(newValue, oldValue, ownerInstance, instance) {
				if (this.isListenerAttached) return;
				this.ownerInstance = ownerInstance;
				const element = ownerInstance.$el.querySelector('.book-text');
				if (element) {
					element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
					document.addEventListener('selectionchange', this.handleSelectionChange);
					document.addEventListener('touchend', this.handleInteractionEnd);
					this.isListenerAttached = true;
				}
			},
			onClearTrigger(newValue, oldValue, ownerInstance, instance) { if (newValue > oldValue) this.clearSelection(); },
			handleTouchStart() {
				this.cleanupTimer(); this.isLongPressActive = false;
				this.longPressTimer = setTimeout(() => {
					this.isLongPressActive = true; this.ownerInstance.callMethod('activateAiAction');
					const selectedText = window.getSelection().toString();
					this.ownerInstance.callMethod('updateSelectedText', selectedText.trim());
				}, 800);
			},
			handleSelectionChange() {
				if (!this.isLongPressActive) return;
				const selectedText = window.getSelection().toString();
				this.ownerInstance.callMethod('updateSelectedText', selectedText.trim());
			},
			handleInteractionEnd() {
				this.cleanupTimer();
				setTimeout(() => {
					if (this.isLongPressActive) { if (window.getSelection().toString().length === 0) { this.ownerInstance.callMethod('cancelAiAction'); } }
					this.isLongPressActive = false;
				}, 50);
			},
			cleanupTimer() { if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; } },
			clearSelection() { if (window.getSelection) window.getSelection().removeAllRanges(); }
		}
	}
</script>

<style scoped>
	.reader-container { height: 100vh; transition: background-color 0.3s ease; }
	.top-bar { position: fixed; left: 0; right: 0; top: 0; backdrop-filter: blur(10px); z-index: 100; padding: 0 15px; padding-top: var(--status-bar-height); border-bottom: 1px solid rgba(0, 0, 0, 0.08); }
	.top-bar-content { display: flex; justify-content: space-between; align-items: center; height: 44px; }
	.action-btn { margin-left: 20px; font-size: 16px; cursor: pointer; }
	.content-scroll { height: 100vh; }
	.book-content { padding: 20px; padding-top: calc(var(--status-bar-height) + 44px + 20px); padding-bottom: calc(var(--safe-area-inset-bottom) + 120px + 20px); }
	.book-title-header { display: block; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
	.book-text { line-height: 1.8; white-space: pre-wrap; }
	.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
	.fade-enter, .fade-leave-to { opacity: 0; }
</style>