<template>
	<view class="book-import-from-image">
		<view class="import-option" @click="confirmAndSelectFile">
			<text>Local Image</text>
		</view>

		<view v-if="uploading" class="upload-progress-container">
			<progress :percent="uploadProgress" show-info stroke-width="3" />
		</view>
	</view>
</template>

<script>
	export default {
		name: "BookImportFromImage",
		data() {
			return {
				uploading: false,
				uploadProgress: 0,
			};
		},
		methods: {
			confirmAndSelectFile() {
				uni.showModal({
					title: 'Confirm',
					content: 'The uploaded image will be processed to extract text info',
					success: (res) => {
						if (res.confirm) {
							this.selectAndUploadFile();
						}
					}
				});
			},

			selectAndUploadFile() {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						const tempFile = res.tempFiles[0];
						this.uploadFile(tempFile);
					},
					fail: (err) => {
						if (err.errMsg && !err.errMsg.includes("cancel")) {
							uni.showToast({
								title: "Selection failed",
								icon: "none"
							});
						}
					}
				});
			},

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
	.book-import-from-image {
		padding: 10px;
	}

	.import-option {
		padding: 15px;
		border: 1px solid #eee;
		border-radius: 5px;
		text-align: center;
		cursor: pointer;
		background-color: #f7f7f7;
	}

	.import-option:hover {
		background-color: #e9e9e9;
	}

	.upload-progress-container {
		margin-top: 20px;
	}
</style>