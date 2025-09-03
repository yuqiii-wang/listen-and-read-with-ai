<template>
	<scroll-view scroll-y class="history-versions-container" :style="containerStyle">
		<view class="details-content">
			<!-- 1. AI Task Section (Progress for multiple tasks) -->
			<view class="ai-section" v-if="hasActiveAITasks">
				<text class="section-label" :style="sectionLabelStyle">AI Task(s) In Progress:</text>
				<view v-for="task in activeAiTasks" :key="task.key" class="ai-in-progress-view">
					<text class="ai-task-name" :style="textStyle">{{ formatTaskKey(task.key) }}</text>
					<view class="progress-container">
						<progress :percent="task.progress" stroke-width="6" activeColor="#18BC37" backgroundColor="#EFEFEF" class="ai-progress-bar"></progress>
						<text class="ai-progress-label">{{ task.progress }}%</text>
					</view>
					<view class="action-buttons">
						<button class="cancel-btn" @click="$emit('cancel-ai-task', task.key)">Cancel</button>
						<button class="accelerate-btn" @click="$emit('accelerate-ai-task', task.key)">Accelerate</button>
					</view>
				</view>
			</view>

			<!-- 2. History Versions Section -->
			<view class="history-section">
				<text class="section-label">History Versions:</text>
				<view class="history-list" @touchmove="handleTouchMove" @touchend="dragEnd" @touchcancel="dragEnd">
					<view v-if="sortedHistory.length > 0">
						<view v-for="(item, index) in sortedHistory" :key="item.id" :class="['history-item', { 'drop-target': index === dropTargetIndex }]" :data-index="index" :style="[itemStyle, isDragging && draggedItemIndex === index ? { opacity: 0.3 } : {}]">
							<view class="current-version-indicator" @click="switchVersion(item)">
								<uni-icons v-if="item.id === currentVersionId" type="checkmarkempty" size="22" color="#007aff"></uni-icons>
								<uni-icons v-else type="checkmarkempty" size="22" color="#c0c0c0"></uni-icons>
							</view>
							<text class="history-item-info">
								<strong v-if="newVersionIds.includes(item.id)" class="new-version-label">NEW!</strong>
								{{ item.timestamp }} - {{ item.taskName }} (v{{ item.id }})
							</text>
							<view class="history-item-actions">
								<view class="drag-handle" @touchstart.stop="dragStart($event, item, index)">
									<uni-icons type="bars" size="22" color="#999"></uni-icons>
								</view>
								<uni-icons type="trash" size="20" color="#e43d33" @click="confirmDeleteHistory(item)"></uni-icons>
							</view>
						</view>
					</view>
					<view v-else>
						<text class="no-history-message">No history available.</text>
					</view>
					<view v-if="isDragging && draggedItem" class="history-item-clone" :style="{ top: clonePosition.y + 'px', left: clonePosition.x + 'px' }">
						<text class="history-item-info">{{ draggedItem.timestamp }} - {{ draggedItem.taskName }} (v{{ draggedItem.id }})</text>
					</view>
				</view>
			</view>
		</view>
	</scroll-view>
</template>

<script>
	export default {
		name: 'BookHistoryVersions',
		props: {
			allVersions: { type: Array, required: true },
			bookId: { type: [String, Number], required: true },
			currentVersionId: { type: Number, required: true },
			justCompletedAIVersions: { type: Array, default: () => [] },
			show: { type: Boolean, default: false },
			theme: { type: Object, required: true },
		},
		emits: ['switch-version', 'delete-version', 'cancel-ai-task', 'accelerate-ai-task', 'reset-just-completed-versions'],
		data() {
			return {
				newVersionIds: [],
				isDragging: false,
				draggedItem: null,
				draggedItemIndex: -1,
				dropTargetIndex: -1,
				itemRects: [],
				clonePosition: { x: 0, y: 0 },
				touchOffset: { x: 0, y: 0 }
			};
		},
		computed: {
			sortedHistory() {
				if (!this.allVersions) return [];
				const mapped = this.allVersions.map(v => ({
					id: v.version,
					taskName: v.taskName,
					timestamp: v.versionCreatedAt
				}));
				return mapped.reverse();
			},
			activeAiTasks() {
				if (!this.allVersions) return [];
				return this.allVersions.flatMap(version =>
					(version.aiTasksInProgress || []).map(task => ({
						...task,
						key: `${task.name}_v${task.newVersionId}`
					}))
				);
			},
			hasActiveAITasks() {
				return this.activeAiTasks.length > 0;
			},
			containerStyle() {
				const isDark = this.theme.name === 'Black';
				return {
					backgroundColor: isDark ? '#252525' : '#FFFFFF',
				};
			},
			textStyle() {
				return {
					color: this.theme.textColor,
				};
			},
			itemStyle() {
				const isDark = this.theme.name === 'Black';
				const backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9f9f9';
				const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0';
				return {
					color: this.theme.textColor,
					backgroundColor: backgroundColor,
					borderColor: borderColor,
				};
			},
			sectionLabelStyle() {
				return {
					color: this.theme.textColor,
					opacity: 0.8,
				};
			}
		},
		watch: {
			justCompletedAIVersions: {
				handler(newVersions) {
					if (newVersions && newVersions.length > 0) {
						uni.showToast({
							title: 'AI task completed!',
							icon: 'success'
						});
						const currentIds = new Set([...this.newVersionIds, ...newVersions]);
						this.newVersionIds = Array.from(currentIds);
						
						this.$emit('reset-just-completed-versions');
					}
				},
				immediate: true
			}
		},
		created() {
			if (this.justCompletedAIVersions.length > 0) {
				this.newVersionIds = [...this.justCompletedAIVersions];
			}
		},
		unmounted() {
			this.newVersionIds = [];
		},
		methods: {
			formatTaskKey(taskKey) {
				return taskKey.replace(/_/g, ' ');
			},
			switchVersion(historyItem) {
				if (historyItem.id === this.currentVersionId) return;
				this.$emit('switch-version', historyItem.id);
			},
			dragStart(event, item, index) {
				if (this.isDragging) return;
				uni.createSelectorQuery().in(this).selectAll('.history-item').boundingClientRect(rects => {
					if (!rects || !rects[index]) return;
					this.itemRects = rects;
					this.isDragging = true;
					this.draggedItem = item;
					this.draggedItemIndex = index;
					const touch = event.touches[0];
					const startRect = this.itemRects[index];
					this.touchOffset = { x: touch.clientX - startRect.left, y: touch.clientY - startRect.top };
					this.clonePosition = { x: startRect.left, y: startRect.top };
				}).exec();
			},
			handleTouchMove(event) {
				if (this.isDragging) {
					event.preventDefault();
					event.stopPropagation();
					this.dragMove(event);
				}
			},
			dragMove(event) {
				if (!this.isDragging) return;
				const touch = event.touches[0];
				this.clonePosition.x = touch.clientX - this.touchOffset.x;
				this.clonePosition.y = touch.clientY - this.touchOffset.y;
				const draggedRect = {
					left: this.clonePosition.x, top: this.clonePosition.y,
					right: this.clonePosition.x + (this.itemRects[this.draggedItemIndex]?.width || 0),
					bottom: this.clonePosition.y + (this.itemRects[this.draggedItemIndex]?.height || 0),
					width: this.itemRects[this.draggedItemIndex]?.width || 0,
					height: this.itemRects[this.draggedItemIndex]?.height || 0,
				};
				this.dropTargetIndex = this.itemRects.findIndex((rect, i) =>
					i !== this.draggedItemIndex && this.calculateOverlap(draggedRect, rect) >= 0.5
				);
			},
			dragEnd() {
				if (!this.isDragging) return;
				if (this.dropTargetIndex !== -1) {
					const sourceItem = this.draggedItem;
					const targetItem = this.sortedHistory[this.dropTargetIndex];
					if (sourceItem.id === targetItem.id) return;

					// MODIFIED: Use the 'bookId' prop
					uni.navigateTo({
						url: `/pages/library/LibraryBookMerge?id=${this.bookId}&sourceVersionId=${sourceItem.id}&targetVersionId=${targetItem.id}&mergeAction=rewrite&mergeStartSentencePos=1`
					});
				}
				this.isDragging = false;
				this.draggedItem = null;
				this.draggedItemIndex = -1;
				this.dropTargetIndex = -1;
			},
			calculateOverlap(r1, r2) {
				const x_overlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
				const y_overlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
				const overlapArea = x_overlap * y_overlap;
				const smallerArea = Math.min(r1.width * r1.height, r2.width * r2.height);
				return smallerArea > 0 ? overlapArea / smallerArea : 0;
			},
			confirmDeleteHistory(historyItem) {
				if (historyItem.id === this.currentVersionId) {
					uni.showToast({ title: 'Cannot delete active version.', icon: 'none' });
					return;
				}
				uni.showModal({
					title: 'Delete History',
					content: `Delete "${historyItem.taskName}"?`,
					success: (res) => {
						if (res.confirm) {
							this.$emit('delete-version', historyItem.id);
						}
					}
				});
			},
		}
	}
</script>

<style scoped>
	.history-versions-container {
		width: 100%;
		max-height: 50vh;
	}
	
	.details-content { display: flex; flex-direction: column; gap: 15px; padding: 10px 15px; }
	.section-label { display: block; font-size: 14px; margin-bottom: 8px; font-weight: 500; }
	
	.ai-section { padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
	.ai-in-progress-view { margin-bottom: 15px; }
	.ai-task-name { font-size: 14px; margin-bottom: 8px; }
	.progress-container { display: flex; align-items: center; gap: 10px; }
	.ai-progress-bar { flex: 1; }
	.ai-progress-label { font-size: 12px; }
	.action-buttons { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
	.action-buttons button { font-size: 14px; padding: 4px 12px; margin: 0; line-height: 1.5; }
	.cancel-btn { background-color: #f0f0f0 !important; color: #333 !important; }
	.accelerate-btn { background-color: #007aff !important; color: white !important; }

	.history-list { display: flex; flex-direction: column; gap: 8px; position: relative; padding-right: 5px; }
	.history-item { display: flex; align-items: center; font-size: 14px; padding: 10px 8px; border: 1px solid; border-radius: 6px; }
	.current-version-indicator { width: 30px; height: 30px; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-right: 5px; }
	.history-item-info { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.history-item-actions { display: flex; align-items: center; gap: 15px; padding-left: 10px; }
	.drag-handle { cursor: grab; }
	.no-history-message { font-size: 14px; padding: 10px 0; }
	.new-version-label { color: #18BC37; font-weight: bold; margin-right: 5px; }

	.history-item-clone { position: fixed; z-index: 1000; box-shadow: 0 5px 15px rgba(0,0,0,0.2); pointer-events: none; opacity: 0.95; padding: 10px 15px; border-radius: 6px; font-size: 14px; }
	.drop-target { border-color: #007aff !important; font-weight: bold; background-color: #e6f2ff; }
</style>