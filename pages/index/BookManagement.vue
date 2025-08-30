<template>
	<!-- Manage Library Section -->
	<view class="library-management-section">
		<uni-list v-if="libraryBooks.length > 0">
			<template v-for="(book, index) in libraryBooks" :key="book.marketId">
				<uni-list-item>
					<!-- ... (unchanged list item body and footer) ... -->
					<template v-slot:body>
						<view class="book-item-body">
							<image :src="book.cover" class="book-cover" mode="aspectFill"></image>
							<view class="book-info">
								<text class="book-title">{{ book.title }}</text>
								<view v-if="book.AIisInProgress" class="ai-status">
									<text class="ai-in-progress-text">AI In Progress</text>
								</view>
							</view>
						</view>
					</template>
					<template v-slot:footer>
						<view class="book-item-footer">
							<view class="expand-icon" @click="toggleDetails(book)">
								<uni-icons :type="book.isExpanded ? 'up' : 'down'" size="22" color="#666"></uni-icons>
							</view>
							<view class="delete-button" @click="confirmDelete(book)">
								<uni-icons type="trash" size="22" color="#e43d33"></uni-icons>
							</view>
						</view>
					</template>
				</uni-list-item>

				<!-- Expanded Details Section -->
				<view v-if="book.isExpanded" class="details-section">
					<!-- 1. AI Progress View (shows only when a task is in progress) -->
					<view v-if="book.AIisInProgress" class="ai-in-progress-view">
						<text class="ai-task-label">AI Task: {{ book.AITask }}</text>
						<view class="progress-container">
							<progress :percent="book.AIProgress" stroke-width="6" activeColor="#18BC37" backgroundColor="#EFEFEF" class="ai-progress-bar"></progress>
							<text class="ai-progress-label">{{ book.AIProgress }}%</text>
						</view>
						<view class="action-buttons">
							<button class="cancel-btn" @click="confirmCancelAITask(book)">Cancel</button>
							<button class="accelerate-btn" @click="confirmAccelerateAITask(book)">Accelerate</button>
						</view>
					</view>

					<!-- 2. Start AI Task Menu (shows only when NO task is in progress) -->
					<view v-else>
						<view class="menu-option" @click="toggleAITasks(book)">
							<text>Start an AI Task</text>
							<uni-icons :type="book.isAITasksExpanded ? 'up' : 'down'" size="20" color="#666"></uni-icons>
						</view>
						<view v-if="book.isAITasksExpanded" class="ai-task-list">
							<view v-for="task in book.availableAITasks" :key="task" class="ai-task-link" @click="confirmStartAITask(book, task)">
								{{ task }}
							</view>
						</view>
					</view>

					<!-- 3. History Component (ALWAYS shows when expanded) -->
					<book-history-versions :book="book" @history-updated="handleHistoryUpdate(book, $event)"></book-history-versions>

				</view>
			</template>
		</uni-list>
		<view v-else class="empty-library-message">
			<text>No books in your library.</text>
		</view>
	</view>
</template>

<script>
	import settingsService from '@/services/settingsService';
	// Import the new component
	import BookHistoryVersions from '@/components/BookHistoryVersions.vue';

	export default {
		// Register the new component
		components: {
			BookHistoryVersions
		},
		data() {
			return {
				libraryBooks: []
			};
		},
		onShow() {
			this.loadLibraryBooks();
		},
		methods: {
			loadLibraryBooks() {
				this.libraryBooks = settingsService.getLibraryBooks().map(book => ({
					...book,
					isExpanded: book.isExpanded || false,
					isAITasksExpanded: book.isAITasksExpanded || false,
					AIisInProgress: book.AIisInProgress || false,
					AIProgress: book.AIProgress || 0,
					AITask: book.AITask || '',
					availableAITasks: book.availableAITasks || ['Summarize', 'Extract Keywords', 'Rewrite to Simple'],
					history: book.history || [{
						id: 1,
						timestamp: '2025-08-15 11:45',
						taskName: 'Summarize'
					}, {
						id: 2,
						timestamp: '2025-08-18 16:20',
						taskName: 'Extract Keywords'
					}, ]
				}));
			},
			updateBookState(updatedBook) {
				settingsService.updateBookInLibrary(updatedBook);
				const index = this.libraryBooks.findIndex(b => b.marketId === updatedBook.marketId);
				if (index !== -1) {
					this.libraryBooks.splice(index, 1, updatedBook);
				}
			},
			toggleDetails(book) {
				book.isExpanded = !book.isExpanded;
				if (!book.isExpanded) {
					book.isAITasksExpanded = false;
				}
				this.updateBookState(book);
			},
			toggleAITasks(book) {
				book.isAITasksExpanded = !book.isAITasksExpanded;
				this.updateBookState(book);
			},
			handleHistoryUpdate(book, updatedHistory) {
				const updatedBook = { ...book,
					history: updatedHistory
				};
				this.updateBookState(updatedBook);
			},
			confirmStartAITask(book, task) {
				uni.showModal({
					title: 'Confirm AI Task',
					content: `Start the '${task}' task for "${book.title}"?`,
					success: (res) => {
						if (res.confirm) {
							this.startAITask(book, task);
						}
					}
				});
			},
			startAITask(book, task) {
				const updatedBook = { ...book,
					AIisInProgress: true,
					AITask: task,
					AIProgress: 0,
					isAITasksExpanded: false
				};
				this.updateBookState(updatedBook);
				uni.showToast({
					title: `'${task}' started`,
					icon: 'success'
				});
			},
			confirmDelete(book) {
				uni.showModal({
					title: 'Confirm',
					content: `Remove "${book.title}" from your library?`,
					success: (res) => {
						if (res.confirm) {
							this.deleteBook(book.marketId);
						}
					}
				});
			},
			deleteBook(marketId) {
				settingsService.removeBookFromLibrary(marketId);
				this.loadLibraryBooks();
				uni.showToast({
					title: 'Book removed',
					icon: 'success'
				});
			},
			confirmCancelAITask(book) {
				uni.showModal({
					title: 'Confirm Cancellation',
					content: 'Are you sure you want to cancel the AI task?',
					success: (res) => {
						if (res.confirm) {
							const updatedBook = { ...book,
								AIisInProgress: false,
								isExpanded: false
							};
							this.updateBookState(updatedBook);
							uni.showToast({
								title: 'AI task cancelled',
								icon: 'none'
							});
						}
					}
				});
			},
			confirmAccelerateAITask(book) {
				uni.showModal({
					title: 'Accelerate AI Task',
					content: 'This will reduce the remaining time by approx. 50% and consume an extra 200 AI budget credits.\n\nDo you want to proceed?',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: 'AI task accelerated',
								icon: 'none'
							});
						}
					}
				});
			},
		}
	}
</script>

<style>
	/* All general styles remain here */
	.library-management-section { margin-top: 20px; }
	.book-item-body { display: flex; flex-direction: row; align-items: center; width: 100%; }
	.book-cover { width: 50px; height: 70px; margin-right: 15px; border-radius: 4px; }
	.book-info { flex: 1; display: flex; flex-direction: column; }
	.book-title { font-size: 16px; font-weight: 500; }
	.ai-status { margin-top: 5px; }
	.ai-in-progress-text { font-size: 12px; font-style: italic; color: #007aff; }
	.book-item-footer { display: flex; align-items: center; }
	.expand-icon { padding: 0 10px; }
	.delete-button { display: flex; align-items: center; justify-content: center; padding: 0 10px; cursor: pointer; }
	.empty-library-message { padding: 20px; text-align: center; color: #888; }
	.details-section { padding: 10px 15px; background-color: #f9f9f9; border-bottom: 1px solid #eee; display: flex; flex-direction: column; gap: 15px; }
	.ai-task-label { display: block; font-size: 14px; color: #555; margin-bottom: 8px; }
	.progress-container { display: flex; align-items: center; gap: 10px; }
	.ai-progress-bar { flex: 1; }
	.ai-progress-label { font-size: 12px; color: #333; }
	.action-buttons { display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; }
	.action-buttons button { font-size: 14px; padding: 4px 12px; margin: 0; line-height: 1.5; }
	.cancel-btn { background-color: #f0f0f0 !important; color: #333 !important; }
	.accelerate-btn { background-color: #007aff !important; color: white !important; }
	.ai-in-progress-view { padding-bottom: 5px; }
	.menu-option { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 15px; color: #333; cursor: pointer; border-bottom: 1px solid #eee; }
	.ai-task-list { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 10px; padding-left: 10px; }
	.ai-task-link { font-size: 15px; color: #007aff; cursor: pointer; padding: 4px 0; }
</style>