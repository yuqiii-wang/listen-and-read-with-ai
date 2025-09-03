<template>
	<view class="sidebar-wrapper">
		<view class="overlay" @click="closeSidebar"></view>

		<!-- MODIFIED: Applied sidebarStyle for dynamic background -->
		<view class="sidebar-content" :style="sidebarStyle">
			<scroll-view scroll-y class="menu-scroll">
				<view class="menu-list">
					<view v-for="menu in menuItems" :key="menu.id" class="menu-item-l1">
						<!-- MODIFIED: Applied borderStyle -->
						<view class="menu-item-l1-content" :style="borderStyle">
							<view class="menu-item-l1-title" @click="toggleSubmenu(menu.id)">
								<!-- MODIFIED: Applied titleStyle -->
								<text :style="titleStyle">{{ menu.name }}</text>
								<uni-icons :type="activeMenuId === menu.id ? 'top' : 'bottom'" size="16" :color="theme.textColor"></uni-icons>
							</view>
							<view v-if="menu.id === 'userInput'" class="user-ask-description">
								<!-- MODIFIED: Applied textStyle -->
								<text :style="textStyle">{{ truncatedText }}</text>
							</view>
						</view>
						<!-- MODIFIED: Applied submenuStyle -->
						<view v-if="activeMenuId === menu.id" class="submenu-list" :style="submenuStyle">
							<view v-for="submenu in menu.submenus" :key="submenu.id" class="menu-item-l2" @click="handleSubmenuClick(submenu)" :style="borderStyle">
								<!-- MODIFIED: Applied textStyle -->
								<text :style="textStyle">{{ submenu.name }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<view v-if="isAskModalVisible" class="ask-modal-wrapper">
			<!-- MODIFIED: Applied modalContentStyle -->
			<view class="ask-modal-content" :style="modalContentStyle">
				<!-- MODIFIED: Applied modalTextareaStyle -->
				<textarea v-model="modalText" class="ask-modal-textarea" placeholder="Ask anything..." auto-height :style="modalTextareaStyle"></textarea>
				
				<view class="ask-modal-checkbox-group">
					<label class="checkbox-label">
						<checkbox value="docContext" />
						<!-- MODIFIED: Applied modalTextStyle -->
						<text :style="modalTextStyle">with whole document context</text>
					</label>
					<label class="checkbox-label">
						<checkbox value="pageContext" />
						<text :style="modalTextStyle">with page text surrounding context</text>
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
	import bookContentService from '@/services/bookContentService';

	export default {
		name: 'SidebarInfo',
		components: {},
		props: {
			bookId: { type: [String, Number], required: true },
			mode: { type: String, default: 'default' },
			userInputText: { type: String, default: '' },
			// ADDED: theme prop
			theme: { type: Object, required: true },
		},
		data() {
			return {
				activeMenuId: null,
				isAskModalVisible: false,
				modalText: '',
				selectedSubmenu: null,
			};
		},
		watch: {
			mode: {
				handler(newMode) {
					this.activeMenuId = newMode === 'userInput' ? (this.menuItems[0]?.id || null) : null;
				},
				immediate: true
			}
		},
		computed: {
			isDarkTheme() {
				return this.theme.name === 'Black';
			},
			// --- ADDED: Computed styles for theming ---
			sidebarStyle() {
				return { backgroundColor: this.isDarkTheme ? '#1C1C1E' : '#FFFFFF' };
			},
			titleStyle() {
				return { color: this.theme.textColor };
			},
			textStyle() {
				return { color: this.isDarkTheme ? 'rgba(235, 235, 245, 0.8)' : '#333' };
			},
			borderStyle() {
				const borderColor = this.isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0';
				return { borderBottom: `1px solid ${borderColor}` };
			},
			submenuStyle() {
				return { backgroundColor: this.isDarkTheme ? '#2C2C2E' : '#f7f7f7' };
			},
			modalContentStyle() {
				return { backgroundColor: this.isDarkTheme ? '#2C2C2E' : '#FFFFFF' };
			},
			modalTextStyle() {
				return { color: this.theme.textColor };
			},
			modalTextareaStyle() {
				return {
					backgroundColor: this.isDarkTheme ? '#3A3A3C' : '#FFFFFF',
					color: this.theme.textColor,
					borderColor: this.isDarkTheme ? '#4A4A4C' : '#ccc',
				};
			},
			// --- END: Computed styles ---
			truncatedText() {
				const text = this.userInputText;
				if (!text) return '';
				if (text.length > 30) {
					const start = text.substring(0, 12);
					const end = text.substring(text.length - 12);
					return `${start} ...... ${end}`;
				}
				return text;
			},
			menuItems() {
				if (this.mode === 'userInput') {
					return [{
						id: 'userInput',
						name: 'User Ask',
						submenus: [
							{ id: 'userInput-ask', name: '+ ask anything', prefillQuery: '' },
							{ id: 'userInput-summary', name: 'AI Summary', prefillQuery: `Generate a concise summary for the following selected text:\n\n"${this.userInputText}"` },
							{ id: 'userInput-tags', name: 'Tags', prefillQuery: `Extract the key themes and generate relevant tags for the following text:\n\n"${this.userInputText}"` },
							{ id: 'userInput-background', name: 'AI Background', prefillQuery: `Provide historical or contextual background information related to the following text:\n\n"${this.userInputText}"` },
							{ id: 'userInput-rewrite', name: 'Rewrite to Simple Vocabularies', prefillQuery: `Rewrite the following text using simpler vocabulary and sentence structures:\n\n"${this.userInputText}"` },
						]
					}];
				}
				
				const defaultMenus = [{
					id: 'all',
					name: 'All',
					submenus: [
						{ id: 'all-summary', name: 'AI Summary', prefillQuery: 'Generate a concise summary of the entire document.' },
						{ id: 'all-rewrite', name: 'Rewrite to Simple Vocabularies', prefillQuery: 'Rewrite the entire document using simpler vocabulary and sentence structures.' },
					]
				}, {
					id: 'ch1',
					name: 'Chapter 1',
					submenus: [
						{ id: 'ch1-summary', name: 'AI Summary', prefillQuery: 'Generate a concise summary for Chapter 1.' },
					]
				}, {
					id: 'ch2',
					name: 'Chapter 2',
					submenus: [
						{ id: 'ch2-rewrite', name: 'Rewrite to Simple Vocabularies', prefillQuery: 'Rewrite Chapter 2 using simpler vocabulary.' },
					]
				}];

				return defaultMenus.map(menu => ({
					...menu,
					submenus: [
						{ id: `${menu.id}-ask`, name: '+ ask anything', prefillQuery: '' },
						...menu.submenus
					]
				}));
			}
		},
		methods: {
			closeSidebar() { this.$emit('close'); },
			toggleSubmenu(menuId) { this.activeMenuId = this.activeMenuId === menuId ? null : menuId; },
			handleSubmenuClick(submenu) {
				this.selectedSubmenu = submenu;
				this.modalText = submenu.prefillQuery;
				this.showAskModal();
			},
			showAskModal() { this.isAskModalVisible = true; },
			hideAskModal() {
				this.isAskModalVisible = false;
				this.modalText = '';
				this.selectedSubmenu = null;
			},
			handleAskSubmit() {
			    const taskName = this.selectedSubmenu ? this.selectedSubmenu.name : 'Custom AI Query';
			    bookContentService.startAITask(this.bookId, taskName);
			    this.$emit('task-started');
			    this.hideAskModal();
			    this.closeSidebar();
			    uni.showToast({ title: 'AI task started...', icon: 'loading' });
			},
		}
	};
</script>

<style scoped>
	.sidebar-wrapper { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 999; display: flex; flex-direction: row; }
	.overlay { width: 33.33%; height: 100%; background-color: rgba(0, 0, 0, 0.4); }
	.sidebar-content { width: 66.67%; height: 100%; box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15); }
	.menu-scroll { height: 100%; }
	.menu-list { padding-top: var(--status-bar-height); }
	.menu-item-l1-title { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; font-size: 16px; font-weight: bold; cursor: pointer; }
	.user-ask-description { padding: 0 20px 12px 20px; font-size: 13px; line-height: 1.4; font-weight: normal; }
	.menu-item-l2 { padding: 12px 20px 12px 35px; font-size: 14px; cursor: pointer; }
	
	/* Styles for the modal */
	.ask-modal-wrapper { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1001; }
	.ask-modal-content { padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; }
	.ask-modal-textarea { width: 100%; min-height: 120px; border-radius: 4px; padding: 10px; font-size: 14px; margin-bottom: 15px; box-sizing: border-box; border: 1px solid; }
	.ask-modal-checkbox-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
	.checkbox-label { display: flex; align-items: center; font-size: 14px; }
	.checkbox-label text { margin-left: 8px; }
	.checkbox-label checkbox { transform: scale(0.8); }
	.ask-modal-actions { display: flex; justify-content: space-between; align-items: center; }
	.ask-modal-actions button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
	.submit-btn { background-color: #007aff; color: white; }
	.cancel-btn { background-color: #f0f0f0; color: #333; border: 1px solid #ddd; }
</style>