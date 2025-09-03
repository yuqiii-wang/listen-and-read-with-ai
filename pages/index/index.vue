<template>
	<!-- Main container with dynamic theme styles -->
	<view class="container" :style="{ backgroundColor: themeStyles.backgroundColor, color: themeStyles.primaryTextColor }">
		<!-- Sidebar Drawer -->
		<uni-drawer ref="sidebarDrawer" mode="left" :mask-click="true" @close="closeSidebar">
			<sidebar-profile></sidebar-profile>
		</uni-drawer>

		<!-- Top Navigation Bar with dynamic theme -->
		<view class="custom-nav-bar" :style="{ backgroundColor: themeStyles.navBar?.backgroundColor, borderBottom: `1px solid ${themeStyles.borderColor}` }">
			<view class="nav-content">
				<view class="nav-left" @click="openSidebar">
					<uni-icons :type="profileIconType" size="24" :color="themeStyles.secondaryTextColor"></uni-icons>
				</view>
				<view class="nav-center">
					<text 
						class="nav-item" 
						:class="{ active: activeTab === 'library' }" 
						:style="{ color: activeTab === 'library' ? themeStyles.tabBar?.activeTextColor : themeStyles.tabBar?.textColor }"
						@click="switchTab('library')">
						Library
					</text>
					<text 
						class="nav-item" 
						:class="{ active: activeTab === 'market' }" 
						:style="{ color: activeTab === 'market' ? themeStyles.tabBar?.activeTextColor : themeStyles.tabBar?.textColor }"
						@click="switchTab('market')">
						Book Market
					</text>
				</view>
				<view class="nav-right" @click="openSearchModal">
					<uni-search-bar
						class="nav-search-bar"
						@confirm="search"
						v-model="searchValue"
						cancelButton="none"
						clearButton="auto"
						placeholder="Search books"
						radius="100"
						:disabled="true">
					</uni-search-bar>
				</view>
			</view>
		</view>

		<!-- Main Content -->
		<view class="content">
			<library-shelf
				v-if="activeTab === 'library'"
				:library-books="libraryBooks"
				@libraryUpdated="loadBooks">
			</library-shelf>

			<book-market
				v-if="activeTab === 'market'"
				:market-books="marketBooks"
				@bookSelected="openBookMarketInfo">
			</book-market>
		</view>

		<!-- Book Market Info Modal -->
		<book-market-info
			v-if="selectedMarketBook"
			:bookId="selectedMarketBook.bookId"
			:cover="selectedMarketBook.cover"
			:title="selectedMarketBook.title"
			:tags="selectedMarketBook.tags"
			:summary="selectedMarketBook.summary"
			@close="closeBookMarketInfo"
			@added="onBookAdded">
		</book-market-info>

		<!-- Search Modal Component -->
		<search-modal ref="searchModal" @confirm="handleSearchConfirm"></search-modal>
	</view>
</template>

<script>
	import SidebarProfile from '@/components/SidebarProfile.vue';
	import BookMarketInfo from '@/components/BookMarketInfo.vue';
	import LibraryShelf from '@/components/LibraryShelf.vue';
	import BookMarket from '@/components/BookMarket.vue';
	import SearchModal from '@/components/SearchModal.vue';

	// Import the new services
	import bookCacheService from '@/services/BookCacheService';
	import settingsCacheService from '@/services/settingsCacheService';
	
	export default {
		components: {
			SidebarProfile,
			BookMarketInfo,
			LibraryShelf,
			BookMarket,
			SearchModal
		},
		data() {
			return {
				activeTab: 'library',
				searchValue: '',
				profileIconType: 'person',
				selectedMarketBook: null, // Will hold a BookMetadata object
				libraryBooks: [], // Will hold a list of BookMetadata objects
				marketBooks: [], // Will hold a list of BookMetadata objects
				themeStyles: {} // To hold the dynamic theme styles
			}
		},
		onShow() {
			// Load books and theme every time the page is shown
			this.loadTheme();
			this.loadBooks();
		},
		methods: {
			/**
			 * Loads the current theme from the settings service and applies it.
			 */
			loadTheme() {
				const settings = settingsCacheService.getSettings();
				this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
			},

			/**
			 * Fetches all book lists from the BookCacheService.
			 * Aligns with the defined data model.
			 */
			loadBooks() {
				const allBooksMetadata = bookCacheService.getAllBooks(); // This initializes data if it doesn't exist
				
				// Load Library Books
				const libraryBookIds = bookCacheService.getLibraryBooks();
				this.libraryBooks = allBooksMetadata.filter(book => libraryBookIds.includes(book.bookId));

				// Load Market Books
				const marketBookIds = bookCacheService.getMarketBooks();
				this.marketBooks = allBooksMetadata.filter(book => marketBookIds.includes(book.bookId));
			},

			switchTab(tab) {
				this.activeTab = tab;
			},

			search(res) {
				uni.showToast({ title: 'Search: ' + res.value, icon: 'none' });
			},

			openSidebar() {
			  this.$refs.sidebarDrawer.open();
			  this.profileIconType = 'person-filled';
			},

			closeSidebar() {
			  this.profileIconType = 'person';
			},

			/**
			 * Opens the book info modal.
			 * @param {BookMetadata} book The selected book metadata object.
			 */
			openBookMarketInfo(book) {
				this.selectedMarketBook = book;
			},

			closeBookMarketInfo() {
				this.selectedMarketBook = null;
			},
			
			/**
			 * Handles the event after a book is successfully added to the library.
			 */
			onBookAdded() {
				this.loadBooks(); // Reload all book lists to reflect the change
				this.closeBookMarketInfo();
			},

			openSearchModal() {
				this.$refs.searchModal.open(this.searchValue);
			},

			handleSearchConfirm(newSearchValue) {
				this.searchValue = newSearchValue;
				this.search({ value: this.searchValue });
			}
		}
	}
</script>

<style>
	/* Keep structural and non-color styles. Colors are now handled dynamically. */
	.custom-nav-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 99;
		padding-top: var(--status-bar-height);
	}
	
	.nav-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 44px;
		padding: 0 10px;
	}
	
	.nav-left {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 0 8px;
		cursor: pointer;
	}
	
	.nav-center {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-grow: 1;
	}
	
	.nav-item {
		padding: 0 12px;
		font-size: 16px;
		font-weight: 500;
		transition: color 0.3s; /* Smooth transition for color change */
	}
	
	.nav-item.active {
		font-weight: 700;
	}
	
	.nav-right {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	
	.nav-search-bar {
		width: 120px;
	}
	
	.content {
		padding-top: calc(var(--status-bar-height) + 45px);
	}
</style>