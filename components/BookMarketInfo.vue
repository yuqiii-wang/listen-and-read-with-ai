<template>
	<view class="book-basic-info-overlay" @click.self="close">
		<view class="book-basic-info-container" :style="containerStyle">
			<image class="book-cover" :src="cover" mode="aspectFill"></image>
			
			<text class="book-title">{{ title }}</text>
			
			<view class="tags-container">
				<text v-for="(tag, index) in tags" :key="index" class="tag" :style="tagStyle">{{ tag }}</text>
			</view>
			
			<view class="summary-container">
				<text class="summary-title" :style="summaryTitleStyle">Summary </text>
				<text class="summary-content" :style="summaryContentStyle">{{ summary }}</text>
			</view>

			<view class="button-group">
				<button class="action-btn add-btn" @click="addToLibrary" :disabled="isAdded" :style="addButtonStyle">
					{{ isAdded ? 'Added to Library' : 'Add to Library' }}
				</button>
				<button class="action-btn cancel-btn" @click="close" :style="cancelButtonStyle">Cancel</button>
			</view>
		</view>
	</view>
</template>

<script>
	// ALIGNED: Import the correct BookCacheService
	import bookCacheService from '@/services/BookCacheService';
	import settingsCacheService from '@/services/settingsCacheService';

	export default {
		name: 'BookMarketInfo',
		props: {
			bookId: { type: [String, Number], required: true },
			cover: { type: String, default: '' },
			title: { type: String, default: 'No Title' },
			tags: { type: Array, default: () => [] },
			summary: { type: String, default: 'No summary available.' }
		},
		data() {
			return {
				isAdded: false,
				themeStyles: {}
			};
		},
		created() {
			this.loadTheme();
		},
		watch: {
			bookId: {
				handler(newId) {
					if (newId) {
						// ALIGNED: Check if book is in library using BookCacheService
						const libraryBooks = bookCacheService.getLibraryBooks();
						this.isAdded = libraryBooks.includes(parseInt(newId, 10));
					}
				},
				immediate: true
			}
		},
		computed: {
			containerStyle() {
				return {
					backgroundColor: this.themeStyles.backgroundColor,
					color: this.themeStyles.primaryTextColor
				};
			},
			summaryTitleStyle() {
				return {
					color: this.themeStyles.primaryTextColor
				};
			},
			summaryContentStyle() {
				return {
					color: this.themeStyles.secondaryTextColor
				};
			},
			tagStyle() {
				return {
					backgroundColor: this.themeStyles.input?.backgroundColor || '#eee',
					color: this.themeStyles.input?.textColor || '#555'
				};
			},
			addButtonStyle() {
				return {
					backgroundColor: this.themeStyles.button?.backgroundColor || '#007AFF',
					color: this.themeStyles.button?.textColor || 'white'
				};
			},
			cancelButtonStyle() {
				return {
					backgroundColor: this.themeStyles.input?.backgroundColor || '#f2f2f2',
					color: this.themeStyles.input?.textColor || '#333'
				};
			}
		},
		methods: {
			loadTheme() {
				const settings = settingsCacheService.getSettings();
				this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
			},
			addToLibrary() {
				// ALIGNED: Use BookCacheService to add book to library
				const success = bookCacheService.addBookToLibrary(parseInt(this.bookId, 10));
				if (success) {
					this.isAdded = true;
					uni.showToast({
						title: 'Added to library!',
						icon: 'success'
					});
					this.$emit('added');
				} else {
					uni.showToast({
						title: 'Failed to add to library',
						icon: 'none'
					});
				}
			},
			close() {
				this.$emit('close');
			}
		}
	}
</script>

<style>
	.book-basic-info-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.book-basic-info-container {
		padding: 20px;
		border-radius: 10px;
		width: 80%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	.book-cover {
		width: 120px;
		height: 160px;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 15px;
	}
	
	.book-title {
		font-size: 20px;
		font-weight: bold;
		margin-bottom: 10px;
		text-align: center;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
		overflow-wrap: break-word;
	}

	.tags-container {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 15px;
	}

	.tag {
		padding: 5px 10px;
		border-radius: 15px;
		margin: 5px;
		font-size: 12px;
	}

	.summary-container {
		align-self: flex-start;
		width: 100%;
		margin-bottom: 20px;
	}

	.summary-title {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.summary-content {
		font-size: 14px;
		line-height: 1.5;
	}

	.button-group {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.action-btn {
		flex: 1;
		margin: 0 5px;
		border: none;
		border-radius: 5px;
		padding: 10px 0;
		cursor: pointer;
		font-size: 16px;
	}

	.add-btn {
	}
	
	.add-btn:disabled {
		background-color: #a0cfff;
		cursor: not-allowed;
	}

	.cancel-btn {
	}
</style>