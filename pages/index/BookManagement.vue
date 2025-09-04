<template>
	<view class="book-management-container" :style="pageStyle">
		<!-- Header -->
		<view class="header-section">
			<text class="page-title" :style="titleStyle">My Library</text>
		</view>

		<!-- Books List -->
		<uni-list :border="false" class="books-list">
			<view v-for="book in libraryBooks" :key="book.bookId">
				<uni-list-item :customStyle="bookItemStyle">
					<!-- Simple Book Row -->
					<template v-slot:body>
						<view class="book-row" @click="toggleBookHistory(book.bookId)">
							<view class="book-cover" :style="bookCoverStyle">
								<image :src="book.cover" mode="aspectFill" class="cover-image"></image>
							</view>
							<text class="book-title" :style="titleStyle">{{ getDisplayTitle(book) }}</text>
							<view class="expansion-indicator">
								<uni-icons 
									:type="expandedBookId === book.bookId ? 'up' : 'down'" 
									size="20" 
									:color="themeStyles.secondaryTextColor"
								></uni-icons>
							</view>
						</view>
					</template>
					
					<!-- Delete Button -->
					<template v-slot:footer>
						<view class="delete-action" @click="confirmDeleteBook(book.bookId)">
							<uni-icons type="trash" size="20" :color="themeStyles.secondaryTextColor"></uni-icons>
						</view>
					</template>
				</uni-list-item>

				<!-- Book History Versions (Expandable) -->
				<view v-if="expandedBookId === book.bookId" class="history-section">
					<BookHistoryVersions 
						:allVersions="book.versions?.allVersions || []"
						:bookId="book.bookId"
						:currentVersionId="book.versions?.currentVersionId || 1"
						:justCompletedAIVersions="book.justCompletedVersions || []"
						:show="expandedBookId === book.bookId"
						:theme="themeStyles"
						@switch-version="handleSwitchVersion"
						@delete-version="handleDeleteVersion"
						@cancel-ai-task="handleCancelAITask"
						@accelerate-ai-task="handleAccelerateAITask"
						@reset-just-completed-versions="resetJustCompletedVersions"
						@refresh-book-data="loadLibraryBooks"
					/>
				</view>
			</view>
		</uni-list>

		<!-- Empty State -->
		<view v-if="libraryBooks.length === 0" class="empty-state">
			<text class="empty-message" :style="titleStyle">No books in your library</text>
			<text class="empty-description" :style="sourceStyle">Add books from the market to get started</text>
		</view>
	</view>
</template>

<script>
	import bookCacheService from '@/services/bookCacheService';
	import settingsCacheService from '@/services/settingsCacheService';
	import BookHistoryVersions from '@/components/BookHistoryVersions.vue';

	export default {
		name: 'BookManagement',
		components: {
			BookHistoryVersions
		},
		data() {
			return {
				libraryBooks: [],
				expandedBookId: null,
				themeStyles: {},
			}
		},
		onLoad() {
			this.loadLibraryBooks();
			this.loadTheme();
		},
		onShow() {
			this.loadLibraryBooks();
			this.loadTheme();
		},
		computed: {
			pageStyle() {
				return { 
					backgroundColor: this.themeStyles.backgroundColor, 
					minHeight: '100vh',
					padding: '10px'
				};
			},
			titleStyle() {
				return { color: this.themeStyles.primaryTextColor };
			},
			sourceStyle() {
				return { color: this.themeStyles.secondaryTextColor, fontSize: '12px' };
			},
			bookItemStyle() {
				return {
					backgroundColor: this.themeStyles.backgroundColor,
					borderBottom: `1px solid ${this.themeStyles.borderColor}`,
					marginBottom: '10px',
					borderRadius: '8px',
					padding: '10px'
				}
			},
			bookCoverStyle() {
				const settings = settingsCacheService.getSettings();
				const baseStyle = {
					width: '50px',
					height: '70px',
					borderRadius: '4px',
					overflow: 'hidden',
					boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
				};
				
				// Add thin border for black theme
				if (settings.theme === 'Black') {
					baseStyle.border = '1px solid #555555';
				}
				
				return baseStyle;
			}
		},
		methods: {
			loadLibraryBooks() {
				try {
					// Get library book IDs
					const libraryBookIds = bookCacheService.getLibraryBooks();
					console.log('[BookManagement] Library book IDs:', libraryBookIds);
					
					// Get detailed information for each book
					this.libraryBooks = libraryBookIds.map(bookId => {
						const book = bookCacheService.getBookByBookId(bookId);
						if (book) {
							return {
								bookId: book.metadata.bookId,
								title: book.metadata.title,
								author: book.metadata.author,
								tags: book.metadata.tags || [],
								summary: book.metadata.summary,
								cover: book.metadata.cover,
								reader: book.metadata.reader,
								readerMetadata: book.readerMetadata,
								versions: book.versions,
								justCompletedVersions: []
							};
						}
						return null;
					}).filter(book => book !== null);
					
					console.log('[BookManagement] Loaded library books:', this.libraryBooks);
				} catch (error) {
					console.error('[BookManagement] Error loading library books:', error);
					this.libraryBooks = [];
				}
			},
			
			loadTheme() {
				const settings = settingsCacheService.getSettings();
				this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
				uni.setNavigationBarColor({
				    frontColor: this.themeStyles.navBar.textColor,
				    backgroundColor: this.themeStyles.navBar.backgroundColor
				});
			},

			getDisplayTitle(book) {
				return book.readerMetadata?.customTitle || book.title;
			},

			toggleBookHistory(bookId) {
				if (this.expandedBookId === bookId) {
					this.expandedBookId = null;
				} else {
					this.expandedBookId = bookId;
					// Refresh book data when expanding history
					this.refreshBookData(bookId);
				}
			},

			refreshBookData(bookId) {
				const bookIndex = this.libraryBooks.findIndex(b => b.bookId === bookId);
				if (bookIndex !== -1) {
					const book = bookCacheService.getBookByBookId(bookId);
					if (book) {
						this.libraryBooks[bookIndex].versions = book.versions;
						this.libraryBooks[bookIndex].readerMetadata = book.readerMetadata;
					}
				}
			},

			handleSwitchVersion(versionId) {
				const bookId = this.expandedBookId;
				if (!bookId) return;
				
				const book = bookCacheService.getBookByBookId(bookId);
				if (book && book.versions.currentVersionId !== versionId) {
					book.versions.currentVersionId = versionId;
					bookCacheService.saveBook(book);
					
					// Update local data
					this.refreshBookData(bookId);
					
					uni.showToast({ 
						title: `Switched to v${versionId}`, 
						icon: 'none' 
					});
				}
			},

			handleDeleteVersion(versionId) {
				const bookId = this.expandedBookId;
				if (!bookId) return;
				
				const book = bookCacheService.getBookByBookId(bookId);
				if (!book) return;
				
				if (book.versions.currentVersionId === versionId) {
					uni.showToast({
						title: 'Cannot delete the active version.',
						icon: 'none'
					});
					return;
				}
				
				uni.showModal({
					title: 'Confirm Delete',
					content: `Are you sure you want to delete version ${versionId}? This action cannot be undone.`,
					success: (res) => {
						if (res.confirm) {
							// Remove version from allVersions
							book.versions.allVersions = book.versions.allVersions.filter(v => v.version !== versionId);
							// Remove sentences for this version
							book.content.sentences = book.content.sentences.filter(s => s.version !== versionId);
							// Remove audio data for this version
							book.audio.audioData = book.audio.audioData.filter(a => a.version !== versionId);
							
							bookCacheService.saveBook(book);
							this.refreshBookData(bookId);
							
							uni.showToast({ title: 'Version deleted', icon: 'success' });
						}
					}
				});
			},

			handleCancelAITask(taskId) {
				const bookId = this.expandedBookId;
				if (!bookId) return;
				
				// Import and use the consumption callback
				const userProfileCacheService = require('@/services/userProfileCacheService').default;
				const consumeAIBudget = (details) => userProfileCacheService.logConsumption(details);
				
				bookCacheService.cancelAITask(bookId, taskId, consumeAIBudget);
				this.refreshBookData(bookId);
				uni.showToast({ title: 'AI Task Cancelled', icon: 'none' });
			},

			handleAccelerateAITask(taskId) {
				const bookId = this.expandedBookId;
				if (!bookId) return;
				
				// Import and use the consumption callback
				const userProfileCacheService = require('@/services/userProfileCacheService').default;
				const consumeAIBudget = (details) => userProfileCacheService.logConsumption(details);
				
				bookCacheService.accelerateAITask(bookId, taskId, consumeAIBudget);
				this.refreshBookData(bookId);
				uni.showToast({ title: 'AI Task Accelerated', icon: 'none' });
			},

			resetJustCompletedVersions() {
				const bookIndex = this.libraryBooks.findIndex(b => b.bookId === this.expandedBookId);
				if (bookIndex !== -1) {
					this.libraryBooks[bookIndex].justCompletedVersions = [];
				}
			},

			confirmDeleteBook(bookId) {
				const book = this.libraryBooks.find(b => b.bookId === bookId);
				if (!book) return;
				
				uni.showModal({
					title: 'Remove Book',
					content: `Are you sure you want to remove "${book.title}" from your library? This will not delete the book data.`,
					success: (res) => {
						if (res.confirm) {
							this.deleteBookFromLibrary(bookId);
						}
					}
				});
			},

			deleteBookFromLibrary(bookId) {
				try {
					// Get current library books
					const libraryBookIds = bookCacheService.getLibraryBooks();
					// Remove the book ID from library
					const updatedLibraryIds = libraryBookIds.filter(id => id !== bookId);
					// Save updated library
					bookCacheService.saveLibraryBooks(updatedLibraryIds);
					
					// Update local data
					this.libraryBooks = this.libraryBooks.filter(book => book.bookId !== bookId);
					
					// Close expansion if this book was expanded
					if (this.expandedBookId === bookId) {
						this.expandedBookId = null;
					}
					
					uni.showToast({ 
						title: 'Book removed from library', 
						icon: 'success' 
					});
				} catch (error) {
					console.error('[BookManagement] Error removing book from library:', error);
					uni.showToast({ 
						title: 'Failed to remove book', 
						icon: 'error' 
					});
				}
			}
		}
	}
</script>

<style scoped>
	.book-management-container {
		width: 100%;
		padding: 10px;
	}

	/* Header Section */
	.header-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding: 0 5px;
	}

	.page-title {
		font-size: 24px;
		font-weight: bold;
	}

	/* Books List */
	.books-list {
		width: 100%;
	}

	.book-row {
		display: flex;
		align-items: center;
		width: 100%;
		cursor: pointer;
		padding: 10px 0;
		gap: 15px;
	}

	.book-cover {
		flex-shrink: 0;
	}

	.cover-image {
		width: 100%;
		height: 100%;
		border-radius: 4px;
	}

	.book-title {
		flex: 1;
		font-size: 16px;
		font-weight: 500;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.expansion-indicator {
		transition: transform 0.2s ease;
	}

	.book-row:active .expansion-indicator {
		transform: scale(0.9);
	}

	/* Delete Action */
	.delete-action {
		padding: 10px;
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.delete-action:active {
		opacity: 0.7;
		transform: scale(0.95);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		text-align: center;
	}

	.empty-message {
		font-size: 18px;
		font-weight: bold;
		margin-bottom: 10px;
	}

	.empty-description {
		font-size: 14px;
		opacity: 0.7;
	}
</style>