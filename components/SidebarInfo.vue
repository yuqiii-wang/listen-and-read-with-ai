<template>
	<view class="sidebar-wrapper">
		<view class="overlay" @click="closeSidebar"></view>

		<view class="sidebar-content">
			<scroll-view scroll-y class="menu-scroll">
				<view class="menu-list">
					<view v-for="menu in menuItems" :key="menu.id" class="menu-item-l1">
						<view class="menu-item-l1-content">
							<view class="menu-item-l1-title" @click="toggleSubmenu(menu.id)">
								<text>{{ menu.name }}</text>
								<uni-icons :type="activeMenuId === menu.id ? 'top' : 'bottom'" size="16" color="#666"></uni-icons>
							</view>
							<view v-if="menu.id === 'userInput'" class="user-ask-description">
								<text>{{ truncatedText }}</text>
							</view>
						</view>
						<view v-if="activeMenuId === menu.id" class="submenu-list">
							<view v-for="submenu in menu.submenus" :key="submenu.id" class="menu-item-l2" @click="handleSubmenuClick(submenu)">
								<text>{{ submenu.name }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<info-panel
			v-if="isInfoPanelVisible"
			:info="activeSubmenu.data"
			@close="hideInfoPanel"
			@add-to-text="handleAddContent"
		></info-panel>
		
		<!-- Ask Anything Modal -->
		<view v-if="isAskModalVisible" class="ask-modal-wrapper">
			<view class="ask-modal-content">
				<textarea class="ask-modal-textarea" placeholder="Ask anything..." auto-height></textarea>
				<view class="ask-modal-checkbox-group">
					<label class="checkbox-label">
						<checkbox value="docContext" />
						<text>with whole document context</text>
					</label>
					<label class="checkbox-label">
						<checkbox value="pageContext" />
						<text>with page text surrounding context</text>
					</label>
				</view>
				<view class="ask-modal-actions">
					<button class="submit-btn" @click="handleAskSubmit">Submit</button>
					<button class="cancel-btn" @click="hideAskModal">Cancel</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import InfoPanel from '@/components/InfoPanel';

	export default {
		name: 'SidebarInfo',
		components: {
			InfoPanel
		},
		props: {
			mode: {
				type: String,
				default: 'default' // 'default' or 'userInput'
			},
			userInputText: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				activeMenuId: null,
				isInfoPanelVisible: false,
				activeSubmenu: null,
				isAskModalVisible: false, // Controls the visibility of the new modal
				askActionOriginMenuId: null, // To store which L1 menu the ask action originated from
			};
		},
		watch: {
			mode: {
				handler(newMode, oldMode) {
					// Only act when the mode changes to 'userInput'
					if (newMode === 'userInput') {
						
						const userInputMenu = this.menuItems[0];
						
						if (userInputMenu) {
							this.activeMenuId = userInputMenu.id;
						}
					} else {
						this.activeMenuId = null;
						this.isInfoPanelVisible = false;
						this.activeSubmenu = null;
					}
				},
				immediate: true // This makes the watcher run once when the component is first created
			}
		},
		computed: {
			truncatedText() {
				const text = this.userInputText;
				if (!text) {
					return '';
				}
				// If text is longer than 36 chars, truncate it
				if (text.length > 30) {
					const start = text.substring(0, 12);
					const end = text.substring(text.length - 12);
					return `${start} ...... ${end}`;
				}
				// Otherwise, return the full text
				return text;
			},
			menuItems() {
				// ADD '+ ask anything' TO THE 'userInput' MODE MENU
				if (this.mode === 'userInput') {
					return [{
						id: 'userInput',
						name: 'User Ask',
						submenus: [
							{ id: 'userInput-ask', name: '+ ask anything', actionType: 'ask' },
							{ id: 'userInput-summary', name: 'AI Summary', actionType: 'summary', data: { title: 'AI Summary for Selection', content: 'This is the AI summary based on your input.' } },
							{ id: 'userInput-tags', name: 'Tags', actionType: 'tags', data: { title: 'Tags for Selection', content: 'Tags: Analysis, Key-point' } },
							{ id: 'userInput-background', name: 'AI Background', actionType: 'background', data: { title: 'AI Background for Selection', content: 'Background info for your selection.' } },
							{ id: 'userInput-rewrite', name: 'Rewrite to Simple Vocabularies', actionType: 'rewrite', data: { title: 'Simplified Version of Selection', content: 'Here is a simpler version of your selection...' } },
						]
					}];
				}
				
				// The default menu
				const defaultMenus = [{
					id: 'all',
					name: 'All',
					submenus: [
						{ id: 'all-summary', name: 'AI Summary', actionType: 'summary', data: { title: 'AI Summary for All', content: 'This is the AI-generated summary for the entire book.' } },
						{ id: 'all-rewrite', name: 'Rewrite to Simple Vocabularies', actionType: 'rewrite', data: { title: 'Simplified Version for All', content: 'Here is a simpler version of the entire book...' } },
					]
				}, {
					id: 'ch1',
					name: 'Chapter 1',
					submenus: [
						{ id: 'ch1-summary', name: 'AI Summary', actionType: 'summary', data: { title: 'AI Summary for Chapter 1', content: 'This is the AI-generated summary for the first chapter.' } },
					]
				}, {
					id: 'ch2',
					name: 'Chapter 2',
					submenus: [
						{ id: 'ch2-rewrite', name: 'Rewrite to Simple Vocabularies', actionType: 'rewrite', data: { title: 'Simplified Version for Chapter 2', content: 'Here is a simpler version of chapter two...' } },
					]
				}];

				// Add '+ ask anything' to each submenu
				return defaultMenus.map(menu => {
					const askSubmenu = {
						id: `${menu.id}-ask`,
						name: '+ ask anything',
						actionType: 'ask'
					};
					return {
						...menu,
						submenus: [askSubmenu, ...menu.submenus]
					};
				});
			}
		},
		methods: {
			closeSidebar() {
				this.$emit('close');
			},
			toggleSubmenu(menuId) {
				this.activeMenuId = this.activeMenuId === menuId ? null : menuId;
			},
			handleSubmenuClick(submenu) {
				if (submenu.actionType === 'ask') {
					this.askActionOriginMenuId = this.activeMenuId; // Save the context
					this.showAskModal();
				} else {
					this.showInfoPanel(submenu);
				}
			},
			showInfoPanel(submenu) {
				this.activeSubmenu = submenu;
				this.isInfoPanelVisible = true;
			},
			hideInfoPanel() {
				this.isInfoPanelVisible = false;
			},
			showAskModal() {
				this.isAskModalVisible = true;
			},
			hideAskModal() {
				this.isAskModalVisible = false;
			},
			handleAskSubmit() {
				this.hideAskModal();
				
				// Create a placeholder response object for the info panel
				const askResponseSubmenu = {
					actionType: 'ask-response',
					data: {
						title: 'AI Response',
						content: 'This is the AI-generated response to your question. The actual content would be based on your input and selected context.'
					}
				};
				
				// Show the info panel with the response
				this.showInfoPanel(askResponseSubmenu);
			},
			handleAddContent() {
				if (!this.activeSubmenu) return;
				const payload = {
					content: this.activeSubmenu.data.content,
					action: this.activeSubmenu.actionType,
					// Use the origin menu ID for scope, or the active one as a fallback
					scope: this.askActionOriginMenuId || this.activeMenuId 
				};
				this.$emit('insert-content', payload);
				this.hideInfoPanel();
				this.closeSidebar();
			}
		}
	};
</script>

<style scoped>
	/* ... other styles remain the same ... */
	.sidebar-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 999;
		display: flex;
		flex-direction: row;
	}
	.overlay {
		width: 33.33%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.4);
	}
	.sidebar-content {
		width: 66.67%;
		height: 100%;
		background-color: #ffffff;
		box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
	}
	.menu-scroll {
		height: 100%;
	}
	.menu-list {
		padding-top: var(--status-bar-height);
	}
	.menu-item-l1-content {
		border-bottom: 1px solid #f0f0f0;
	}
	.menu-item-l1-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
	}
	.user-ask-description {
		padding: 0 20px 12px 20px;
		font-size: 13px;
		color: #666;
		line-height: 1.4;
		font-weight: normal;
	}
	.submenu-list {
		background-color: #f7f7f7;
	}
	.menu-item-l2 {
		padding: 12px 20px 12px 35px;
		border-bottom: 1px solid #f0f0f0;
		font-size: 14px;
		color: #333;
		cursor: pointer;
	}
	.menu-item-l2:hover {
		background-color: #e9e9e9;
	}
	
	/* Styles for the new modal */
	.ask-modal-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1001; /* Higher z-index to be on top of the sidebar overlay */
	}
	.ask-modal-content {
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		width: 80%;
		max-width: 500px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
	}
	.ask-modal-textarea {
		width: 100%;
		min-height: 120px;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 10px;
		font-size: 14px;
		margin-bottom: 15px;
		box-sizing: border-box;
	}
	.ask-modal-checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		font-size: 14px;
		color: #333;
	}
	.checkbox-label text {
		margin-left: 8px;
	}
	/* uni-app checkbox style override */
	.checkbox-label checkbox {
		transform: scale(0.8);
	}
	.ask-modal-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.ask-modal-actions button {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}
	.submit-btn {
		background-color: #007aff;
		color: white;
	}
	.cancel-btn {
		background-color: #f0f0f0;
		color: #333;
		border: 1px solid #ddd;
	}
</style>