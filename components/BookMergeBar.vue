<template>
	<view class="book-merge-bar">
		<button class="bar-btn confirm-btn" @click="handleConfirm">Confirm</button>
		<button class="bar-btn cancel-btn" @click="handleCancel">Cancel</button>
	</view>
</template>

<script>
	export default {
		name: "BookMergeBar",
		methods: {
			/**
			 * Emits a 'cancel' event when the cancel button is clicked.
			 */
			handleCancel() {
				this.$emit('cancel');
			},
			/**
			 * Emits a 'confirm' event when the confirm button is clicked.
			 */
			handleConfirm() {
				this.$emit('confirm');
			}
		}
	}
</script>

<style scoped>
	.book-merge-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(60px + var(--safe-area-inset-bottom));
		background-color: #ffffff;
		border-top: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between; /* Pushes buttons to opposite ends */
		align-items: center;
		padding: 10px 15px;
		padding-bottom: calc(10px + var(--safe-area-inset-bottom));
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.bar-btn {
		height: 40px;
		line-height: 40px;
		padding: 0 20px;
		font-size: 16px;
		border-radius: 8px;
		border: none;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Added flex properties for balanced width */
		flex-grow: 1;
		margin: 0 5px;
		max-width: 45%; /* Prevents buttons from becoming too wide */
	}

	.confirm-btn {
		background-color: #007aff;
	}
	
	.confirm-btn:active {
		background-color: #0056b3;
	}

	.cancel-btn {
		background-color: #8e8e93;
	}

	.cancel-btn:active {
		background-color: #6c6c70;
	}
</style>