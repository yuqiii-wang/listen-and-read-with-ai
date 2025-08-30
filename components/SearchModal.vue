<!-- components/SearchModal.vue -->
<template>
	<uni-popup ref="popup" type="center" :mask-click="false">
		<view class="search-modal-content">
			<uni-easyinput
				class="modal-search-input"
				type="textarea"
				:autoHeight="true"
				v-model="modalSearchValue"
				:placeholderStyle="placeholderStyle"
				placeholder="place book title, or any keyword you could think of"
				@input="checkInput"
			></uni-easyinput>
			<view v-if="warningMessage" class="warning-text">{{ warningMessage }}</view>
			<view class="modal-actions">
				<button class="modal-button primary" @click="confirmSearch">Search</button>
				<button class="modal-button" @click="close">Cancel</button>
			</view>
		</view>
	</uni-popup>
</template>

<script>
export default {
	name: "SearchModal",
	data() {
		return {
			modalSearchValue: '',
			warningMessage: '',
			placeholderStyle: "font-size: 13px; color: #999;"
		};
	},
	methods: {
		open(initialValue = '') {
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
	background-color: white;
	padding: 20px;
	border-radius: 8px;
	width: 85vw;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-search-input {
	margin-bottom: 15px;
}

.warning-text {
	color: #e43d33;
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
}

.modal-button.primary {
	background-color: #007aff;
	color: white;
	margin-left: 0;
	margin-right: 10px; /* Add margin to the right since order is reversed */
}
</style>