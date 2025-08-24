<template>
	<view class="bottom-bar" @click.stop>
		<!-- Progress and Time Info -->
		<view class="progress-container">
			<progress :percent="readProgress" stroke-width="3" activeColor="#007AFF" backgroundColor="#E5E5E5"></progress>
			<view class="time-info">
				<text class="time-label">{{ currentTime }}</text>
				<text class="time-label">Est. {{ estimatedReadTime }} min read</text>
			</view>
		</view>
		<!-- Player Controls -->
		<view class="player-controls">
			<view class="side-controls">
				<uni-icons type="personadd" size="26" color="#333" @click.stop="onSelectVoice"></uni-icons>
				
				<view class="volume-control-container">
					<!-- Horizontal Volume Slider Popup -->
					<view v-if="volumeSliderVisible" class="volume-slider-popup">
						<slider
							:value="displayVolume" 
							@change="onSliderChange"
							min="0"
							max="100"
							step="1"
							activeColor="#007AFF"
							backgroundColor="#E5E5E5"
							block-size="20"
							style="width: 150px;"
						/>
					</view>
					<uni-icons type="sound" size="26" color="#333" @click.stop="toggleVolumeSlider"></uni-icons>
				</view>
			</view>
			
			<view class="center-control">
				<text class="play-pause-icon" @click.stop="onTogglePlay">{{ isPlaying ? '⏸\uFE0E' : '▶' }}</text>
			</view>
			<view class="side-controls right">
				<uni-icons type="forward" size="26" color="#333" @click.stop="onNextChapter"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script>
// Corrected Import: Use a relative path './' to ensure uni-app finds the module in the same directory.
import settingsService from '@/services/settingsService';
export default {
	name: 'BookAudioPlay',
	props: {
		readProgress: { type: Number, default: 0 },
		currentTime: { type: String, default: '0:00' },
		estimatedReadTime: { type: Number, default: 0 },
		isPlaying: { type: Boolean, default: false }
	},
	data() {
		return {
			volumeSliderVisible: false,
			displayVolume: 80,
			selectedVoice: 'Female Voice'
		};
	},
	created() {
		this.loadSettings();
	},
	methods: {
		loadSettings() {
			const { volume, voice } = settingsService.getSettings();
			this.displayVolume = volume;
			this.selectedVoice = voice;
			this.$emit('volume-change', this.displayVolume);
		},
		onSelectVoice() {
			const voiceOptions = ['Male Voice', 'Female Voice', 'Child Voice', 'News Voice'];
			const itemList = voiceOptions.map(voice => {
				return this.selectedVoice === voice ? `${voice} ✔` : voice;
			});

			uni.showActionSheet({
				itemList: itemList,
				success: (res) => {
					const newVoice = voiceOptions[res.tapIndex];
					this.selectedVoice = newVoice;
					settingsService.saveVoice(newVoice);
					this.$emit('voice-changed', newVoice);
				},
				fail: (res) => {
					console.log(res.errMsg);
				}
			});
		},
		onTogglePlay() { this.$emit('toggle-play'); },
		onNextChapter() { this.$emit('next-chapter'); },
		
		toggleVolumeSlider() {
			this.volumeSliderVisible = !this.volumeSliderVisible;
			if (this.volumeSliderVisible) {
				this.displayVolume = settingsService.getSettings().volume;
			}
		},

		onSliderChange(event) {
			const finalVolume = parseInt(event.detail.value, 10);
			if (!isNaN(finalVolume)) {
				this.displayVolume = finalVolume;
				settingsService.saveVolume(finalVolume);
				this.$emit('volume-change', finalVolume);
			}
		}
	}
}
</script>

<style scoped>
	/* The CSS is updated for the horizontal volume bar */
	.bottom-bar {
		position: fixed; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px); z-index: 100; padding: 10px 15px;
		padding-bottom: calc(var(--safe-area-inset-bottom) + 10px); border-top: 1px solid #e5e5e5;
		display: flex; flex-direction: column;
	}
	.progress-container, .player-controls { width: 100%; }
	.progress-container { margin-bottom: 10px; }
	.time-info { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
	.time-label { font-size: 12px; color: #666; }
	.player-controls { display: flex; justify-content: space-between; align-items: center; }
	.side-controls { display: flex; align-items: center; flex: 1; }
	.side-controls uni-icons, .side-controls .volume-control-container { margin: 0 10px; }
	.side-controls.right { justify-content: flex-end; }
	.center-control { display: flex; justify-content: center; align-items: center; }
	.volume-control-container { position: relative; display: flex; align-items: center; justify-content: center; }
	
	.volume-slider-popup {
		position: absolute;
		bottom: 45px; /* Position above the icon */
		left: 50%;
		transform: translateX(-50%);
		width: 180px; /* Wider for horizontal slider */
		height: 50px; /* Shorter height */
		background-color: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 15px;
		border: 1px solid #e5e5e5;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		z-index: 110;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.play-pause-icon {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		font-size: 26px;
		color: #333;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 60px;
		height: 60px;
	}
</style>