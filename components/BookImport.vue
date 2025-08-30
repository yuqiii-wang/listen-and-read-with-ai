<template>
	<view>
		<view v-if="isOpen" class="sidebar-overlay" @click="closeSidebar"></view>

		<view class="book-import-sidebar" :class="{ 'is-open': isOpen }" @click.stop>
			<view class="sidebar-content">
				<view class="sidebar-header">
					<text class="sidebar-title">Import New Document</text>
					<uni-icons type="close" size="24" color="#666" @click="closeSidebar"></uni-icons>
				</view>

				<!-- Dynamically rendered list of import options -->
				<view class="import-options">
					<view v-for="option in importOptions" :key="option.id">
						<!-- Render the special component for local image import -->
						<book-import-from-image 
							v-if="option.id === 'local-image'"
							@file-selected="uploadFile" 
						/>
						<!-- Render disabled options for the rest -->
						<view v-else class="import-option-disabled">
							<text>{{ option.name }} (coming soon)</text>
						</view>
					</view>
				</view>

				<!-- The upload progress is now managed by the parent -->
				<view v-if="uploading" class="upload-progress-container">
					<progress :percent="uploadProgress" show-info stroke-width="3" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import BookImportFromImage from './book_import_src/BookImportFromImage.vue';

	export default {
		name: "BookImport",
		components: {
			BookImportFromImage
		},
		props: {
			isOpen: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				// State for uploading is moved back to the parent
				uploading: false,
				uploadProgress: 0,
				// Data source for the list
				importOptions: [{
						id: 'local-image',
						name: 'Local Image',
						enabled: true
					},
					{
						id: 'google-drive',
						name: 'Google Drive',
						enabled: false
					},
					{
						id: 'one-drive',
						name: 'One Drive',
						enabled: false
					},
					{
						id: 'baidu-yun',
						name: 'Baidu Yun',
						enabled: false
					},
				]
			};
		},
		methods: {
			closeSidebar() {
				this.$emit('close');
			},
			
			// The upload logic is handled here, triggered by the child component
			uploadFile(file) {
				this.uploading = true;
				this.uploadProgress = 0;

				const uploadTask = uni.uploadFile({
					url: 'https://your-upload-api.com/upload', // Replace with your upload endpoint
					filePath: file.path,
					name: 'file',
					success: (uploadResult) => {
						const newBook = {
							marketId: `local-${new Date().getTime()}`,
							title: file.name || `New Book`,
							cover: file.path
						};
						this.$emit('upload-complete', newBook);
						uni.showToast({
							title: 'Import Complete!',
							icon: 'success'
						});
						this.closeSidebar();
					},
					fail: (err) => {
						uni.showToast({
							title: 'Upload failed',
							icon: 'none'
						});
						console.error("Upload failed", err);
					},
					complete: () => {
						this.uploading = false;
					}
				});

				uploadTask.onProgressUpdate((res) => {
					this.uploadProgress = res.progress;
				});
			}
		}
	}
</script>

<style scoped>
	/* Styles remain the same */
	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}

	.book-import-sidebar {
		position: fixed;
		top: 0;
		right: -320px;
		width: 300px;
		height: 100%;
		background-color: #fff;
		box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
		transition: right 0.3s ease;
		z-index: 1000;
	}

	.book-import-sidebar.is-open {
		right: 0;
	}

	.sidebar-content {
		padding: 20px;
	}

	.sidebar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.sidebar-title {
		font-size: 18px;
		font-weight: bold;
	}

	.import-options .import-option,
	.import-options .import-option-disabled {
		padding: 15px;
		border-bottom: 1px solid #eee;
		cursor: pointer;
	}

	.import-options .import-option:hover {
		background-color: #f7f7f7;
	}

	.import-option-disabled {
		color: #999;
		cursor: not-allowed;
	}

	.upload-progress-container {
		margin-top: 20px;
	}
</style>