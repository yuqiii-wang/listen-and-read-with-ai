<template>
	<!-- Added a click handler to the root element to exit edit mode -->
	<view class="library-shelf-container" @click="handleShelfClick">
		<!-- Overlay to capture clicks when in edit mode -->
		<view 
			v-if="editingBook" 
			class="edit-mode-overlay" 
			@click.prevent="handleBackgroundClick">
		</view>

		<uni-grid :column="3" :show-border="false" :square="false" :highlight="false">
			<uni-grid-item v-for="book in displayBooks" :index="book.bookId" :key="book.bookId">
				<view 
					class="grid-item-box"
					:class="{ 'edit-mode': editingBook && editingBook.bookId === book.bookId }"
					@longpress="selectBookForEditing(book)"
					@click="handleBookClick(book)">
					
					<!-- Delete button shown only in edit mode -->
					<view v-if="editingBook && editingBook.bookId === book.bookId" class="delete-btn" @click.stop="confirmDelete">
						<uni-icons type="closeempty" size="18" color="#fff"></uni-icons>
					</view>
					
					<image 
						class="book-cover" 
						:class="{ 'new-book-cover': newlyAddedBookId === book.bookId }" 
						:src="book.cover" 
						:style="{ border: '1px solid ' + themeStyles.borderColor }"
						mode="aspectFill">
					</image>
					
					<!-- Input field for editing the title -->
					<template v-if="editingBook && editingBook.bookId === book.bookId">
						<input 
							type="text" 
							class="book-title-input" 
							v-model="editingBook.title" 
							@click.stop 
							:focus="true"
							:style="{ 
								backgroundColor: themeStyles.input?.backgroundColor || '#eef2f7',
								color: themeStyles.input?.textColor || '#007AFF',
								borderColor: themeStyles.input?.borderColor || '#ddd'
							}"
						/>
					</template>
					<!-- Regular title display -->
					<view velse>
						<text class="book-title" :class="{ 'new-book-title': newlyAddedBookId === book.bookId }">{{ book.title }}</text>
					</view>
				</view>
			</uni-grid-item>			<!-- "Add New Document" button -->
			<uni-grid-item>
				<view class="grid-item-box" @click.stop="addNewDocument">
					<view class="add-book-container">
						<text class="add-btn">+</text>
					</view>
					<text class="book-title">add new document</text>
				</view>
			</uni-grid-item>
		</uni-grid>
		
		<!-- Book Import Sidebar -->
		<BookImport :is-open="isImportSidebarOpen" @close="isImportSidebarOpen = false" @upload-complete="handleUploadComplete" />
	</view>
</template>

<script>
	// --- ALIGNED: Using the correct BookCacheService for all data operations ---
	import bookCacheService from '@/services/BookCacheService';
	import BookImport from './BookImport.vue';

	export default {
		name: "LibraryShelf",
		components: {
			BookImport
		},
		props: {
			// The parent component is responsible for fetching and passing the book list.
			// This list should be an array of BookMetadata objects.
			libraryBooks: {
				type: Array,
				required: true
			},
			themeStyles: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				editingBook: null, // Holds a copy of the book being edited
				originalEditingTitle: null,
				isImportSidebarOpen: false,
				newlyAddedBookId: null // To highlight a newly added book
			};
		},
		computed: {
			displayBooks() {
				return this.libraryBooks.map(book => {
					const bookMeta = bookCacheService.getBookMetadata(book.bookId);
					const readerMeta = bookCacheService.getReaderMetadata(book.bookId);
					const displayTitle = (readerMeta && readerMeta.customTitle) 
						? readerMeta.customTitle 
						: (bookMeta ? bookMeta.title : 'Untitled');
					return {
						...book,
						title: displayTitle,
					};
				});
			}
		},
		methods: {
			handleShelfClick() {
				// If clicking anywhere on the shelf, exit edit mode
				if (this.editingBook) {
					this.exitEditMode();
				}
				if (this.isImportSidebarOpen) {
					this.isImportSidebarOpen = false;
				}
			},

			addNewDocument() {
				this.isImportSidebarOpen = true;
			},
			
			handleBookClick(book) {
				// If in edit mode, clicking a different book should exit edit mode first
				if (this.editingBook && this.editingBook.bookId !== book.bookId) {
					this.exitEditMode();
					return;
				}
				// If not in edit mode, navigate to the book reader page
				if (!this.editingBook) {
					this.navigateToLibraryBook(book);
				}
			},

			handleBackgroundClick() {
				this.exitEditMode();
			},
			
			navigateToLibraryBook(book) {
				// ALIGNED: Navigate using the correct 'bookId' property
				uni.navigateTo({
					url: `/pages/library/LibraryBook?id=${book.bookId}`
				});
			},
			
			handleUploadComplete(newBook) {
				// The parent will handle adding the book to the cache.
				// We just need to signal that an update happened.
				this.newlyAddedBookId = newBook.bookId;
				this.$emit('libraryUpdated');
			},
			
			selectBookForEditing(book) {
				if (this.editingBook && this.editingBook.bookId !== book.bookId) {
					this.exitEditMode();
				}
				this.editingBook = { ...book };
				this.originalEditingTitle = book.title;
			},
			
			/**
			 * ALIGNED: Saves the custom title to the book's ReaderMetadata.
			 */
			saveBookTitle(newTitle) {
				if (!this.editingBook) return;
				
				const bookId = this.editingBook.bookId;

				// Fetch the specific metadata for this reader
				const readerMeta = bookCacheService.getReaderMetadata(bookId);
				const bookMeta = bookCacheService.getBookMetadata(bookId);

				// If the new title is empty or the same as the original metadata title,
				// set customTitle to null to revert to the default. Otherwise, save it.
				if (!newTitle || (bookMeta && newTitle === bookMeta.title)) {
					readerMeta.customTitle = null;
				} else {
					readerMeta.customTitle = newTitle;
				}
				
				// Save the updated metadata back to the cache
				bookCacheService.saveReaderMetadata(bookId, readerMeta);
				
				// Notify the parent component to refetch the data to show the new title
				this.$emit('libraryUpdated');
			},
			
			exitEditMode() {
				this.editingBook = null;
				this.originalEditingTitle = null;
			},
			
			confirmDelete() {
				if (!this.editingBook) return;
				uni.showModal({
					title: 'Confirm Deletion',
					content: `Are you sure you want to remove "${this.originalEditingTitle}" from your library?`,
					success: (res) => {
						if (res.confirm) {
							this.deleteBook();
						}
					}
				});
			},
			
			/**
			 * ALIGNED: Deletes a book by removing its ID from the library list in the cache.
			 */
			deleteBook() {
				if (!this.editingBook) return;
				
				const bookIdToDelete = this.editingBook.bookId;
				// Get the current list of library book IDs
				const libraryBookIds = bookCacheService.getLibraryBooks();
				// Create a new list without the deleted book's ID
				const updatedLibraryIds = libraryBookIds.filter(id => id !== bookIdToDelete);
				// Save the updated list back to the cache
				bookCacheService.saveLibraryBooks(updatedLibraryIds);

				this.exitEditMode();
				// Notify the parent to refetch and update the UI
				this.$emit('libraryUpdated');
			}
		},
		watch: {
			'editingBook.title'(newTitle) {
				if (this.editingBook) {
					this.saveBookTitle(newTitle.trim());
				}
			}
		}
	}
</script>

<style scoped>

	.new-book-title {
		font-weight: bold;
	}

	.new-book-cover {
		border: 2px solid #007AFF;
		box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
	}
	
	.grid-item-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
		position: relative;
		transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
	}

	.grid-item-box.edit-mode {
		transform: scale(1.05);
		z-index: 20; 
		box-shadow: 0 8px 16px rgba(0,0,0,0.2);
		border-radius: 5px;
		/* Use a theme-aware background color for edit mode */
		background-color: var(--theme-list-item-bg, #f8f8f8);
	}

	.book-cover {
		width: 90px;
		height: 120px;
		border-radius: 5px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	.book-title {
		margin-top: 8px;
		font-size: 14px;
		line-height: 1.4em;
		height: 2.8em;
		text-align: center;
		/* Use a theme-aware text color */
		color: var(--theme-primary-text, #333);
		width: 90px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
		word-break: break-word;
	}
	
	.book-title-input {
		margin-top: 8px;
		font-size: 14px;
		text-align: center;
		width: 90px;
		border: 1px solid;
		border-radius: 3px;
		padding: 5px 0;
		height: 2.8em;
	}

	.add-book-container { 
		width: 90px; 
		height: 120px; 
		border-radius: 5px; 
		/* Use a theme-aware border color */
		border: 2px dashed var(--theme-border-color, #cccccc); 
		display: flex; 
		justify-content: center; 
		align-items: center; 
		cursor: pointer; 
	}
	.add-book-container:hover { 
		background-color: var(--theme-list-item-bg-hover, #f0f0f0); 
	}
	.add-btn { 
		font-size: 40px; 
		/* Use a theme-aware text color */
		color: var(--theme-secondary-text, #cccccc); 
		font-weight: 200; 
	}

	.delete-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		z-index: 30;
		background-color: rgba(231, 76, 60, 0.9);
		border-radius: 50%;
		width: 24px;
		height: 24px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}
	
	.edit-mode-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: transparent;
		z-index: 10; 
	}
</style>