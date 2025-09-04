<template>
	<scroll-view scroll-y class="history-versions-container" :style="containerStyle">
		<view class="details-content">
			<!-- 1. AI Task Section (Progress for multiple tasks) -->
			<view class="ai-section" v-if="hasActiveAITasks">
				<text class="section-label" :style="sectionLabelStyle">AI Task(s) In Progress:</text>
				<view v-for="task in cachedActiveAiTasks" :key="task.id" class="ai-in-progress-view">
					<text class="ai-task-name" :style="textStyle">{{ formatTaskName(task.name) }}</text>
					<view class="progress-container">
						<progress :percent="task.progress" :activeColor="theme.activeColor" :backgroundColor="theme.borderColor" stroke-width="4" border-radius="4" class="ai-progress-bar" />
						<text class="ai-progress-label" :style="progressLabelStyle">{{ task.progress }}%</text>
					</view>
					<view class="action-buttons">
						<button class="cancel-btn" :style="cancelButtonStyle" @click="handleCancelTask(task)">Cancel</button>
						<button class="accelerate-btn" :style="accelerateButtonStyle" @click="handleAccelerateTask(task)">Accelerate</button>
					</view>
				</view>
			</view>

			<!-- 2. History Versions Section -->
			<view class="history-section">
				<text class="section-label" :style="sectionLabelStyle">History Versions:</text>
				<view class="history-list">
					<view v-if="sortedHistory.length > 0">
						<view v-for="(item, index) in sortedHistory" :key="item.id"
							:class="['history-item', { 'current-version': item.id === currentVersionId }]"
							:style="getHistoryItemStyle(item)"
							@click="switchVersion(item)"
						>
							<!-- Version Info -->
							<view class="history-item-info">
								<view class="version-header">
									<text :style="versionTitleStyle(item)">
										Version {{ item.id }}
										<text v-if="item.id === currentVersionId" class="current-tag">(Current)</text>
									</text>
									<text v-if="newVersionIds.includes(item.id)" :style="newVersionLabelStyle" class="new-version-label">NEW</text>
								</view>
								
								<text class="version-description" :style="versionDescriptionStyle">
									{{ item.description || `Created at: ${formatTimestamp(item.createdAt)}` }}
								</text>
							</view>
							
							<!-- Actions -->
							<view class="history-item-actions">
								<view v-if="!item.isInProgress" class="delete-action" @click.stop="confirmDeleteHistory(item)" :style="deleteActionStyle">
									<uni-icons type="trash" size="18" :color="theme.secondaryTextColor"></uni-icons>
								</view>
							</view>
						</view>
					</view>
					
					<!-- Empty State -->
					<view v-else class="empty-state">
						<text class="no-history-message" :style="textStyle">No history versions available.</text>
					</view>
				</view>
			</view>
		</view>
	</scroll-view>
</template>

<script>
	import bookCacheService from '@/services/bookCacheService';
	
	export default {
		name: 'BookHistoryVersions',
		props: {
			allVersions: { 
				type: Array, 
				required: true 
			},
			bookId: { 
				type: [String, Number], 
				required: true 
			},
			currentVersionId: { 
				type: Number, 
				required: true 
			},
			justCompletedAIVersions: { 
				type: Array, 
				default: () => [] 
			},
			show: { 
				type: Boolean, 
				default: false 
			},
			theme: { 
				type: Object, 
				required: true 
			}
		},
		emits: [
			'switch-version', 
			'delete-version', 
			'cancel-ai-task', 
			'accelerate-ai-task', 
			'reset-just-completed-versions',
			'refresh-book-data'
		],
		data() {
			return {
				newVersionIds: [],
				cachedActiveAiTasks: []
			};
		},
		computed: {
			sortedHistory() {
				if (!this.allVersions || !Array.isArray(this.allVersions)) return [];
				
				// Map version data to display format - exclude in-progress versions
				const mapped = this.allVersions
					.filter(v => v && typeof v === 'object' && !v.isAiTaskInProgress)
					.map(v => ({
						id: v.version,
						description: v.taskName,
						createdAt: v.versionCreatedAt,
						isInProgress: v.isAiTaskInProgress
					}));
				
				// Sort by version ID in descending order (newest first)
				return mapped.sort((a, b) => b.id - a.id);
			},
			
			activeAiTasks() {
				// Use cached data for reactivity, but also try to get fresh data
				this.refreshActiveAiTasks();
				return this.cachedActiveAiTasks;
			},
			
			hasActiveAITasks() {
				return this.cachedActiveAiTasks.length > 0;
			},
			
			// Theme-based computed styles
			containerStyle() {
				return {
					backgroundColor: this.theme.backgroundColor || '#FFFFFF',
				};
			},
			
			textStyle() {
				return {
					color: this.theme.primaryTextColor || '#333333',
				};
			},
			
			sectionLabelStyle() {
				return {
					color: this.theme.primaryTextColor || '#333333',
					opacity: 0.8,
				};
			},
			
			progressLabelStyle() {
				return {
					color: this.theme.secondaryTextColor || '#666666',
				};
			},
			
			cancelButtonStyle() {
				return {
					backgroundColor: this.theme.input?.backgroundColor || '#f0f0f0',
					color: this.theme.primaryTextColor || '#333',
					border: `1px solid ${this.theme.borderColor}`
				};
			},
			
			accelerateButtonStyle() {
				return {
					backgroundColor: this.theme.activeColor || '#007aff',
					color: this.theme.backgroundColor || 'white',
				};
			},
			
			newVersionLabelStyle() {
				return {
					color: '#18BC37',
				};
			},
			
			versionDescriptionStyle() {
				return {
					color: this.theme.secondaryTextColor || '#666666',
				};
			},
			
			deleteActionStyle() {
				return {
					opacity: 0.8,
				};
			}
		},
		watch: {
			allVersions: {
				handler(newVersions, oldVersions) {
					// Refresh AI tasks when versions change
					this.refreshActiveAiTasks();
				},
				deep: true
			},
			
			justCompletedAIVersions: {
				handler(newVersions) {
					if (newVersions && newVersions.length > 0) {
						this.newVersionIds = [...newVersions];
						// Automatically clear the "NEW" labels after a delay
						setTimeout(() => {
							this.newVersionIds = [];
							this.$emit('reset-just-completed-versions');
						}, 5000);
					}
				},
				immediate: true
			},
			
			show: {
				handler(isShown) {
					if (isShown) {
						// Refresh AI tasks when component becomes visible
						this.refreshActiveAiTasks();
					} else if (this.newVersionIds.length > 0) {
						// Clear NEW labels when component is hidden
						this.newVersionIds = [];
						this.$emit('reset-just-completed-versions');
					}
				}
			}
		},
		created() {
			// Initialize cached AI tasks
			this.refreshActiveAiTasks();
			
			if (this.justCompletedAIVersions && this.justCompletedAIVersions.length > 0) {
				this.newVersionIds = [...this.justCompletedAIVersions];
			}
			
			// Listen for AI task events
			uni.$on('ai-task-completed', this.handleAITaskCompleted);
			uni.$on('ai-task-cancelled', this.handleAITaskCancelled);
			uni.$on('ai-task-accelerated', this.handleAITaskAccelerated);
		},
		mounted() {
			// Refresh data when component is mounted
			this.$nextTick(() => {
				this.refreshActiveAiTasks();
			});
		},
		unmounted() {
			this.newVersionIds = [];
			uni.$off('ai-task-completed', this.handleAITaskCompleted);
			uni.$off('ai-task-cancelled', this.handleAITaskCancelled);
			uni.$off('ai-task-accelerated', this.handleAITaskAccelerated);
		},
		methods: {
			refreshActiveAiTasks() {
				const bookData = bookCacheService.getBookContentById(this.bookId);
				const tasks = bookData?.bookAllVersion?.runningAiTasks || [];
				
				// Only update if tasks have actually changed
				if (JSON.stringify(tasks) !== JSON.stringify(this.cachedActiveAiTasks)) {
					this.cachedActiveAiTasks = tasks;
					console.log(`[BookHistoryVersions] Refreshed activeAiTasks - Found ${tasks.length} running tasks for book ${this.bookId}`);
				}
			},
			
			formatTaskName(taskName) {
				if (!taskName) return 'Unknown Task';
				return taskName.replace(/_/g, ' ');
			},
			
			formatTimestamp(timestamp) {
				if (!timestamp) return 'N/A';
				
				try {
					const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
					if (isNaN(date.getTime())) return 'Invalid Date';
					
					return date.toLocaleString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					});
				} catch (error) {
					console.error('Error formatting timestamp:', error);
					return 'Invalid Date';
				}
			},
			
			getHistoryItemStyle(item) {
				const isDark = this.theme.backgroundColor === '#121212';
				const isActive = item.id === this.currentVersionId;
				
				let backgroundColor;
				if (isActive) {
					backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : this.theme.input?.backgroundColor || '#f0f8ff';
				} else {
					backgroundColor = isDark ? 'rgba(255, 255, 255, 0.03)' : this.theme.listItem?.backgroundColor || '#f9f9f9';
				}
					
				const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : this.theme.borderColor || '#e0e0e0';
				
				return {
					backgroundColor: backgroundColor,
					borderColor: borderColor,
					color: this.theme.primaryTextColor || '#333333',
				};
			},
			
			versionTitleStyle(item) {
				const isActive = item.id === this.currentVersionId;
				
				let color;
				if (isActive) {
					color = this.theme.activeColor;
				} else {
					color = this.theme.primaryTextColor;
				}
				
				return {
					color: color,
					fontWeight: isActive ? 'bold' : 'normal',
				};
			},
			
			switchVersion(historyItem) {
				if (!historyItem || historyItem.id === this.currentVersionId) {
					return;
				}
				this.$emit('switch-version', historyItem.id);
			},
			
			handleCancelTask(task) {
				if (!task || !task.id) return;
				this.$emit('cancel-ai-task', task.id);
			},
			
			handleAccelerateTask(task) {
				if (!task || !task.id) return;
				this.$emit('accelerate-ai-task', task.id);
			},
			
			confirmDeleteHistory(item) {
				if (!item || !item.id) return;
				this.$emit('delete-version', item.id);
			},
			
			getTaskProgress(versionId) {
				const task = this.cachedActiveAiTasks.find(task => task.newVersionId === versionId);
				console.log(`[BookHistoryVersions] Getting progress for version ${versionId}:`, {
					task: task,
					progress: task?.progress,
					activeTasksCount: this.cachedActiveAiTasks.length,
					cachedTasks: this.cachedActiveAiTasks
				});
				return task ? task.progress : null;
			},
			
			handleAITaskCompleted(eventData) {
				if (eventData.bookId === parseInt(this.bookId, 10)) {
					// Refresh cached AI tasks
					this.refreshActiveAiTasks();
					
					// Add the NEW label to the completed version
					if (!this.newVersionIds.includes(eventData.completedVersionId)) {
						this.newVersionIds.push(eventData.completedVersionId);
					}
				}
			},
			
			handleAITaskCancelled(eventData) {
				if (eventData.bookId === parseInt(this.bookId, 10)) {
					// Refresh cached AI tasks
					this.refreshActiveAiTasks();
					
					// Remove any NEW label from the cancelled version if it exists
					const index = this.newVersionIds.indexOf(eventData.cancelledVersionId);
					if (index !== -1) {
						this.newVersionIds.splice(index, 1);
					}
					
					// Show success message
					uni.showToast({ 
						title: `Task "${eventData.taskName}" cancelled`, 
						icon: 'success',
						duration: 2000 
					});
					
					// Emit event to parent to refresh data
					this.$emit('refresh-book-data');
				}
			},
			
			handleAITaskAccelerated(eventData) {
				if (eventData.bookId === parseInt(this.bookId, 10)) {
					// Refresh cached AI tasks to get updated progress
					this.refreshActiveAiTasks();
					
					// Show acceleration message
					uni.showToast({ 
						title: `Task accelerated to ${eventData.newProgress}%`, 
						icon: 'success',
						duration: 1500 
					});
				}
			}
		}
	};
</script>

<style scoped>
	.history-versions-container {
		width: 100%;
		max-height: 50vh;
	}
	
	.details-content { 
		display: flex; 
		flex-direction: column; 
		gap: 15px; 
		padding: 10px 15px; 
	}
	
	.section-label { 
		display: block; 
		font-size: 14px; 
		margin-bottom: 8px; 
		font-weight: 500; 
	}
	
	/* AI Tasks Section */
	.ai-section { 
		padding-bottom: 10px; 
		border-bottom: 1px solid; 
		border-color: transparent;
	}
	
	.ai-in-progress-view { 
		margin-bottom: 15px; 
		padding: 12px;
		background-color: rgba(24, 188, 55, 0.05);
		border-radius: 8px;
		border-left: 3px solid #18BC37;
	}
	
	.ai-task-name { 
		font-size: 14px; 
		margin-bottom: 8px; 
		font-weight: 500;
	}
	
	.progress-container { 
		display: flex; 
		align-items: center; 
		gap: 10px; 
		margin-bottom: 10px;
	}
	
	.ai-progress-bar { 
		flex: 1; 
	}
	
	.ai-progress-label { 
		font-size: 12px; 
		min-width: 35px;
		text-align: right;
	}
	
	.action-buttons { 
		display: flex; 
		justify-content: flex-end; 
		gap: 10px; 
	}
	
	.action-buttons button { 
		font-size: 12px; 
		padding: 6px 12px; 
		margin: 0; 
		line-height: 1.3;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.cancel-btn:active { 
		opacity: 0.8; 
		transform: scale(0.98);
	}
	
	.accelerate-btn:active { 
		opacity: 0.9; 
		transform: scale(0.98);
	}

	/* History Section */
	.history-list { 
		display: flex; 
		flex-direction: column; 
		gap: 8px; 
		position: relative; 
		padding-right: 5px; 
	}
	
	.history-item { 
		display: flex; 
		align-items: center; 
		font-size: 14px; 
		padding: 12px 10px; 
		border: 1px solid; 
		border-radius: 8px;
		transition: all 0.2s ease;
		position: relative;
	}
	
	.history-item.current-version {
		box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
	}
	
	.current-version-indicator { 
		width: 30px; 
		height: 30px; 
		flex-shrink: 0; 
		cursor: pointer; 
		display: flex; 
		align-items: center; 
		justify-content: center; 
		margin-right: 8px;
		transition: transform 0.2s ease;
	}
	
	.current-version-indicator:active {
		transform: scale(0.9);
	}
	
	.history-item-info { 
		flex: 1; 
		overflow: hidden;
	}
	
	.version-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 2px;
	}
	
	.version-title {
		font-size: 13px;
		line-height: 1.3;
	}
	
	.version-description {
		font-size: 12px;
		line-height: 1.3;
		opacity: 0.7;
	}
	
	.history-item-actions { 
		display: flex; 
		align-items: center; 
		gap: 12px; 
		padding-left: 10px;
		flex-shrink: 0;
	}
	
	.delete-action { 
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s ease;
	}
	
	.delete-action:active {
		transform: scale(0.9);
		opacity: 0.6;
	}
	
	.empty-state {
		text-align: center;
		padding: 20px;
	}
	
	.no-history-message { 
		font-size: 14px; 
		opacity: 0.6;
	}
	
	.new-version-label { 
		font-weight: bold; 
		font-size: 10px;
		padding: 2px 6px;
		background-color: rgba(24, 188, 55, 0.1);
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>