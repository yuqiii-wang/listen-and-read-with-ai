<template>
	<view class="sidebar-wrapper">
		<view class="overlay" @click="closeSidebar"></view>

		<view class="sidebar-content">
			<scroll-view scroll-y class="menu-scroll">
				<view class="menu-list">
					<!-- UPDATED: This now loops over a computed property -->
					<view v-for="menu in menuItems" :key="menu.id" class="menu-item-l1">
						<view class="menu-item-l1-title" @click="toggleSubmenu(menu.id)">
							<text>{{ menu.name }}</text>
							<uni-icons :type="activeMenuId === menu.id ? 'top' : 'bottom'" size="16" color="#666"></uni-icons>
						</view>

						<view v-if="activeMenuId === menu.id" class="submenu-list">
							<view v-for="submenu in menu.submenus" :key="submenu.id" class="menu-item-l2" @click="showInfoPanel(submenu)">
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
	</view>
</template>

<script>
	import InfoPanel from '@/components/InfoPanel';

	export default {
		name: 'SidebarInfo',
		components: {
			InfoPanel
		},
		// NEW: Accepts a 'mode' prop to control its behavior
		props: {
			mode: {
				type: String,
				default: 'default' // 'default' or 'userInput'
			}
		},
		data() {
			return {
				activeMenuId: null,
				isInfoPanelVisible: false,
				activeSubmenu: null,
				// REMOVED: menuItems is now a computed property
			};
		},
		// NEW: A computed property to dynamically set the menu
		computed: {
			menuItems() {
				if (this.mode === 'userInput') {
					// When triggered by long-press, show this simplified menu
					return [{
						id: 'userInput',
						name: 'User Input',
						submenus: [
							{ id: 'userInput-summary', name: 'AI Summary', actionType: 'summary', data: { title: 'AI Summary for Selection', content: 'This is the AI summary based on your input.' } },
							{ id: 'userInput-tags', name: 'Tags', actionType: 'tags', data: { title: 'Tags for Selection', content: 'Tags: Analysis, Key-point' } },
							{ id: 'userInput-background', name: 'AI Background', actionType: 'background', data: { title: 'AI Background for Selection', content: 'Background info for your selection.' } },
							{ id: 'userInput-rewrite', name: 'Rewrite to Simple Vocabularies', actionType: 'rewrite', data: { title: 'Simplified Version of Selection', content: 'Here is a simpler version of your selection...' } },
						]
					}];
				}
				
				// The default menu when clicking "AI Info" button
				return [{
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
			}
		},
		methods: {
			closeSidebar() {
				this.$emit('close');
			},
			toggleSubmenu(menuId) {
				this.activeMenuId = this.activeMenuId === menuId ? null : menuId;
			},
			showInfoPanel(submenu) {
				this.activeSubmenu = submenu;
				this.isInfoPanelVisible = true;
			},
			hideInfoPanel() {
				this.isInfoPanelVisible = false;
			},
			handleAddContent() {
				if (!this.activeSubmenu) return;
				const payload = {
					content: this.activeSubmenu.data.content,
					action: this.activeSubmenu.actionType,
					scope: this.activeMenuId
				};
				this.$emit('insert-content', payload);
				this.hideInfoPanel();
				this.closeSidebar();
			}
		}
	};
</script>

<style scoped>
	/* ... styles are the same, no changes needed here ... */
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
	.menu-item-l1-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		border-bottom: 1px solid #f0f0f0;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
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
</style>