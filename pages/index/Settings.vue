<template>
	<view class="settings-container">
		<!-- Audio Settings -->
		<uni-list>
			<uni-list-item title="Volume">
				<template v-slot:footer>
					<view class="setting-control">
						<slider :value="volume" @change="onVolumeChange" min="0" max="100" step="1" style="width: 150px;"/>
						<text class="value-display">{{ volume }}%</text>
					</view>
				</template>
			</uni-list-item>
			
			<uni-list-item title="Font Size">
				<template v-slot:footer>
					<view class="setting-control">
						<slider :value="fontSize" @change="onFontSizeChange" min="12" max="24" step="1" style="width: 150px;"/>
						<text class="value-display">{{ fontSize }}px</text>
					</view>
				</template>
			</uni-list-item>
			
			<!-- Speed slider with snapping behavior -->
			<uni-list-item title="Speed">
				<template v-slot:footer>
					<view class="setting-control">
						<slider :value="playbackSpeed" @change="onSpeedChange" min="0.85" max="2.0" step="0.01" style="width: 150px;"/>
						<text class="value-display">{{ playbackSpeed.toFixed(2) }}x</text>
					</view>
				</template>
			</uni-list-item>

			<!-- Voice Selection -->
			<uni-list-item title="Voice" showArrow clickable @click="openVoiceActionSheet">
				<template v-slot:footer>
					<text class="selected-value">{{ voice }}</text>
				</template>
			</uni-list-item>
			
			<!-- Background Theme Selection -->
			<uni-list-item title="Background Theme" showArrow clickable @click="openBackgroundActionSheet">
				<template v-slot:footer>
					<view class="setting-control">
						<view class="color-indicator" :style="{ backgroundColor: selectedBackground.color }"></view>
						<text class="selected-value">{{ selectedBackground.name }}</text>
					</view>
				</template>
			</uni-list-item>

			<!-- Listening Mode Selection -->
			<uni-list-item title="Listening Mode" showArrow clickable @click="openListeningModeActionSheet">
				<template v-slot:footer>
					<text class="selected-value">{{ selectedListeningMode }}</text>
				</template>
			</uni-list-item>
		</uni-list>
		
	</view>
</template>

<script>
	// --- ALIGNED: Using the correct settingsCacheService ---
	import settingsCacheService from '@/services/settingsCacheService';

	export default {
		data() {
			return {
				volume: 80,
				voice: 'Female Voice',
				fontSize: 16,
				playbackSpeed: 1.0,
				voiceOptions: ['Female Voice', 'Male Voice', 'News Voice', 'Child Voice'],
				// This object is for the UI, but we'll save only the name string.
				selectedBackground: { name: 'White', color: '#FFFFFF' },
				// These options map the theme names (as stored in the service) to their UI colors.
				backgroundOptions: [
					{ name: 'White', color: '#F8F9FA' },
					{ name: 'Black', color: '#121212' },
					{ name: 'Light Brown', color: '#FAF3E0' }
				],
				selectedListeningMode: 'Once',
				listeningModeOptions: ['Once', 'Repeat'],
				speedAnchors: [0.85, 1.0, 1.2, 1.5, 2.0] // Anchors for speed slider
			};
		},
		onShow() {
			this.loadSettings();
		},
		methods: {
			// --- ALIGNED: Loading settings from settingsCacheService and mapping to data properties ---
			loadSettings() {
				const settings = settingsCacheService.getSettings();
				this.volume = settings.volume;
				this.voice = settings.voice;
				this.fontSize = settings.fontSize;
				this.playbackSpeed = settings.speed;

				// ALIGNED: Load the theme name (string) and find the corresponding object for the UI.
				const themeName = settings.theme;
				this.selectedBackground = this.backgroundOptions.find(opt => opt.name === themeName) || this.backgroundOptions[0];
				
				// ALIGNED: Load the listening mode from the 'SpeakingPerson' key.
				this.selectedListeningMode = settings.SpeakingPerson;
			},
			onVolumeChange(e) {
				this.volume = e.detail.value;
				settingsCacheService.saveVolume(this.volume);
			},
			onFontSizeChange(e) {
				this.fontSize = e.detail.value;
				settingsCacheService.saveFontSize(this.fontSize);
			},
			onSpeedChange(e) {
				const sliderValue = parseFloat(e.detail.value);
				// Find the closest anchor point
				const closestSpeed = this.speedAnchors.reduce((prev, curr) => {
					return (Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev);
				});

				if (this.playbackSpeed !== closestSpeed) {
					this.playbackSpeed = closestSpeed;
					settingsCacheService.saveSpeed(this.playbackSpeed);
				}
			},
			openVoiceActionSheet() {
				uni.showActionSheet({
					itemList: this.voiceOptions,
					success: (res) => {
						this.voice = this.voiceOptions[res.tapIndex];
						settingsCacheService.saveVoice(this.voice);
					}
				});
			},
			// --- ALIGNED: Saving the theme using saveTheme with only the name (string) ---
			openBackgroundActionSheet() {
				const themeNames = this.backgroundOptions.map(theme => theme.name);
				uni.showActionSheet({
					itemList: themeNames,
					success: (res) => {
						// Update the UI with the full object
						this.selectedBackground = this.backgroundOptions[res.tapIndex];
						// Save only the name string, as per the data model
						settingsCacheService.saveTheme(this.selectedBackground.name);
					}
				});
			},
			// --- ALIGNED: Saving the listening mode using saveSpeakingPerson ---
			openListeningModeActionSheet() {
				uni.showActionSheet({
					itemList: this.listeningModeOptions,
					success: (res) => {
						this.selectedListeningMode = this.listeningModeOptions[res.tapIndex];
						settingsCacheService.saveSpeakingPerson(this.selectedListeningMode);
					}
				});
			}
		}
	}
</script>

<style scoped>
	.settings-container {
		padding-bottom: 20px;
	}

	.setting-control {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.value-display {
		font-size: 14px;
		color: #888;
		width: 50px; /* Adjusted width for xx.xx format */
		text-align: right;
	}
	
	.selected-value {
		font-size: 14px;
		color: #888;
	}

	.color-indicator {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 1px solid #e0e0e0;
		margin-right: 5px; 
	}
</style>