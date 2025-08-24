<template>
	<view class="container">
		<!-- Sidebar Drawer -->
		<uni-drawer ref="sidebarDrawer" mode="left" :mask-click="true" @close="closeSidebar">
			<sidebar-profile></sidebar-profile>
		</uni-drawer>

		<!-- Top Navigation Bar -->
		<view class="custom-nav-bar">
			<view class="nav-content">
				<!-- Left: Profile Icon -->
				<view class="nav-left" @click="openSidebar">
					<uni-icons :type="profileIconType" size="24" color="#666"></uni-icons>
				</view>
				
				<!-- Center: Navigation Tabs -->
				<view class="nav-center">
					<view class="side-controls right">
						<text class="nav-item" :class="{ active: activeTab === 'library' }" @click="switchTab('library')">Library</text>
					</view>
					<view class="side-controls right">
						<text class="nav-item" :class="{ active: activeTab === 'market' }" @click="switchTab('market')">Book Market</text>
					</view>
				</view>

				<!-- Right: Search -->
				<view class="nav-right">
					<uni-search-bar 
						class="nav-search-bar"
						@confirm="search" 
						v-model="searchValue" 
						cancelButton="none" 
						clearButton="auto"
						placeholder="Search books"
						radius="100">
					</uni-search-bar>
				</view>
			</view>
		</view>

		<!-- Main Content - Book List -->
		<view class="content" @click="deselectBook">
			<uni-grid :column="3" :show-border="false" :square="false" :highlight="false">
				<uni-grid-item v-for="(book) in displayedBooks" :index="book.id" :key="book.id">
					<view 
						class="grid-item-box"
						:class="{ 'edit-mode': editingBook && editingBook.id === book.id }"
						@longpress="selectBookForEditing(book)"
						@click.stop="navigateToBook(book)">
						
						<view v-if="editingBook && editingBook.id === book.id" class="delete-btn" @click.stop="confirmDelete">
							<uni-icons type="closeempty" size="18" color="#fff"></uni-icons>
						</view>
						
						<image class="book-cover" :src="book.cover" mode="aspectFill"></image>
						
						<template v-if="editingBook && editingBook.id === book.id">
							<!--
								STEP 3: `v-model` provides two-way data binding. Any character typed
								in this input field INSTANTLY updates the `editingBook.title` data property.
								The change is already "saved" in the component's state.
							-->
							<input 
								type="text" 
								class="book-title-input" 
								v-model="editingBook.title" 
								@click.stop 
								:focus="true" 
							/>
						</template>
						<template v-else>
							<!--
								STEP 5: After deselecting, this text will now display the NEW title
								that was updated by the v-model from the input field.
							-->
							<text class="book-title">{{ book.title }}</text>
						</template>
					</view>
				</uni-grid-item>
				
				<uni-grid-item v-if="activeTab === 'library'">
					<view class="grid-item-box" @click.stop="addNewDocument">
						<view class="add-book-container">
							<text class="add-btn">+</text>
						</view>
						<text class="book-title">add new document</text>
					</view>
				</uni-grid-item>
			</uni-grid>
		</view>
	</view>
</template>

<script>
	import SidebarProfile from '@/components/SidebarProfile.vue';

	export default {
		components: {
			SidebarProfile
		},
		data() {
			return {
				activeTab: 'library',
				searchValue: '',
				profileIconType: 'person',
				editingBook: null,
				libraryBooks: [
					{ id: 1, cover: 'https://via.placeholder.com/150/0000FF/808080?Text=Book+1', title: 'The Great Gatsby' },
					{ id: 2, cover: 'https://via.placeholder.com/150/800080/FFFFFF?Text=Book+5', title: 'The Catcher in the Rye' },
					{ id: 3, cover: 'https://via.placeholder.com/150/FFA500/000000?Text=Book+6', title: 'The Hobbit' }
				],
				marketBooks: [
					{ id: 101, cover: 'https://via.placeholder.com/150/FF0000/FFFFFF?Text=Market+A', title: 'Dune' },
					{ id: 102, cover: 'https://via.placeholder.com/150/FFFF00/000000?Text=Market+B', title: 'Foundation' },
					{ id: 103, cover: 'https://via.placeholder.com/150/008000/FFFFFF?Text=Market+C', title: 'Brave New World' },
				]
			}
		},
		computed: {
			displayedBooks() {
				return this.activeTab === 'library' ? this.libraryBooks : this.marketBooks;
			}
		},
		methods: {
			navigateToBook(book) {
				// Only navigate if not in edit mode
				if (this.editingBook) {
					// If a book is being edited, a single tap should deselect it
					this.deselectBook();
					return;
				}
			
				if (this.activeTab !== 'library') return; // Only allow reading from the library
			
				uni.navigateTo({
					url: `/pages/library/LibraryBook?id=${book.id}&title=${encodeURIComponent(book.title)}`
				});
			},
			switchTab(tab) {
				this.activeTab = tab;
				this.deselectBook();
			},
			search(res) {
				uni.showToast({ title: 'Search: ' + res.value, icon: 'none' });
			},
			addNewDocument() {
				uni.showToast({ title: 'Add new document clicked', icon: 'none' });
			},
			openSidebar() {
			  this.$refs.sidebarDrawer.open();
			  this.profileIconType = 'person-filled';
			},
			closeSidebar() {
			  this.profileIconType = 'person';
			},
			selectBookForEditing(book) {
				if (this.activeTab !== 'library') return;
				this.editingBook = book;
			},
			// STEP 4: This method is called by the "tap outside" event.
			// It simply exits the edit mode by setting `editingBook` to null.
			// Because the data was already updated by `v-model`, the name change is
			// automatically "confirmed" and will be displayed correctly.
			deselectBook() {
				this.editingBook = null;
			},
			confirmDelete() {
				if (!this.editingBook) return;
				
				uni.showModal({
					title: 'Confirm Deletion',
					content: `Are you sure you want to delete "${this.editingBook.title}"?`,
					success: (res) => {
						if (res.confirm) {
							this.deleteBook();
						}
					}
				});
			},
			deleteBook() {
				if (!this.editingBook) return;
				const bookIdToDelete = this.editingBook.id;
				const index = this.libraryBooks.findIndex(book => book.id === bookIdToDelete);
				
				if (index !== -1) {
					this.libraryBooks.splice(index, 1);
				}
				
				this.deselectBook();
			}
		}
	}
</script>

<style>
	/* Styles are unchanged */
	page { background-color: #f8f8f8; }
	.custom-nav-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 99; background-color: #f8f8f8; padding-top: var(--status-bar-height); border-bottom: 1px solid #e5e5e5; }
	.nav-content { display: flex; justify-content: space-between; align-items: center; height: 44px; padding: 0 10px; }
	.nav-left { flex-shrink: 0; display: flex; align-items: center; padding: 0 8px; cursor: pointer; }
	.nav-center { display: flex; justify-content: center; align-items: center; flex-grow: 1; }
	.nav-item { padding: 0 12px; font-size: 16px; color: #666; font-weight: 500; }
	.nav-item.active { color: #333; font-weight: 700; }
	.nav-right { display: flex; align-items: center; flex-shrink: 0; }
	.nav-search-bar { width: 120px; }
	.content { padding-top: calc(var(--status-bar-height) + 45px); }
	
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
</style>