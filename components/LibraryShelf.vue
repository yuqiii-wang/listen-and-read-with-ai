<template>
	<!-- Added a click handler to the root element -->
	<view class="library-shelf-container" @click="handleShelfClick">
		<view 
			v-if="editingBook" 
			class="edit-mode-overlay" 
			@click.prevent="handleBackgroundClick">
		</view>

		<uni-grid :column="3" :show-border="false" :square="false" :highlight="false">
			<!-- ... v-for loop remains the same ... -->
			<uni-grid-item v-for="book in libraryBooks" :index="book.marketId" :key="book.marketId">
				<view 
					class="grid-item-box"
					:class="{ 'edit-mode': editingBook && editingBook.marketId === book.marketId }"
					@longpress="selectBookForEditing(book)"
					@click="handleBookClick(book)">
					
					<view v-if="editingBook && editingBook.marketId === book.marketId" class="delete-btn" @click.stop="confirmDelete">
						<uni-icons type="closeempty" size="18" color="#fff"></uni-icons>
					</view>
					
					<image class="book-cover" :class="{ 'new-book-cover': newlyAddedBookId === book.marketId }" :src="book.cover" mode="aspectFill"></image>
					
					<template v-if="editingBook && editingBook.marketId === book.marketId">
						<input 
							type="text" 
							class="book-title-input" 
							v-model="editingBook.title" 
							@click.stop 
							:focus="true" 
						/>
					</template>
					<template v-else>
						<text class="book-title" :class="{ 'new-book-title': newlyAddedBookId === book.marketId }">{{ book.title }}</text>
					</template>
				</view>
			</uni-grid-item>
			
			<uni-grid-item>
				<!-- Added .stop modifier to prevent the shelf click handler from firing -->
				<view class="grid-item-box" @click.stop="addNewDocument">
					<view class="add-book-container">
						<text class="add-btn">+</text>
					</view>
					<text class="book-title">add new document</text>
				</view>
			</uni-grid-item>
		</uni-grid>
		
		<!-- The BookImport component itself handles the close event -->
		<BookImport :is-open="isImportSidebarOpen" @close="isImportSidebarOpen = false" @upload-complete="handleUploadComplete" />
	</view>
</template>

<script>
	import settingsService from '@/services/settingsService';
	import BookImport from './BookImport.vue'; // Make sure the path is correct

	export default {
		name: "LibraryShelf",
		components: {
			BookImport
		},
		props: {
			libraryBooks: {
				type: Array,
				required: true
			}
		},
		data() {
			return {
				editingBook: null,
				originalEditingTitle: null,
				isImportSidebarOpen: false,
				newlyAddedBookId: null
			};
		},
		methods: {
			// New method to close sidebar when clicking on the shelf area
			handleShelfClick() {
				if (this.isImportSidebarOpen) {
					this.isImportSidebarOpen = false;
				}
			},

			addNewDocument() {
				this.isImportSidebarOpen = true;
			},
			
			// ... [ The rest of your methods remain unchanged ] ...
			handleBookClick(book, event) {
				if (this.editingBook) {
					if (this.editingBook.marketId !== book.marketId) {
						this.handleBackgroundClick();
					}
					event.stopPropagation();
					return;
				}

				if (this.newlyAddedBookId === book.marketId) {
					this.newlyAddedBookId = null;
				}

				this.navigateToLibraryBook(book);
			},

			handleBackgroundClick() {
				if (!this.editingBook) return;
				const hasChanged = this.editingBook.title.trim() !== this.originalEditingTitle;

				if (hasChanged) {
					uni.showModal({
						title: 'Confirm Changes',
						content: `Save the new title for "${this.originalEditingTitle}"?`,
						success: (res) => {
							if (res.confirm) {
								this.saveBookTitle();
							} else {
								this.exitEditMode();
							}
						}
					});
				} else {
					this.exitEditMode();
				}
			},
			
			navigateToLibraryBook(book) {
				uni.navigateTo({
					url: `/pages/library/LibraryBook?id=${book.marketId}&title=${encodeURIComponent(book.title)}`
				});
			},
			
			handleUploadComplete(newBook) {
				this.libraryBooks.unshift(newBook);
				this.newlyAddedBookId = newBook.marketId;
				// The sidebar now closes itself upon success
				// this.isImportSidebarOpen = false; 
				this.$emit('libraryUpdated');
			},
			
			selectBookForEditing(book) {
				if (this.editingBook && this.editingBook.marketId !== book.marketId) {
					this.handleBackgroundClick();
				}
				this.editingBook = { ...book };
				this.originalEditingTitle = book.title;
			},
			
			saveBookTitle() {
				if (!this.editingBook) return;
				const bookInArray = this.libraryBooks.find(b => b.marketId === this.editingBook.marketId);
				if (bookInArray) {
					bookInArray.title = this.editingBook.title;
				}
				settingsService.updateBookInLibrary(this.editingBook);
				this.exitEditMode();
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
					content: `Are you sure you want to delete "${this.originalEditingTitle}"?`,
					success: (res) => {
						if (res.confirm) {
							this.deleteBook();
						}
					}
				});
			},
			
			deleteBook() {
				if (!this.editingBook) return;
				settingsService.removeBookFromLibrary(this.editingBook.marketId);
				this.exitEditMode();
				this.$emit('libraryUpdated');
			}
		}
	}
</script>

<style scoped>
	/* ... [existing styles from previous answer] ... */

	.new-book-title {
		font-weight: bold;
	}

	.new-book-cover {
		border: 2px solid #007AFF;
		box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
	}
	
	/* The rest of the styles are unchanged */
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
		background-color: #f8f8f8;
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
		color: #333;
		width: 90px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
		word-break: break-word;
	}
	
	.book-title-input {
		margin-top: 8px;
		font-size: 14px;
		text-align: center;
		color: #007AFF;
		width: 90px;
		border: none;
		background-color: #eef2f7;
		border-radius: 3px;
		padding: 5px 0;
		height: 2.8em;
	}

	.add-book-container { width: 90px; height: 120px; border-radius: 5px; background-color: transparent; border: 2px dashed #cccccc; display: flex; justify-content: center; align-items: center; cursor: pointer; }
	.add-book-container:hover { background-color: #f0f0f0; }
	.add-btn { font-size: 40px; color: #cccccc; font-weight: 200; }

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
		position: fixed; /* Covers the entire viewport */
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: transparent; /* Makes it invisible */
		z-index: 10; 
	}
</style>