<template>
	<view class="book-market-container">
		<uni-grid :column="3" :show-border="false" :square="false" :highlight="false">
			<uni-grid-item v-for="book in marketBooks" :index="book.marketId" :key="book.marketId">
				<view class="grid-item-box" @click="selectBook(book)">
					<image class="book-cover" :src="book.cover" mode="aspectFill"></image>
					<text class="book-title">{{ book.title }}</text>
				</view>
			</uni-grid-item>
		</uni-grid>
	</view>
</template>

<script>
	export default {
		name: "BookMarket",
		props: {
			marketBooks: {
				type: Array,
				required: true
			}
		},
		methods: {
			selectBook(book) {
				// Emit an event to the parent to handle opening the info popup
				this.$emit('bookSelected', book);
			}
		}
	}
</script>

<style scoped>
	/* Scoped styles are identical to the library shelf for consistency */
	.grid-item-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
		position: relative;
	}
	.book-cover {
		width: 90px;
		height: 120px;
		border-radius: 5px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	.book-title {
		margin-top: 8px;
		font-size: 14px;
		line-height: 1.4em;
		height: 2.8em;
		text-align: center;
		color: #333;
		width: 90px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
		word-break: break-word;
	}
</style>