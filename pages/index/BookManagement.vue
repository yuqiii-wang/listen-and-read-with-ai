<template>
	<view class="history-versions-container" :style="pageStyle">
		<uni-list :border="false">
			<view v-for="version in allVersions" :key="version.version" class="version-list-item-wrapper">
				<uni-list-item :customStyle="itemStyle(version.version)">
					<!-- List Item Body: Clickable area to switch version -->
					<template v-slot:body>
						<view class="version-item-body" @click="handleSwitchVersion(version.version)">
							<text class="version-label" :style="versionLabelStyle(version.version)">
								v{{ version.version }}
							</text>
							<view class="version-details">
								<text class="version-info-text" :style="titleStyle">
									Created: {{ formatTimestamp(version.timestamp) }}
								</text>
								<text v-if="version.source" class="version-info-text" :style="sourceStyle">
									Source: {{ version.source }}
								</text>
							</view>
						</view>
					</template>
					
					<template v-slot:footer>
						<view class="version-item-footer">
							<view class="active-version-icon" @click="handleSwitchVersion(version.version)">
								<uni-icons 
									type="checkmark-filled" 
									size="24" 
									:color="isActiveVersion(version.version) ? '#28a745' : theme.textColor"
								></uni-icons>
							</view>
							<view class="delete-version-icon" @click="confirmDeleteVersion(version.version)">
								<uni-icons type="trash" size="22" color="#e43d33"></uni-icons>
							</view>
						</view>
					</template>
				</uni-list-item>

				<!-- AI Task Progress Section -->
				<view v-if="version.aiTasksInProgress && version.aiTasksInProgress.length > 0">
					<view v-for="task in version.aiTasksInProgress" :key="task.key" class="ai-task-item">
						<text class="ai-task-info" :style="titleStyle">{{ task.description }} ({{ task.progress }}%)</text>
						<view class="ai-task-actions">
							<button size="mini" @click="$emit('cancel-ai-task', task.key)">Cancel</button>
							<button size="mini" type="primary" @click="$emit('accelerate-ai-task', task.key)">Accelerate</button>
						</view>
					</view>
				</view>
			</view>
		</uni-list>
	</view>
</template>

<script>
	export default {
		name: "BookHistoryVersions",
		props: {
			bookId: { type: [String, Number], required: true },
			currentVersionId: { type: Number, required: true },
			theme: { type: Object, required: true },
		},
		emits: [
			'delete-version', 
			'switch-version', 
			'cancel-ai-task', 
			'accelerate-ai-task'
		],
		computed: {
			pageStyle() {
				return { backgroundColor: this.theme.color };
			},
			titleStyle() {
				return { color: this.theme.textColor };
			},
			sourceStyle() {
				const color = this.theme.name === 'Black' ? '#bb86fc' : '#007aff';
				return { color: color, fontStyle: 'italic' };
			}
		},
		methods: {
			itemStyle(versionId) {
				const isActive = this.isActiveVersion(versionId);
				const borderColor = this.theme.name === 'Black' ? 'rgba(255, 255, 255, 0.1)' : '#eee';
				const backgroundColor = isActive 
					? (this.theme.name === 'Black' ? 'rgba(255, 255, 255, 0.08)' : '#f0f8ff')
					: this.theme.color;

				return {
					backgroundColor: backgroundColor,
					borderBottom: `1px solid ${borderColor}`
				};
			},
			versionLabelStyle(versionId) {
				return {
					color: this.isActiveVersion(versionId) ? '#28a745' : this.theme.textColor,
					fontWeight: this.isActiveVersion(versionId) ? 'bold' : 'normal'
				};
			},
			isActiveVersion(versionId) {
				return this.currentVersionId === versionId;
			},
			handleSwitchVersion(versionId) {
				if (!this.isActiveVersion(versionId)) {
					this.$emit('switch-version', versionId);
				}
			},
			confirmDeleteVersion(versionId) {
				if (this.isActiveVersion(versionId)) {
					uni.showToast({
						title: 'Cannot delete the active version.',
						icon: 'none'
					});
					return;
				}
				uni.showModal({
					title: 'Confirm Delete',
					content: `Are you sure you want to delete version ${versionId}? This action cannot be undone.`,
					success: (res) => {
						if (res.confirm) {
							this.$emit('delete-version', versionId);
						}
					}
				});
			},
			formatTimestamp(timestamp) {
				if (!timestamp) return 'N/A';
				const date = new Date(timestamp);
				return date.toLocaleString();
			}
		}
	}
</script>

<style scoped>
	.history-versions-container {
		/* ADDED: Makes the list scrollable if it's too long */
		max-height: 40vh;
		overflow-y: auto;
	}
	.version-list-item-wrapper {
		/* Wraps each list item and its potential AI tasks */
	}
	.version-item-body {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
		cursor: pointer; /* Indicates the entire body is clickable */
	}
	.version-label {
		font-size: 16px;
		width: 50px; /* Fixed width for alignment */
	}
	.version-details {
		display: flex;
		flex-direction: column;
	}
	.version-info-text {
		font-size: 12px;
		color: #666;
	}
	.version-item-footer {
		display: flex;
		align-items: center;
	}
	.active-version-icon, .delete-version-icon {
		padding: 0 8px;
		cursor: pointer;
	}
	.ai-task-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 15px;
		background-color: rgba(0, 122, 255, 0.05);
		border-bottom: 1px solid #eee;
	}
	.ai-task-info {
		font-size: 12px;
	}
	.ai-task-actions {
		display: flex;
		gap: 10px;
	}
</style>