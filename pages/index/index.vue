<template>
	<view class="container">
		<!-- Sidebar Drawer -->
		<uni-drawer ref="sidebarDrawer" mode="left" :mask-click="true" @close="closeSidebar">
			<sidebar-profile></sidebar-profile>
		</uni-drawer>

		<!-- Top Navigation Bar -->
		<view class="custom-nav-bar">
			<view class="nav-content">
				<view class="nav-left" @click="openSidebar">
					<uni-icons :type="profileIconType" size="24" color="#666"></uni-icons>
				</view>
				<view class="nav-center">
					<text class="nav-item" :class="{ active: activeTab === 'library' }" @click="switchTab('library')">Library</text>
					<text class="nav-item" :class="{ active: activeTab === 'market' }" @click="switchTab('market')">Book Market</text>
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
				@libraryUpdated="loadLibrary">
			</library-shelf>

			<book-market
				v-if="activeTab === 'market'"
				:market-books="marketBooks"
				@bookSelected="openBookBasicInfo">
			</book-market>
		</view>

		<book-basic-info
			v-if="selectedMarketBook"
			:marketId="selectedMarketBook.marketId"
			:cover="selectedMarketBook.cover"
			:title="selectedMarketBook.title"
			:tags="selectedMarketBook.tags"
			:summary="selectedMarketBook.summary"
			@close="closeBookBasicInfo"
			@added="onBookAdded">
		</book-basic-info>

		<!-- Use the new Search Modal Component -->
		<search-modal ref="searchModal" @confirm="handleSearchConfirm"></search-modal>
	</view>
</template>

<script>
	import SidebarProfile from '@/components/SidebarProfile.vue';
	import BookBasicInfo from '@/components/BookBasicInfo.vue';
	import settingsService from '@/services/settingsService';
	import LibraryShelf from '@/components/LibraryShelf.vue';
	import BookMarket from '@/components/BookMarket.vue';
	import BookManagement from '@/pages/index/BookManagement.vue';
	import SearchModal from '@/components/SearchModal.vue'; // 1. Import the new component

	export default {
		components: {
			SidebarProfile,
			BookBasicInfo,
			LibraryShelf,
			BookMarket,
			BookManagement,
			SearchModal // 2. Register the new component
		},
		data() {
			return {
				activeTab: 'library',
				searchValue: '',
				profileIconType: 'person',
				selectedMarketBook: null, // Manages the state for the popup
				libraryBooks: [],
				marketBooks: [
					{ id: 101, marketId: 101, cover: 'https://via.placeholder.com/150/FF0000/FFFFFF?Text=Market+A', title: 'Dune', tags: ['Sci-Fi', 'Adventure'], summary: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset.' },
					{ id: 102, marketId: 102, cover: 'https://via.placeholder.com/150/FFFF00/000000?Text=Market+B', title: 'Foundation', tags: ['Sci-Fi', 'Classic'], summary: 'A mathematician\'s revolutionary theory of psychohistory is put to the test on a galactic scale.' },
					{ id: 103, marketId: 103, cover: 'https://via.placeholder.com/150/008000/FFFFFF?Text=Market+C', title: 'Brave New World', tags: ['Dystopian', 'Sci-Fi'], summary: 'A futuristic society has achieved peace and stability through the prohibition of monogamy, privacy, money, family, and history itself.' },
					{ id: 1, marketId: 1, cover: 'https://via.placeholder.com/150/0000FF/808080?Text=Book+1', title: 'The Great Gatsby', tags: ['Classic', 'Fiction'], summary: 'The story of the mysteriously wealthy Jay Gatsby and his passion for the beautiful Daisy Buchanan.' },
					{ id: 2, marketId: 2, cover: 'https://via.placeholder.com/150/800080/FFFFFF?Text=Book+5', title: 'The Catcher in the Rye', tags: ['Classic', 'Fiction'], summary: 'A story about adolescent alienation and loss of innocence.' },
					{ id: 3, marketId: 3, cover: 'https://via.placeholder.com/150/FFA500/000000?Text=Book+6', title: 'The Hobbit', tags: ['Fantasy', 'Adventure'], summary: 'The adventure of hobbit Bilbo Baggins, who is swept into an epic quest to reclaim the lost Dwarf Kingdom of Erebor.' }
				]
			}
		},
		onShow() {
			this.loadLibrary();
		},
		methods: {
			loadLibrary() {
				this.libraryBooks = settingsService.getLibraryBooks();
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
			openBookBasicInfo(book) {
				this.selectedMarketBook = book;
			},
			closeBookBasicInfo() {
				this.selectedMarketBook = null;
			},
			onBookAdded() {
				this.loadLibrary();
				this.closeBookBasicInfo();
			},
			// --- Methods for Search Modal ---
			openSearchModal() {
				// Call the open method on the SearchModal component instance
				this.$refs.searchModal.open(this.searchValue);
			},
			handleSearchConfirm(newSearchValue) {
				// Update the search value and trigger the search
				this.searchValue = newSearchValue;
				this.search({ value: this.searchValue });
			}
		}
	}
</script>

<style>
	/* Global styles remain here */
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
</style>