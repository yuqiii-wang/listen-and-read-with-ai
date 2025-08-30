<template>
	<view class="history-versions-container">
		<!-- 1. History Versions Menu Option -->
		<view class="menu-option" @click="toggleHistory">
			<text>History Versions</text>
			<uni-icons :type="isHistoryExpanded ? 'up' : 'down'" size="20" color="#666"></uni-icons>
		</view>

		<!-- 2. Collapsible list of history items -->
		<view v-if="isHistoryExpanded" class="history-list" @touchmove.stop.prevent="dragMove" @touchend="dragEnd" @touchcancel="dragEnd">
			<view v-if="book.history && book.history.length > 0">
				<view v-for="(item, index) in book.history" :key="item.id" :class="['history-item', { 'drop-target': index === dropTargetIndex }]" :data-index="index" :style="{ opacity: isDragging && draggedItemIndex === index ? 0.3 : 1 }">
					<!-- Item Info -->
					<text class="history-item-info">{{ item.timestamp }} - {{ item.taskName }}</text>

					<!-- Action Icons Container -->
					<view class="history-item-actions">
						<!-- Drag Handle -->
						<view class="drag-handle" @touchstart.stop="dragStart($event, item, index)" @longpress.stop="dragStart($event, item, index)">
							<uni-icons type="bars" size="22" color="#999"></uni-icons>
						</view>
						<!-- Delete Icon -->
						<uni-icons type="trash" size="20" color="#e43d33" @click="confirmDeleteHistory(item)"></uni-icons>
					</view>
				</view>
			</view>
			<view v-else>
				<text class="no-history-message">No history available.</text>
			</view>

			<!-- Draggable Clone Item - This element follows the user's finger -->
			<view v-if="isDragging && draggedItem" class="history-item-clone" :style="{ top: clonePosition.y + 'px', left: clonePosition.x + 'px' }">
				<text class="history-item-info">{{ draggedItem.timestamp }} - {{ draggedItem.taskName }}</text>
				<view class="history-item-actions">
					<uni-icons type="bars" size="22" color="#999"></uni-icons>
					<uni-icons type="trash" size="20" color="#e43d33"></uni-icons>
				</view>
			</view>

		</view>
	</view>
</template>

<script>
	export default {
		name: 'BookHistoryVersions',
		props: {
			book: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				isHistoryExpanded: false,
				// Drag and Drop State
				isDragging: false,
				draggedItem: null,
				draggedItemIndex: -1,
				dropTargetIndex: -1,
				itemRects: [], // To store dimensions of each history item
				clonePosition: {
					x: 0,
					y: 0
				},
				touchOffset: {
					x: 0,
					y: 0
				}
			};
		},
		methods: {
			toggleHistory() {
				this.isHistoryExpanded = !this.isHistoryExpanded;
				// When opening, get the positions of the items
				if (this.isHistoryExpanded) {
					this.$nextTick(() => {
						this.cacheItemRects();
					});
				}
			},

			// --- Drag and Drop Methods ---

			cacheItemRects() {
				const query = uni.createSelectorQuery().in(this);
				query.selectAll('.history-item').boundingClientRect(data => {
					this.itemRects = data;
				}).exec();
			},

			dragStart(event, item, index) {
				// Prevent starting a new drag if one is already in progress
				if (this.isDragging) return;

				// Cache item positions right before drag starts
				this.cacheItemRects();

				this.isDragging = true;
				this.draggedItem = item;
				this.draggedItemIndex = index;

				const touch = event.touches[0] || event.changedTouches[0];
				const startRect = this.itemRects[index];

				// Calculate offset from top-left corner of the item
				this.touchOffset.x = touch.clientX - startRect.left;
				this.touchOffset.y = touch.clientY - startRect.top;

				// Set initial clone position
				this.clonePosition.x = touch.clientX - this.touchOffset.x;
				this.clonePosition.y = touch.clientY - this.touchOffset.y;
			},

			dragMove(event) {
				if (!this.isDragging) return;

				const touch = event.touches[0] || event.changedTouches[0];
				this.clonePosition.x = touch.clientX - this.touchOffset.x;
				this.clonePosition.y = touch.clientY - this.touchOffset.y;

				// Collision Detection
				const draggedRect = {
					left: this.clonePosition.x,
					top: this.clonePosition.y,
					right: this.clonePosition.x + this.itemRects[this.draggedItemIndex].width,
					bottom: this.clonePosition.y + this.itemRects[this.draggedItemIndex].height,
					width: this.itemRects[this.draggedItemIndex].width,
					height: this.itemRects[this.draggedItemIndex].height,
				};

				let foundTarget = -1;
				for (let i = 0; i < this.itemRects.length; i++) {
					// Don't compare with itself
					if (i === this.draggedItemIndex) continue;

					const staticRect = this.itemRects[i];
					const overlap = this.calculateOverlap(draggedRect, staticRect);

					if (overlap >= 0.65) {
						foundTarget = i;
						break;
					}
				}
				this.dropTargetIndex = foundTarget;
			},

			dragEnd() {
				if (!this.isDragging) return;

				// If a valid drop target was highlighted
				if (this.dropTargetIndex !== -1) {
					const sourceItem = this.draggedItem;
					const targetItem = this.book.history[this.dropTargetIndex];
					this.confirmMerge(sourceItem, targetItem);
				}

				// Reset all state
				this.isDragging = false;
				this.draggedItem = null;
				this.draggedItemIndex = -1;
				this.dropTargetIndex = -1;
			},

			calculateOverlap(rect1, rect2) {
				const x_overlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
				const y_overlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
				const overlapArea = x_overlap * y_overlap;
				// Calculate overlap percentage relative to the smaller of the two items
				const smallerArea = Math.min(rect1.width * rect1.height, rect2.width * rect2.height);
				return smallerArea > 0 ? overlapArea / smallerArea : 0;
			},

			confirmMerge(sourceItem, targetItem) {
				uni.showModal({
					title: 'Confirm Merge',
					content: `Are you sure you want to merge "${sourceItem.taskName}" into "${targetItem.taskName}"? This action cannot be undone.`,
					success: (res) => {
						if (res.confirm) {
							console.log("Merge confirmed:", sourceItem, "->", targetItem);
							// Here you would emit an event to the parent to handle the actual data merge
							// this.$emit('history-merged', { sourceId: sourceItem.id, targetId: targetItem.id });
							uni.showToast({
								title: 'Items merged!',
								icon: 'success'
							});
						}
					}
				});
			},


			// --- Existing Methods ---

			confirmDeleteHistory(historyItem) {
				uni.showModal({
					title: 'Delete History',
					content: `Delete the history item "${historyItem.taskName}" from ${historyItem.timestamp}?`,
					success: (res) => {
						if (res.confirm) {
							this.deleteHistoryItem(historyItem.id);
						}
					}
				});
			},

			deleteHistoryItem(historyId) {
				const updatedHistory = this.book.history.filter(item => item.id !== historyId);
				this.$emit('history-updated', updatedHistory);

				uni.showToast({
					title: 'History item deleted',
					icon: 'success'
				});
			}
		}
	}
</script>

<style>
	.history-versions-container { width: 100%; }
	.menu-option { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 15px; color: #333; cursor: pointer; border-bottom: 1px solid #eee; }
	.history-list { display: flex; flex-direction: column; gap: 8px; padding-left: 10px; margin-top: 10px; position: relative; }
	.history-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #555; padding: 8px; border: 2px solid transparent; border-radius: 4px; background-color: #fff; }
	.history-item-info { flex: 1; }
	.history-item-actions { display: flex; align-items: center; gap: 10px; }
	.drag-handle { cursor: grab; padding: 0 5px; }
	.no-history-message { font-size: 14px; color: #888; }
	.history-item-clone { position: fixed; z-index: 1000; background-color: #f0f0f0; box-shadow: 0 4px 10px rgba(0,0,0,0.2); pointer-events: none; opacity: 0.95; padding: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #555; width: 100%; max-width: 300px; /* Adjust width as needed */ }
	.drop-target { border: 2px solid #007aff !important; font-weight: bold; }
</style>