<template>
	<view class="settings-container">
		<uni-list>
			<uni-list-item title="Volume">
				<template v-slot:footer>
					<view class="setting-control">
						<slider :value="volume" @changing="onVolumeChange" min="0" max="100" show-value style="width: 150px;"/>
					</view>
				</template>
			</uni-list-item>
			<uni-list-item title="Voice" showArrow clickable @click="showVoicePicker = true">
				<template v-slot:footer>
					<text class="selected-voice">{{ voice }}</text>
				</template>
			</uni-list-item>
		</uni-list>

		<!-- A simple picker that appears when the voice option is clicked -->
		<view v-if="showVoicePicker" class="picker-overlay" @click="showVoicePicker = false">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-title">Select a Voice</text>
					<text class="picker-done" @click="showVoicePicker = false">Done</text>
				</view>
				<picker-view :indicator-style="indicatorStyle" :value="voiceIndex" @change="onVoiceChange" class="picker-view">
					<picker-view-column>
						<view class="picker-item" v-for="(item, index) in voiceOptions" :key="index">{{item}}</view>
					</picker-view-column>
				</picker-view>
			</view>
		</view>
	</view>
</template>

<script>
	import settingsService from '@/services/settingsService'; // Adjust the path if necessary

	export default {
		data() {
			return {
				volume: 80,
				voice: 'Female Voice',
				voiceOptions: ['Female Voice', 'Male Voice', 'News Voice', 'Child Voice'],
				showVoicePicker: false,
				indicatorStyle: `height: 50px;`
			};
		},
		computed: {
			voiceIndex() {
				const index = this.voiceOptions.indexOf(this.voice);
				return [index > -1 ? index : 0];
			}
		},
		onLoad() {
			// Load settings when the page is first loaded
			const settings = settingsService.getSettings();
			this.volume = settings.volume;
			this.voice = settings.voice;
		},
		methods: {
			/**
			 * Updates the volume and saves it to storage.
			 * @param {Event} e - The event object from the slider.
			 */
			onVolumeChange(e) {
				this.volume = e.detail.value;
				settingsService.saveVolume(this.volume);
			},
			/**
			 * Updates the selected voice from the picker and saves it.
			 * @param {Event} e - The event object from the picker.
			 */
			onVoiceChange(e) {
				const newVoice = this.voiceOptions[e.detail.value[0]];
				this.voice = newVoice;
				settingsService.saveVoice(this.voice);
			}
		}
	}
</script>

<style scoped>
	.settings-container {
		padding-top: 10px;
	}
	.setting-control {
		display: flex;
		align-items: center;
	}
	.selected-voice {
		color: #999;
		font-size: 14px;
	}
	.picker-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: flex-end;
		z-index: 999;
	}
	.picker-content {
		width: 100%;
		background-color: #fff;
	}
	.picker-header {
		display: flex;
		justify-content: space-between;
		padding: 12px 15px;
		border-bottom: 1px solid #e5e5e5;
	}
	.picker-title {
		font-size: 16px;
		color: #333;
	}
	.picker-done {
		color: #007AFF;
		font-size: 16px;
	}
	.picker-view {
		width: 100%;
		height: 250px;
	}
	.picker-item {
		line-height: 50px;
		text-align: center;
		font-size: 16px;
	}
</style>