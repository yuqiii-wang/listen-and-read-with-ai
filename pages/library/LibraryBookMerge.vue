<template>
	<view class="reader-container" :style="readerStyles" @click="hideActionMenu">
		<scroll-view scroll-y class="content-scroll" ref="scrollView" :scroll-top="scrollTop">
			<view class="book-content">
				<text class="book-title-header" :style="{ color: theme.textColor }">{{ bookTitle }}</text>
				<view class="book-text" :style="bookTextStyle">
					<rich-text :nodes="animatedContent"></rich-text>
				</view>
			</view>
		</scroll-view>

		<!-- New Bottom Bar with Merge Actions -->
		<view class="bottom-bar-container" @click.stop>
			<!-- Action Menu Pop-up -->
			<view v-if="showActionMenu" class="action-menu">
				<view class="action-menu-item" @click="selectMergeAction('rewrite')">
					<text>Rewrite Content</text>
					<text v-if="selectedMergeAction === 'rewrite'" class="tick-mark">✓</text>
				</view>
				<view class="action-menu-item" @click="selectMergeAction('addBefore')">
					<text>Add Content Before</text>
					<text v-if="selectedMergeAction === 'addBefore'" class="tick-mark">✓</text>
				</view>
				<view class="action-menu-item" @click="selectMergeAction('addAfter')">
					<text>Add Content After</text>
					<text v-if="selectedMergeAction === 'addAfter'" class="tick-mark">✓</text>
				</view>
			</view>

			<view class="bar-content">
				<text class="action-text">{{ actionDescription }}</text>
				<view class="button-group">
					<!-- Corrected Button Order -->
					<button class="cancel-btn" @click="handleCancelMerge">Cancel</button>
					<button class="confirm-btn" @click="handleConfirmMerge">Confirm Merge</button>
					<button class="menu-btn" @click="toggleActionMenu">
						<uni-icons type="up" size="20" color="#FFFFFF"></uni-icons>
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import settingsService from '@/services/settingsService';
	import bookContentService from '@/services/bookContentService';

	const createNode = (type, content) => ({
		name: 'span',
		attrs: {
			class: `merge-${type}`
		},
		children: [{
			type: 'text',
			text: content + ' '
		}]
	});

	export default {
		components: {},
		props: {
			bookId: [String, Number],
			sourceVersionId: [String, Number],
			targetVersionId: [String, Number],
			mergeAction: String,
			mergeStartSentencePos: String
		},
		data() {
			return {
				bookTitle: 'Preparing Merge...',
				scrollTop: 0,
				fontSize: 16,
				theme: { name: 'White', color: '#FFFFFF', textColor: '#333333' },
				animationTimer: null,
				animationPhase: 'original',
				originalNodes: [],
				diffNodes: [],
				mergedNodes: [],
				showActionMenu: false,
				selectedMergeAction: 'rewrite', // Default action
			};
		},
		computed: {
			animatedContent() {
				switch (this.animationPhase) {
					case 'diff': return this.diffNodes;
					case 'merged': return this.mergedNodes;
					default: return this.originalNodes;
				}
			},
			readerStyles() { return { backgroundColor: this.theme.color }; },
			bookTextStyle() {
				return {
					fontSize: `${this.fontSize}px`, color: this.theme.textColor,
					lineHeight: 1.8, whiteSpace: 'pre-wrap',
				};
			},
			actionDescription() {
				switch (this.selectedMergeAction) {
					case 'rewrite': return 'Action: Rewrite sentence';
					case 'addBefore': return 'Action: Insert before sentence';
					case 'addAfter': return 'Action: Append after sentence';
					default: return 'Select an action';
				}
			}
		},
		onLoad(options) {
			this.selectedMergeAction = this.mergeAction || 'rewrite';
			this.loadAndApplySettings();
			this.generateMergePreview();
			this.startAnimation();
		},
		onUnload() {
			this.stopAnimation();
		},
		methods: {
			generateMergePreview() {
				const bookData = bookContentService.getBookById(this.bookId);
				if (!bookData) { this.bookTitle = "Error: Book not found."; return; }

				const sourceVersion = parseInt(this.sourceVersionId, 10);
				const targetVersion = parseInt(this.targetVersionId, 10);

				const sourceSentences = bookData.bookAllContents.filter(s => s.version === sourceVersion);
				const baseSentences = bookData.bookAllContents.filter(s => s.version === targetVersion);
				console.log(baseSentences);
				const incomingContent = sourceSentences.map(s => s.content).join(' ');

				const mergePos = parseInt(this.mergeStartSentencePos, 10);
				const mergeIndex = baseSentences.findIndex(s => s.sentenceId === mergePos);

				if (mergeIndex === -1) { this.bookTitle = "Error: Merge position not found."; return; }

				this.bookTitle = `Previewing Merge: v${sourceVersion} into v${targetVersion}`;

				// 1. Original View
				this.originalNodes = baseSentences.map(s => createNode('normal', s.content));

				// 2. Diff View
				const diffNodes = [];
				baseSentences.forEach((sentence, index) => {
					if (index === mergeIndex) {
						if (this.selectedMergeAction === 'addBefore') {
							diffNodes.push(createNode('added', incomingContent));
							diffNodes.push(createNode('normal', sentence.content));
						} else if (this.selectedMergeAction === 'addAfter') {
							diffNodes.push(createNode('normal', sentence.content));
							diffNodes.push(createNode('added', incomingContent));
						} else { // 'rewrite'
							diffNodes.push(createNode('deleted', sentence.content));
							diffNodes.push(createNode('added', incomingContent));
						}
					} else {
						diffNodes.push(createNode('normal', sentence.content));
					}
				});
				this.diffNodes = diffNodes;

				// 3. Merged View
				const mergedNodes = [];
				baseSentences.forEach((sentence, index) => {
					if (index === mergeIndex) {
						if (this.selectedMergeAction === 'addBefore') {
							mergedNodes.push(createNode('normal', incomingContent));
							mergedNodes.push(createNode('normal', sentence.content));
						} else if (this.selectedMergeAction === 'addAfter') {
							mergedNodes.push(createNode('normal', sentence.content));
							mergedNodes.push(createNode('normal', incomingContent));
						} else { // 'rewrite'
							mergedNodes.push(createNode('normal', incomingContent));
						}
					} else {
						mergedNodes.push(createNode('normal', sentence.content));
					}
				});
				this.mergedNodes = mergedNodes;
			},

			startAnimation() {
				this.stopAnimation();
				this.animationTimer = setInterval(() => {
					this.animationPhase = this.animationPhase === 'original' ? 'diff' : (this.animationPhase === 'diff' ? 'merged' : 'original');
				}, 2000);
			},

			stopAnimation() { if (this.animationTimer) clearInterval(this.animationTimer); },

			loadAndApplySettings() {
				const settings = settingsService.getSettings();
				this.fontSize = settings.fontSize || 16;
				this.applyTheme(settings.background || { name: 'White', color: '#FFFFFF' });
			},

			applyTheme(themeSetting) {
				this.theme = {
					...themeSetting,
					textColor: themeSetting.name === 'Black' ? '#e0e0e0' : (themeSetting.name === 'Light Brown' ? '#5c4033' : '#333333')
				};
			},
			toggleActionMenu() {
				this.showActionMenu = !this.showActionMenu;
			},
			
			hideActionMenu() {
				if (this.showActionMenu) {
					this.showActionMenu = false;
				}
			},

			selectMergeAction(action) {
				this.selectedMergeAction = action;
				this.showActionMenu = false;
				this.generateMergePreview(); // Regenerate preview with the new action
			},

			handleCancelMerge() {
				const bookData = bookContentService.getBookById(this.bookId);
				if (bookData) {
					uni.navigateTo({
						url: `/pages/library/LibraryBook?id=${this.bookId}&title=${encodeURIComponent(bookData.title)}`
					});
				} else {
					uni.navigateBack();
				}
			},
			
			handleConfirmMerge() {
				const bookData = bookContentService.getBookById(this.bookId);
				if (!bookData) {
					uni.showToast({ title: 'Error: Book data not found.', icon: 'none' });
					return;
				}

				const sourceVersion = parseInt(this.sourceVersionId, 10);
				const targetVersion = parseInt(this.targetVersionId, 10);
				const allVersionIds = bookData.history.map(h => h.id);
				const newVersionId = (allVersionIds.length > 0 ? Math.max(...allVersionIds) : 0) + 1;
				const mergedContent = this.mergedNodes.map(node => node.children[0].text).join('').trim();
				const maxSentenceId = Math.max(...bookData.bookAllContents.map(s => s.sentenceId)) || 0;
				
				const newSentence = {
					sentenceId: maxSentenceId + 1,
					audioId: -1,
					version: newVersionId,
					content: mergedContent,
				};

				const newBookAllContents = bookData.bookAllContents
					.filter(s => s.version !== sourceVersion && s.version !== targetVersion)
					.concat(newSentence);

				const newHistory = bookData.history
					.filter(h => h.id !== sourceVersion && h.id !== targetVersion)
					.concat({
						id: newVersionId,
						taskName: `Merged v${sourceVersion} & v${targetVersion}`,
						timestamp: new Date().toLocaleString()
					});

				const updatedBookData = {
					...bookData,
					version: newVersionId,
					versionCreatedAt: Date.now(),
					history: newHistory,
					bookAllContents: newBookAllContents,
				};

				bookContentService.saveBook(this.bookId, updatedBookData);
				uni.showToast({ title: `Created new version ${newVersionId}`, icon: 'success' });

				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			},
		}
	}
</script>

<style>
	/* Animation styles */
	.merge-normal { display: inline; }
	.merge-added { background-color: #d4edda; color: #155724; border-radius: 4px; padding: 1px 3px; }
	.merge-deleted { background-color: #f8d7da; color: #721c24; text-decoration: line-through; border-radius: 4px; padding: 1px 3px;}
</style>

<style scoped>
	.reader-container { height: 100vh; }
	.content-scroll { height: 100vh; }
	.book-content { padding: 20px; padding-top: calc(var(--status-bar-height) + 20px); padding-bottom: calc(var(--safe-area-inset-bottom) + 100px); }
	.book-title-header { display: block; font-size: 24px; font-weight: bold; margin-bottom: 20px; }

	/* --- Bottom Bar Styles --- */
	.bottom-bar-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #f7f7f7;
		border-top: 1px solid #e0e0e0;
		padding-bottom: var(--safe-area-inset-bottom);
		z-index: 100;
	}

	.bar-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 15px;
		height: 60px;
	}

	.action-text {
		font-size: 14px;
		color: #555;
		margin-right: 10px; /* Add some space between text and buttons */
	}

	.button-group {
		display: flex;
		align-items: stretch; /* Makes buttons same height */
	}

	/* --- Corrected Button Styles --- */
	.cancel-btn {
		background-color: #8e8e93 !important; /* A neutral grey color */
		color: white !important;
		font-size: 16px;
		height: 40px;
		line-height: 40px;
		padding: 0 20px;
		margin: 0;
		border-radius: 8px 0 0 8px; /* Rounded left corners */
	}

	.confirm-btn {
		background-color: #007aff !important;
		color: white !important;
		font-size: 16px;
		height: 40px;
		line-height: 40px;
		padding: 0 20px;
		margin: 0;
		border-radius: 0; /* No rounded corners as it's in the middle */
		border-left: 1px solid rgba(255, 255, 255, 0.25); /* Subtle separator */
	}

	.menu-btn {
		background-color: #0056b3 !important;
		width: 40px;
		height: 40px;
		padding: 0;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0 8px 8px 0; /* Rounded right corners */
		border-left: 1px solid rgba(255, 255, 255, 0.25); /* Subtle separator */
	}

	/* --- Action Menu Styles --- */
	.action-menu {
		position: absolute;
		bottom: 75px; /* Position above the bar */
		right: 15px;
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		overflow: hidden;
		width: 200px;
	}

	.action-menu-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 15px;
		font-size: 15px;
		color: #333;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
	}
	
	.tick-mark {
		color: #007aff;
		font-weight: bold;
	}

	.action-menu-item:last-child {
		border-bottom: none;
	}

	.action-menu-item:active {
		background-color: #f5f5f5;
	}
</style>