<template>
	<view class="book-basic-info-overlay" @click.self="close">
		<view class="book-basic-info-container">
			<image class="book-cover" :src="cover" mode="aspectFill"></image>
			
			<text class="book-title">{{ title }}</text>
			
			<view class="tags-container">
				<text v-for="(tag, index) in tags" :key="index" class="tag">{{ tag }}</text>
			</view>
			
			<view class="summary-container">
				<text class="summary-title">Summary </text>
				<text class="summary-content">{{ summary }}</text>
			</view>

			<view class="button-group">
				<button class="action-btn add-btn" @click="addToLibrary" :disabled="isAdded">
					{{ isAdded ? 'Added to Library' : 'Add to Library' }}
				</button>
				<button class="action-btn cancel-btn" @click="close">Cancel</button>
			</view>
		</view>
	</view>
</template>

<script>
	import settingsService from '@/services/settingsService';

	export default {
		// MODIFIED: Component name added
		name: 'BookMarketInfo',
		props: {
			// MODIFIED: Renamed 'marketId' to 'bookId'
			bookId: { type: [String, Number], required: true },
			userBookId: { type: [String, Number], default: '' },
			cover: { type: String, default: '' },
			title: { type: String, default: 'No Title' },
			tags: { type: Array, default: () => [] },
			tagsHide: { type: Array, default: () => [] },
			summary: { type: String, default: 'No summary available.' }
		},
		data() {
			return {
				isAdded: false
			};
		},
		watch: {
			// MODIFIED: Watcher now observes 'bookId'
			bookId: {
				handler(newId) {
					if (newId) {
						this.isAdded = settingsService.isBookInLibrary(newId);
					}
				},
				immediate: true
			}
		},
		methods: {
			addToLibrary() {
				const bookData = {
					// MODIFIED: Changed property from 'marketId' to 'bookId'
					bookId: this.bookId,
					title: this.title,
					cover: this.cover,
					tags: this.tags,
					tagsHide: this.tagsHide,
					summary: this.summary
				};
				settingsService.addBookToLibrary(bookData);
				this.isAdded = true;
				uni.showToast({
					title: 'Added to library!',
					icon: 'success'
				});
				this.$emit('added');
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
		background-color: white;
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
		background-color: #eee;
		color: #555;
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
		color: #333;
		margin-bottom: 8px;
	}

	.summary-content {
		font-size: 14px;
		color: #666;
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
		background-color: #007AFF;
		color: white;
	}
	
	.add-btn:disabled {
		background-color: #a0cfff;
		cursor: not-allowed;
	}

	.cancel-btn {
		background-color: #f2f2f2;
		color: #333;
	}
</style>