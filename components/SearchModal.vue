<!-- components/SearchModal.vue -->
<template>
	<uni-popup ref="popup" type="center" :mask-click="false">
		<view class="search-modal-content" :style="{ backgroundColor: themeStyles.backgroundColor }">
			<uni-easyinput
				class="modal-search-input"
				type="textarea"
				:autoHeight="true"
				v-model="modalSearchValue"
				:placeholderStyle="placeholderStyle"
				:inputStyle="inputStyle"
				:styles="inputContainerStyle"
				placeholder="place book title, or any keyword you could think of"
				@input="checkInput"
			></uni-easyinput>
			<view v-if="warningMessage" class="warning-text" :style="{ color: themeStyles.errorColor || '#e43d33' }">{{ warningMessage }}</view>
			<view class="modal-actions">
				<button class="modal-button primary" @click="confirmSearch">Search</button>
				<button 
					class="modal-button" 
					:style="{ color: themeStyles.secondaryTextColor, borderColor: themeStyles.borderColor }"
					@click="close">
					Cancel
				</button>
			</view>
		</view>
	</uni-popup>
</template>

<script>
import settingsCacheService from '@/services/settingsCacheService';

export default {
	name: "SearchModal",
	data() {
		return {
			modalSearchValue: '',
			warningMessage: '',
			themeStyles: {}
		};
	},
	computed: {
		placeholderStyle() {
			return `font-size: 13px; color: ${this.themeStyles.input?.placeholderColor || '#999'};`;
		},
		inputStyle() {
			return `color: ${this.themeStyles.primaryTextColor || '#333'}; background-color: transparent;`;
		},
		inputContainerStyle() {
			return {
				backgroundColor: this.themeStyles.input?.backgroundColor || '#fff',
				borderColor: this.themeStyles.input?.borderColor || '#ddd',
				borderWidth: '1px',
				borderStyle: 'solid',
				borderRadius: '4px'
			};
		}
	},
	created() {
		this.loadTheme();
	},
	methods: {
		/**
		 * Loads the current theme from the settings service and applies it.
		 */
		loadTheme() {
			const settings = settingsCacheService.getSettings();
			this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
		},
		open(initialValue = '') {
			this.loadTheme(); // Reload theme when modal opens
			this.modalSearchValue = initialValue;
			this.warningMessage = ''; // Reset warning on open
			this.$refs.popup.open();
		},
		close() {
			this.$refs.popup.close();
			this.$emit('close');
		},
		confirmSearch() {
			let valueToSearch = this.modalSearchValue;
			// Truncate the text to the first 4 lines if it exceeds the limit
			const lines = valueToSearch.split('\n');
			if (lines.length > 4) {
				valueToSearch = lines.slice(0, 4).join('\n');
			}
			this.$emit('confirm', valueToSearch);
			this.close();
		},
		checkInput(value) {
			const lines = value.split('\n');
			if (lines.length > 4) {
				this.warningMessage = "Search text is too long that might get truncated";
			} else {
				this.warningMessage = '';
			}
		}
	}
};
</script>

<style scoped>
.search-modal-content {
	padding: 20px;
	border-radius: 8px;
	width: 85vw;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-search-input {
	margin-bottom: 15px;
}

.warning-text {
	font-size: 12px;
	margin-bottom: 10px;
	text-align: center;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	/* This reverses the visual order of buttons */
	flex-direction: row-reverse;
}

.modal-button {
	margin-left: 10px;
	font-size: 14px; /* Smaller font */
	padding: 0 12px;   /* Smaller horizontal padding */
	height: 32px;      /* Fixed smaller height */
	line-height: 32px; /* Center text vertically */
	border: 1px solid;
	border-radius: 4px;
	background-color: transparent;
	cursor: pointer;
}

.modal-button.primary {
	background-color: #007aff;
	color: white;
	border-color: #007aff;
	margin-left: 0;
	margin-right: 10px; /* Add margin to the right since order is reversed */
}
</style>