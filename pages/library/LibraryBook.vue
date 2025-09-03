<template>
	<!-- Main container with dynamic styles from the theme service -->
	<view class="reader-container" @click="handleContainerClick" :style="{ backgroundColor: themeStyles.backgroundColor }">

		<!-- BookAICheckBar, now passes the full theme object -->
		<BookAICheckBar
			:show="isTopBarVisible"
			:theme="themeStyles"
			:top-bar-action-text="topBarActionText"
			:total-version-num="totalVersions"
			:bookId="bookId"
			:is-ai-action-pending="isAiActionPending"
			:selected-text="selectedText"
			:allVersions="allVersions"
			:justCompletedAIVersions="justCompletedAIVersions"
			:current-version-id="currentVersionId"
			@cancel-ai-action="cancelAiAction"
			@ai-action-committed="commitAiAction"
			@task-started="refreshBookData"
			@insert-content="handleInsertContent"
			@delete-version="handleDeleteVersion"
			@switch-version="handleSwitchVersion"
			@reset-just-completed-versions="handleResetCompletedVersions"
			@cancel-ai-task="handleCancelAiTask"
			@accelerate-ai-task="handleAccelerateAiTask"
		/>

		<!-- Main Scrollable Content -->
		<scroll-view
			scroll-y
			class="content-scroll"
			ref="scrollView"
			:scroll-top="scrollTop"
			@scroll="handleScroll"
		>
			<view class="book-content">
				<!-- Title and text color are now bound to the theme service -->
				<text class="book-title-header" :style="{ color: themeStyles.primaryTextColor }">{{ bookTitle }}</text>
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
			<book-audio-play
				v-if="barsVisible"
				:read-progress="readProgress"
				:current-time="currentTime"
				:estimated-read-time="estimatedReadTime"
				:is-playing="isPlaying"
				:theme="themeStyles"
				@font-size-change="handleFontSizeChange"
				@background-changed="handleBackgroundChange"
				@toggle-play="togglePlay"
				@next-chapter="nextPage"
				@volume-change="handleVolumeChange"
			></book-audio-play>
		</uni-transition>

	</view>
</template>

<script>
	import BookAudioPlay from '@/components/BookAudioPlay';
	import BookAICheckBar from '@/components/BookAICheckBar';
	// --- ALIGNED: Using the correct service imports ---
	import settingsCacheService from '@/services/settingsCacheService';
	import bookCacheService from '@/services/BookCacheService';

	export default {
		components: { BookAICheckBar, BookAudioPlay },
		data() {
			return {
				// --- ALIGNED: Central state object for the current book ---
				comprehensiveBook: null,
				
				// --- Book Data State (derived from comprehensiveBook) ---
				bookId: null,
				bookTitle: 'Loading...',
				justCompletedAIVersions: [],
				currentVersionId: 1,
				allVersions: [],
				currentBookSentences: [],

				// --- UI State ---
				barsVisible: true,
				scrollTop: 0,
				currentScrollTop: 0,
				scrollViewHeight: 0,

				// --- Reader State ---
				isPlaying: false,
				readProgress: 0,
				estimatedReadTime: 0,
				
				// --- AI Interaction State ---
				selectedText: '',
				isAiActionPending: false,
				dummyProp: 0,
				clearSelectionTrigger: 0,

				// --- ALIGNED: Settings state now uses a detailed theme object ---
				fontSize: 16,
				themeStyles: {}, // Will hold the full ThemeStyles object
				
				taskUpdateInterval: null,
			};
		},
		computed: {
			isTopBarVisible() {
				return this.barsVisible || this.isAiActionPending;
			},
			totalVersions() {
				return this.allVersions ? this.allVersions.length : 0;
			},
			topBarActionText() {
				return this.isAiActionPending ? 'Ask AI' : 'AI Info';
			},
			bookContent() {
				if (!this.currentBookSentences || this.currentBookSentences.length === 0) {
					return 'Loading book content...';
				}
				// Sort sentences by ID and join their content
				const content = this.currentBookSentences
					.sort((a, b) => a.sentenceId - b.sentenceId)
					.map(item => item.content)
					.join(' ');
				return content || 'This version is empty.';
			},
			currentTime() {
				if (this.estimatedReadTime === 0) return '0:00';
				const totalSeconds = this.estimatedReadTime * 60;
				const currentSeconds = Math.floor(totalSeconds * (this.readProgress / 100));
				const minutes = Math.floor(currentSeconds / 60);
				const seconds = currentSeconds % 60;
				return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
			},
			// --- ALIGNED: Style computed properties now use the themeStyles object ---
			bookTextStyle() {
				return {
					fontSize: `${this.fontSize}px`,
					color: this.themeStyles.primaryTextColor,
				};
			},
		},
		onLoad(options) {
			this.bookId = parseInt(options.id, 10);
			this.loadAndApplySettings();
			this.loadBookContent();
		},
		onShow() {
			this.loadAndApplySettings();
			// Re-load book content in case of external changes (e.g., AI task completion)
			this.loadBookContent();
		},
		onReady() {
			uni.createSelectorQuery().in(this).select('.content-scroll').boundingClientRect(data => {
				if (data) { this.scrollViewHeight = data.height; }
			}).exec();
		},
		onUnload() {
			this.saveReadingProgress();
			if (this.taskUpdateInterval) {
				clearInterval(this.taskUpdateInterval);
			}
		},
		methods: {
			// --- Event Handlers ---
			handleContainerClick() {
				if (this.isAiActionPending) {
					this.cancelAiAction();
					return;
				}
				this.barsVisible = !this.barsVisible;
			},
			handleResetCompletedVersions() {
				this.justCompletedAIVersions = [];
			},
			
			// --- AI Text Selection ---
			activateAiAction() { this.isAiActionPending = true; },
			updateSelectedText(text) { this.selectedText = text; },
			cancelAiAction() {
				if (this.isAiActionPending) {
					this.isAiActionPending = false;
					this.selectedText = '';
					this.clearSelectionTrigger++;
				}
			},
			commitAiAction() {
				this.isAiActionPending = false;
				this.selectedText = '';
				this.clearSelectionTrigger++;
			},

			// --- Event Handlers from Child Components ---
			refreshBookData() { this.loadBookContent(); },
			handleInsertContent(payload) { /* Future Logic */ },
			// --- ALIGNED: AI Task management now uses bookCacheService ---
			handleCancelAiTask(taskKey) {
				bookCacheService.cancelAITask(this.bookId, taskKey);
				uni.showToast({ title: `Cancelling ${taskKey.replace('_', ' ')}`, icon: 'none' });
				this.refreshBookData();
			},
			handleAccelerateAiTask(taskKey) {
				bookCacheService.accelerateAITask(this.bookId, taskKey);
				uni.showToast({ title: 'Accelerate request sent!', icon: 'none' });
			},
			
			// --- ALIGNED: Data Management using BookCacheService ---
			loadBookContent() {
				if (!this.bookId) return;

				const oldVersionIds = this.allVersions.map(v => v.version);
				
				// Fetch the entire comprehensive book object
				const book = bookCacheService.getBookByBookId(this.bookId);
				if (!book) {
					this.bookTitle = "Error: Book not found.";
					return;
				}
				this.comprehensiveBook = book;
				
				// Populate component state from the comprehensive object
				this.allVersions = book.versions.allVersions;
				this.currentVersionId = book.versions.currentVersionId;

				// Detect newly completed AI task versions
				const newVersionIds = this.allVersions.map(v => v.version);
				const completedVersionIds = newVersionIds.filter(id => !oldVersionIds.includes(id));
				if (completedVersionIds.length > 0 && oldVersionIds.length > 0) {
					this.justCompletedAIVersions = completedVersionIds;
				}

				this.updateCurrentView();
				this.loadReadingProgress();

				// Check for running AI tasks and set up an interval to refresh data
				const hasActiveTasks = book.versions.runningAiTasks && book.versions.runningAiTasks.length > 0;
				if (hasActiveTasks && !this.taskUpdateInterval) {
					this.taskUpdateInterval = setInterval(() => this.loadBookContent(), 2000);
				} else if (!hasActiveTasks && this.taskUpdateInterval) {
					clearInterval(this.taskUpdateInterval);
					this.taskUpdateInterval = null;
				}
			},
			updateCurrentView() {
				if (!this.comprehensiveBook) return;
				
				// Filter sentences for the current version
				this.currentBookSentences = this.comprehensiveBook.content.sentences.filter(item => item.version === this.currentVersionId);
				
				const currentVersionInfo = this.allVersions.find(v => v.version === this.currentVersionId);
				// Use custom title if available, otherwise fall back to version task name or metadata title
				this.bookTitle = this.comprehensiveBook.readerMetadata.customTitle || (currentVersionInfo ? currentVersionInfo.taskName : this.comprehensiveBook.metadata.title);
				
				this.calculateReadTime();
			},
			saveCurrentBookState() {
				if (this.comprehensiveBook) {
					bookCacheService.saveBook(this.comprehensiveBook);
				}
			},

			// --- Version Management ---
			handleDeleteVersion(versionIdToDelete) {
				if (versionIdToDelete === this.currentVersionId) {
					uni.showToast({ title: 'Cannot delete the active version.', icon: 'none' });
					return;
				}
				// ALIGNED: Modify the central comprehensiveBook object
				this.comprehensiveBook.versions.allVersions = this.comprehensiveBook.versions.allVersions.filter(v => v.version !== versionIdToDelete);
				this.comprehensiveBook.content.sentences = this.comprehensiveBook.content.sentences.filter(s => s.version !== versionIdToDelete);
				
				this.allVersions = this.comprehensiveBook.versions.allVersions; // Update local computed property
				
				this.saveCurrentBookState();
				uni.showToast({ title: 'Version deleted', icon: 'success' });
			},
			handleSwitchVersion(versionId) {
				if (this.currentVersionId === versionId) return;

				// ALIGNED: Update the central comprehensiveBook object
				this.currentVersionId = versionId;
				this.comprehensiveBook.versions.currentVersionId = versionId;

				this.updateCurrentView();
				this.saveCurrentBookState();
				this.loadReadingProgress(); // Load position for the new version
				uni.showToast({ title: `Switched to: ${this.bookTitle}`, icon: 'none' });
			},

			// --- ALIGNED: Settings & UI using SettingsCacheService ---
			loadAndApplySettings() {
				const settings = settingsCacheService.getSettings();
				this.fontSize = settings.fontSize || 16;
				// Get the detailed theme object from the service
				this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
			},
			handleBackgroundChange(newThemeName) {
				this.themeStyles = settingsCacheService.getThemeContent(newThemeName);
				// Optionally save the new theme preference
				settingsCacheService.saveTheme(newThemeName);
			},
			handleFontSizeChange(newSize) {
				this.fontSize = newSize;
				settingsCacheService.saveFontSize(newSize);
			},
			
			// --- Reading Progress ---
			handleScroll(event) {
				this.currentScrollTop = event.detail.scrollTop;
				const { scrollHeight } = event.detail;
				const scrollableDistance = scrollHeight - this.scrollViewHeight;
				if (scrollableDistance <= 0) { this.readProgress = 0; return; }
				this.readProgress = Math.min(100, Math.max(0, (this.currentScrollTop / scrollableDistance) * 100));
			},
			saveReadingProgress() { 
				// ALIGNED: Save progress back to the readerMetadata object
				if (this.comprehensiveBook) {
					// A real implementation would convert scrollTop to the nearest sentenceId.
					// For now, we'll store it in a custom property or reuse an existing one if suitable.
					// Let's use readTime to store scroll position for simplicity in this example.
					this.comprehensiveBook.readerMetadata.readTime = this.currentScrollTop;
					this.saveCurrentBookState();
				}
			},
			loadReadingProgress() {
				if (this.comprehensiveBook) {
					// Using readTime as a placeholder for the last scroll position
					const pos = this.comprehensiveBook.readerMetadata.readTime || 0;
					// Use nextTick to ensure the DOM is ready before setting scrollTop
					this.$nextTick(() => { this.scrollTop = pos; this.currentScrollTop = pos; });
				}
			},

			// --- Misc ---
			calculateReadTime() {
				const words = this.bookContent.split(/\s+/).filter(Boolean);
				this.estimatedReadTime = Math.ceil(words.length / 225); // Average reading speed
			},
			togglePlay() { this.isPlaying = !this.isPlaying; },
			nextPage() { this.scrollTop = this.currentScrollTop + this.scrollViewHeight; },
			handleVolumeChange(newVolume) { settingsCacheService.saveVolume(newVolume); }
		}
	}
</script>

<script module="selection" lang="renderjs">
	// This script block is unchanged as it handles low-level DOM interactions.
	export default {
		data: () => ({ isListenerAttached: false, longPressTimer: null, isLongPressActive: false }),
		methods: {
			setupListener(newValue, oldValue, ownerInstance) {
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
			onClearTrigger(newValue, oldValue) { if (newValue > oldValue) this.clearSelection(); },
			handleTouchStart() {
				this.cleanupTimer();
				this.isLongPressActive = false;
				this.longPressTimer = setTimeout(() => {
					this.isLongPressActive = true;
					this.ownerInstance.callMethod('activateAiAction');
					this.ownerInstance.callMethod('updateSelectedText', window.getSelection().toString().trim());
				}, 800);
			},
			handleSelectionChange() {
				if (!this.isLongPressActive) return;
				this.ownerInstance.callMethod('updateSelectedText', window.getSelection().toString().trim());
			},
			handleInteractionEnd() {
				this.cleanupTimer();
				setTimeout(() => {
					if (this.isLongPressActive && window.getSelection().toString().length === 0) {
						this.ownerInstance.callMethod('cancelAiAction');
					}
					this.isLongPressActive = false;
				}, 50);
			},
			cleanupTimer() {
				if (this.longPressTimer) {
					clearTimeout(this.longPressTimer);
					this.longPressTimer = null;
				}
			},
			clearSelection() { if (window.getSelection) window.getSelection().removeAllRanges(); }
		}
	}
</script>

<style scoped>
	/* Styles are unchanged */
	.reader-container { height: 100vh; transition: background-color 0.3s ease; }
	.content-scroll { height: 100vh; }
	.book-content { padding: 20px; padding-top: calc(var(--status-bar-height) + 64px); padding-bottom: calc(var(--safe-area-inset-bottom) + 120px); }
	.book-title-header { display: block; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
	.book-text { line-height: 1.8; white-space: pre-wrap; }
</style>