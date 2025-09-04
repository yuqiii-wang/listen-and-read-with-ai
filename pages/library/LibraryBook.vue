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
				:is-playing="isPlaying"
				:theme="themeStyles"
				@font-size-change="handleFontSizeChange"
				@background-changed="handleBackgroundChange"
				@toggle-play="togglePlay"
				@next-chapter="nextPage"
				@volume-change="handleVolumeChange"
				@progress-changed="handleProgressChanged"
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
	import userProfileCacheService from '@/services/userProfileCacheService';

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
				
				// --- Reading Progress Tracking ---
				pageEnterTime: 0, // When the user entered this page
				currentSentenceId: 0, // Current sentence being read
				userScrollingActive: false, // Flag to prevent auto-scroll during user interaction
				scrollingTimeout: null, // Timeout to detect when user stops scrolling
				
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
			this.pageEnterTime = Date.now(); // Record when user enters the page
		},
		onShow() {
			this.loadAndApplySettings();
			// Re-load book content in case of external changes (e.g., AI task completion)
			this.loadBookContent();
			this.pageEnterTime = Date.now(); // Record when user returns to the page
		},
		onHide() {
			// Save reading progress when user leaves the page (e.g., switches to another app)
			this.saveReadingProgressAndTime();
		},
		onReady() {
			uni.createSelectorQuery().in(this).select('.content-scroll').boundingClientRect(data => {
				if (data) { this.scrollViewHeight = data.height; }
			}).exec();
		},
		onUnload() {
			this.saveReadingProgressAndTime();
			if (this.taskUpdateInterval) {
				clearInterval(this.taskUpdateInterval);
			}
			if (this.scrollingTimeout) {
				clearTimeout(this.scrollingTimeout);
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
				// Use imported service and consumption callback
				const consumeAIBudget = (details) => userProfileCacheService.logConsumption(details);
				
				bookCacheService.cancelAITask(this.bookId, taskKey, consumeAIBudget);
				uni.showToast({ title: `Cancelling ${taskKey.replace('_', ' ')}`, icon: 'none' });
				this.refreshBookData();
			},
			handleAccelerateAiTask(taskKey) {
				// Use imported service and consumption callback
				const consumeAIBudget = (details) => userProfileCacheService.logConsumption(details);
				
				bookCacheService.accelerateAITask(this.bookId, taskKey, consumeAIBudget);
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
				
				// Only load reading progress on initial load, not on task updates
				if (oldVersionIds.length === 0) {
					// Initial load - reading progress already loaded by updateCurrentView()
					console.log('[LibraryBook] Initial load completed with reading progress restored');
				}

				// Check for running AI tasks and set up an interval to refresh data
				const hasActiveTasks = book.versions.runningAiTasks && book.versions.runningAiTasks.length > 0;
				if (hasActiveTasks && !this.taskUpdateInterval) {
					this.taskUpdateInterval = setInterval(() => this.refreshTaskDataOnly(), 2000);
				} else if (!hasActiveTasks && this.taskUpdateInterval) {
					clearInterval(this.taskUpdateInterval);
					this.taskUpdateInterval = null;
				}
			},
			
			/**
			 * Refreshes only task-related data without affecting reading position
			 */
			refreshTaskDataOnly() {
				if (!this.bookId) return;

				const oldVersionIds = this.allVersions.map(v => v.version);
				
				// Fetch the book object for task updates only
				const book = bookCacheService.getBookByBookId(this.bookId);
				if (!book) return;
				
				// Update task-related data
				this.comprehensiveBook.versions.runningAiTasks = book.versions.runningAiTasks;
				this.comprehensiveBook.versions.allVersions = book.versions.allVersions;
				this.allVersions = book.versions.allVersions;

				// Detect newly completed AI task versions
				const newVersionIds = this.allVersions.map(v => v.version);
				const completedVersionIds = newVersionIds.filter(id => !oldVersionIds.includes(id));
				if (completedVersionIds.length > 0 && oldVersionIds.length > 0) {
					this.justCompletedAIVersions = completedVersionIds;
					// Only update content if new versions were completed
					this.updateCurrentViewForNewVersions();
				}

				// Check if we should stop the interval (no more active tasks)
				const hasActiveTasks = book.versions.runningAiTasks && book.versions.runningAiTasks.length > 0;
				if (!hasActiveTasks && this.taskUpdateInterval) {
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
				
				// Load the reading progress for the current version immediately
				this.loadReadingProgress();
			},
			
			/**
			 * Updates current view when new AI versions are completed, without disrupting reading position
			 */
			updateCurrentViewForNewVersions() {
				if (!this.comprehensiveBook) return;
				
				// Update content data from the comprehensive book object
				this.comprehensiveBook.content = bookCacheService.getBookContentById(this.bookId).bookData;
				
				// Filter sentences for the current version (in case new content was added)
				this.currentBookSentences = this.comprehensiveBook.content.sentences.filter(item => item.version === this.currentVersionId);
				
				const currentVersionInfo = this.allVersions.find(v => v.version === this.currentVersionId);
				// Use custom title if available, otherwise fall back to version task name or metadata title
				this.bookTitle = this.comprehensiveBook.readerMetadata.customTitle || (currentVersionInfo ? currentVersionInfo.taskName : this.comprehensiveBook.metadata.title);
				
				// DON'T call loadReadingProgress() here to avoid disrupting current reading position
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

				// Save current reading progress before switching
				this.saveReadingProgressAndTime();

				// ALIGNED: Update the central comprehensiveBook object
				this.currentVersionId = versionId;
				this.comprehensiveBook.versions.currentVersionId = versionId;

				this.updateCurrentView(); // This already calls loadReadingProgress()
				this.saveCurrentBookState();
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
				// Mark that user is actively scrolling
				this.userScrollingActive = true;
				
				// Clear existing timeout and set new one to detect when scrolling stops
				if (this.scrollingTimeout) {
					clearTimeout(this.scrollingTimeout);
				}
				this.scrollingTimeout = setTimeout(() => {
					this.userScrollingActive = false;
					// Save scroll position when user stops scrolling to reduce frequency of saves
					this.saveCurrentScrollPosition();
				}, 1000); // Consider scrolling stopped after 1 second of inactivity
				
				this.currentScrollTop = event.detail.scrollTop;
				const { scrollHeight } = event.detail;
				const scrollableDistance = scrollHeight - this.scrollViewHeight;
				if (scrollableDistance <= 0) { 
					this.readProgress = 0; 
					return; 
				}
				
				// Calculate reading progress percentage
				this.readProgress = Math.min(100, Math.max(0, (this.currentScrollTop / scrollableDistance) * 100));
				
				// Update current sentence based on scroll progress and save reading position
				this.updateCurrentSentenceFromScroll();
				this.saveCurrentReadingPosition();
				
				console.log(`[LibraryBook] Scroll: ${this.readProgress.toFixed(1)}%, scrollTop: ${this.currentScrollTop}, scrollHeight: ${scrollHeight}`);
			},
			
			updateCurrentSentenceFromScroll() {
				if (!this.currentBookSentences || this.currentBookSentences.length === 0) return;
				
				// Calculate which sentence is currently being viewed based on scroll progress
				const totalSentences = this.currentBookSentences.length;
				const currentIndex = Math.floor((this.readProgress / 100) * totalSentences);
				const clampedIndex = Math.max(0, Math.min(currentIndex, totalSentences - 1));
				
				if (this.currentBookSentences[clampedIndex]) {
					this.currentSentenceId = this.currentBookSentences[clampedIndex].sentenceId;
				}
			},
			
			/**
			 * Saves the current scroll position immediately (for real-time updates)
			 */
			saveCurrentScrollPosition() {
				if (!this.comprehensiveBook || this.readProgress < 0) return;
				
				// Save current scroll percentage for this version
				bookCacheService.setLastReadScrollPercentage(this.bookId, this.currentVersionId, this.readProgress);
				console.log(`[LibraryBook] Saved scroll position: ${this.readProgress.toFixed(1)}%`);
			},
			
			/**
			 * Saves the current reading position immediately (for real-time updates)
			 */
			saveCurrentReadingPosition() {
				if (!this.comprehensiveBook || this.currentSentenceId <= 0) return;
				
				// Save current reading position for this version using the enhanced method
				bookCacheService.setLastReadPosition(this.bookId, this.currentVersionId, this.currentSentenceId);
			},
			
			saveReadingProgressAndTime() { 
				if (!this.comprehensiveBook) return;
				
				// Calculate and save reading time spent on this page
				const timeSpent = Math.floor((Date.now() - this.pageEnterTime) / 1000); // Convert to seconds
				if (timeSpent > 0) {
					bookCacheService.updateReadingTime(this.bookId, timeSpent);
				}
				
				// Save current scroll position for this version (final save on page leave)
				if (this.readProgress >= 0) {
					bookCacheService.setLastReadScrollPercentage(this.bookId, this.currentVersionId, this.readProgress);
				}
				
				// Save current reading position for this version (final save on page leave)
				if (this.currentSentenceId > 0) {
					bookCacheService.setLastReadPosition(this.bookId, this.currentVersionId, this.currentSentenceId);
				}
				
				// Reset the page enter time for next session
				this.pageEnterTime = Date.now();
				
				console.log(`[LibraryBook] Saved final progress: ${this.readProgress.toFixed(1)}%, sentence: ${this.currentSentenceId}`);
			},
			
			/**
			 * Loads and restores the reading progress when user enters or returns to the book
			 * @param {boolean} forceScroll - Whether to force scrolling to the saved position
			 */
			loadReadingProgress(forceScroll = true) {
				if (!this.comprehensiveBook) return;
				
				// Load the saved scroll percentage for the current version (more accurate than sentence-based)
				const savedScrollPercentage = bookCacheService.getLastReadScrollPercentage(this.bookId, this.currentVersionId);
				
				if (savedScrollPercentage > 0) {
					// Set the progress bar to match the saved scroll position
					this.readProgress = savedScrollPercentage;
					
					// Only scroll if explicitly requested (e.g., on initial load or version switch)
					if (forceScroll) {
						this.scrollToPercentage(savedScrollPercentage, true); // Force scroll when loading progress
					}
				} else {
					// Fallback to sentence-based progress if no scroll percentage is saved
					const savedProgress = bookCacheService.getReadingProgressPercentage(this.bookId, this.currentVersionId);
					
					if (savedProgress > 0) {
						this.readProgress = savedProgress;
						
						if (forceScroll) {
							this.scrollToPercentage(savedProgress, true);
						}
					} else {
						// No saved progress, start from beginning
						this.readProgress = 0;
						this.currentSentenceId = 0;
					}
				}
				
				console.log(`[LibraryBook] Loaded reading progress: ${this.readProgress.toFixed(1)}%, forceScroll: ${forceScroll}`);
			},
			
			/**
			 * Scrolls to a specific percentage position
			 */
			scrollToPercentage(percentage, forceScroll = false) {
				// Don't auto-scroll if user is actively scrolling, unless forced
				if (this.userScrollingActive && !forceScroll) {
					console.log(`[LibraryBook] Skipping auto-scroll to ${percentage.toFixed(1)}% - user is actively scrolling`);
					return;
				}
				
				this.readProgress = Math.min(100, Math.max(0, percentage));
				
				// Calculate scroll position based on progress percentage
				// Use a selector query to get the actual scroll height
				this.$nextTick(() => {
					uni.createSelectorQuery().in(this).select('.content-scroll').scrollOffset((res) => {
						if (res && res.scrollHeight) {
							const scrollableDistance = res.scrollHeight - this.scrollViewHeight;
							const targetScrollTop = Math.floor((percentage / 100) * scrollableDistance);
							
							this.scrollTop = targetScrollTop;
							this.currentScrollTop = targetScrollTop;
							
							console.log(`[LibraryBook] Scrolled to ${percentage.toFixed(1)}% progress (scrollTop: ${targetScrollTop}) (forceScroll: ${forceScroll})`);
						} else {
							// Fallback to estimated scroll if query fails
							const estimatedScrollTop = Math.floor((percentage / 100) * 3000);
							this.scrollTop = estimatedScrollTop;
							this.currentScrollTop = estimatedScrollTop;
							
							console.log(`[LibraryBook] Fallback scroll to ${percentage.toFixed(1)}% progress (estimated scrollTop: ${estimatedScrollTop}) (forceScroll: ${forceScroll})`);
						}
					}).exec();
				});
				
				// Update current sentence based on the new position
				this.updateCurrentSentenceFromScroll();
			},

			/**
			 * Scrolls to a specific sentence and updates the progress accordingly
			 */
			scrollToSentence(sentenceId, forceScroll = false) {
				// Don't auto-scroll if user is actively scrolling, unless forced
				if (this.userScrollingActive && !forceScroll) {
					console.log(`[LibraryBook] Skipping auto-scroll to sentence ${sentenceId} - user is actively scrolling`);
					return;
				}
				
				// Find the sentence in current version
				const sentenceIndex = this.currentBookSentences.findIndex(s => s.sentenceId === sentenceId);
				if (sentenceIndex >= 0 && this.currentBookSentences.length > 0) {
					// Calculate progress based on sentence index
					const progress = (sentenceIndex / this.currentBookSentences.length) * 100;
					this.readProgress = Math.min(100, Math.max(0, progress));
					
					// Calculate scroll position based on progress
					// This is an approximation - in a real implementation you might want to measure actual text heights
					const estimatedScrollTop = Math.floor((progress / 100) * 3000); // Approximate scroll value
					
					this.$nextTick(() => { 
						this.scrollTop = estimatedScrollTop; 
						this.currentScrollTop = estimatedScrollTop; 
					});
					
					this.currentSentenceId = sentenceId;
					console.log(`[LibraryBook] Scrolled to sentence ${sentenceId} at ${progress.toFixed(1)}% progress (forceScroll: ${forceScroll})`);
				}
			},
			
			/**
			 * Updates reading progress when audio progress changes (if audio controls are used)
			 */
			syncProgressWithAudio(audioProgressPercentage) {
				if (!this.currentBookSentences || this.currentBookSentences.length === 0) return;
				
				// Update the visual progress
				this.readProgress = audioProgressPercentage;
				
				// Save the scroll percentage
				this.saveCurrentScrollPosition();
				
				// Calculate corresponding sentence and update position
				const totalSentences = this.currentBookSentences.length;
				const currentIndex = Math.floor((audioProgressPercentage / 100) * totalSentences);
				const clampedIndex = Math.max(0, Math.min(currentIndex, totalSentences - 1));
				
				if (this.currentBookSentences[clampedIndex]) {
					const newSentenceId = this.currentBookSentences[clampedIndex].sentenceId;
					if (newSentenceId !== this.currentSentenceId) {
						this.currentSentenceId = newSentenceId;
						// Save the new position immediately
						bookCacheService.setLastReadPosition(this.bookId, this.currentVersionId, this.currentSentenceId);
						// Optionally scroll to the new position
						this.scrollToPercentage(audioProgressPercentage);
					}
				}
			},

			// --- Misc ---
			togglePlay() { this.isPlaying = !this.isPlaying; },
			nextPage() { this.scrollTop = this.currentScrollTop + this.scrollViewHeight; },
			handleVolumeChange(newVolume) { settingsCacheService.saveVolume(newVolume); },
			
			/**
			 * Handles progress changes from the audio progress bar
			 */
			handleProgressChanged(newProgressPercentage) {
				if (!this.comprehensiveBook) return;
				
				// Update the visual progress immediately
				this.readProgress = newProgressPercentage;
				
				// Save the scroll percentage directly
				bookCacheService.setLastReadScrollPercentage(this.bookId, this.currentVersionId, newProgressPercentage);
				
				// Use the enhanced service method to set reading position based on progress percentage
				bookCacheService.setReadingProgressPercentage(this.bookId, this.currentVersionId, newProgressPercentage);
				
				// Get the updated sentence position and sync the view
				const newSentenceId = bookCacheService.getLastReadPosition(this.bookId, this.currentVersionId);
				if (newSentenceId !== this.currentSentenceId) {
					this.currentSentenceId = newSentenceId;
					// Scroll to the new position to keep everything in sync (force scroll since user initiated)
					this.scrollToPercentage(newProgressPercentage, true);
				}
				
				console.log(`[LibraryBook] Progress changed to ${newProgressPercentage.toFixed(1)}%, sentence ${newSentenceId}`);
			}
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