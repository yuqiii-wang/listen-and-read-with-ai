<template>
	<view class="settings-container" :style="{ backgroundColor: themeStyles.backgroundColor }">
		<!-- Audio Settings -->
		<uni-list :border="false">
			<uni-list-item title="Volume" :border="false">
				<template v-slot:footer>
					<view class="setting-control">
						<slider :value="volume" @change="onVolumeChange" min="0" max="100" step="1" style="width: 150px;"/>
						<text class="value-display" :style="{ color: themeStyles.secondaryTextColor }">{{ volume }}%</text>
					</view>
				</template>
			</uni-list-item>
			
			<uni-list-item title="Font Size" :border="false">
				<template v-slot:footer>
					<view class="setting-control">
						<slider :value="fontSize" @change="onFontSizeChange" min="12" max="24" step="1" style="width: 150px;"/>
						<text class="value-display" :style="{ color: themeStyles.secondaryTextColor }">{{ fontSize }}px</text>
					</view>
				</template>
			</uni-list-item>
			
			<!-- Speed slider with snapping behavior -->
			<uni-list-item title="Speed" :border="false">
				<template v-slot:footer>
					<view class="setting-control">
						<slider :value="playbackSpeed" @change="onSpeedChange" min="0.85" max="2.0" step="0.01" style="width: 150px;"/>
						<text class="value-display" :style="{ color: themeStyles.secondaryTextColor }">{{ playbackSpeed.toFixed(2) }}x</text>
					</view>
				</template>
			</uni-list-item>

			<!-- Voice Selection -->
			<uni-list-item title="Voice" showArrow clickable @click="openVoiceActionSheet" :border="false">
				<template v-slot:footer>
					<text class="selected-value" :style="{ color: themeStyles.secondaryTextColor }">{{ voice }}</text>
				</template>
			</uni-list-item>
			
			<!-- Background Theme Selection -->
			<uni-list-item title="Background Theme" showArrow clickable @click="openBackgroundActionSheet" :border="false">
				<template v-slot:footer>
					<view class="setting-control">
						<view class="color-indicator" :style="{ backgroundColor: selectedBackground.color }"></view>
						<text class="selected-value" :style="{ color: themeStyles.secondaryTextColor }">{{ selectedBackground.name }}</text>
					</view>
				</template>
			</uni-list-item>

			<!-- Listening Mode Selection -->
			<uni-list-item title="Listening Mode" showArrow clickable @click="openListeningModeActionSheet" :border="false">
				<template v-slot:footer>
					<text class="selected-value" :style="{ color: themeStyles.secondaryTextColor }">{{ selectedListeningMode }}</text>
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
				voice: '',
				fontSize: 16,
				playbackSpeed: 1.0,
				voiceOptions: [],
				selectedBackground: { name: 'White', color: '#FFFFFF' },
				backgroundOptions: [],
				selectedListeningMode: 'Once',
				listeningModeOptions: [],
				speedAnchors: [], 
				themeStyles: {}
			};
		},
		onShow() {
			this.loadAndApplyTheme();
			this.loadAllSettings();
		},
		methods: {
			loadAndApplyTheme() {
				const settings = settingsCacheService.getSettings();
				this.themeStyles = settingsCacheService.getThemeContent(settings.theme);
				
				// Set navigation bar styles based on the current theme
				uni.setNavigationBarColor({
					frontColor: this.themeStyles.navBar.textColor,
					backgroundColor: this.themeStyles.navBar.backgroundColor
				});
				uni.setNavigationBarTitle({
					title: 'Settings'
				});
			},
			
			loadAllSettings() {
				// Load all settings values
				const settings = settingsCacheService.getSettings();
				this.volume = settings.volume;
				this.voice = settings.voice;
				this.fontSize = settings.fontSize;
				this.playbackSpeed = settings.audioSpeed;
				this.selectedListeningMode = settings.repeatMode;

				// Load all options from the service
				this.voiceOptions = settingsCacheService.getVoiceOptions();
				this.listeningModeOptions = settingsCacheService.getRepeatModeOptions();
				this.speedAnchors = settingsCacheService.getSpeedAnchors();
				this.backgroundOptions = settingsCacheService.getAllThemes().map(themeName => {
					const themeContent = settingsCacheService.getThemeContent(themeName);
					return { name: themeName, color: themeContent.backgroundColor };
				});

				// Set the selected background based on the loaded theme
				const themeName = settings.theme;
				this.selectedBackground = this.backgroundOptions.find(opt => opt.name === themeName) || this.backgroundOptions[0];
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
				const closestSpeed = this.speedAnchors.reduce((prev, curr) => {
					return (Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev);
				});

				if (this.playbackSpeed !== closestSpeed) {
					this.playbackSpeed = closestSpeed;
					settingsCacheService.saveAudioSpeed(this.playbackSpeed);
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
			
			openBackgroundActionSheet() {
				const themeNames = this.backgroundOptions.map(theme => theme.name);
				uni.showActionSheet({
					itemList: themeNames,
					success: (res) => {
						this.selectedBackground = this.backgroundOptions[res.tapIndex];
						settingsCacheService.saveTheme(this.selectedBackground.name);
						this.loadAndApplyTheme(); // Reload theme to apply changes
						uni.$emit('themeChanged'); 
					}
				});
			},
			
			openListeningModeActionSheet() {
				uni.showActionSheet({
					itemList: this.listeningModeOptions,
					success: (res) => {
						this.selectedListeningMode = this.listeningModeOptions[res.tapIndex];
						settingsCacheService.saveRepeatMode(this.selectedListeningMode);
					}
				});
			}
		}
	}
</script>

<style scoped>
	.settings-container {
		padding-bottom: 20px;
		min-height: 100vh;
	}

	.setting-control {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.value-display {
		font-size: 14px;
		width: 50px; /* Adjusted width for xx.xx format */
		text-align: right;
	}
	
	.selected-value {
		font-size: 14px;
	}

	.color-indicator {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 1px solid #e0e0e0;
		margin-right: 5px; 
	}
</style>