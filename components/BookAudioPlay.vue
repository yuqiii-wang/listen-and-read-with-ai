<template>
	<!-- Main bar now uses dynamic styles -->
	<view class="bottom-bar" @click.stop :style="barStyles">
		<!-- Progress and Time Info -->
		<view class="progress-container">
			<!-- Sliders use dynamic colors -->
			<progress :percent="readProgress" stroke-width="3" :activeColor="sliderActiveColor" :backgroundColor="sliderBackgroundColor"></progress>
			<view class="time-info">
				<!-- Text uses dynamic colors -->
				<text class="time-label" :style="{ color: secondaryTextColor }">{{ currentTime }}</text>
				<text class="time-label" :style="{ color: secondaryTextColor }">Est. {{ estimatedReadTime }} min read</text>
			</view>
		</view>
		<!-- Player Controls -->
		<view class="player-controls">
			<!-- Left Controls -->
			<view class="side-controls">
				<view class="setting-select-container">
					<!-- Main Settings Popup -->
					<view v-if="settingsMenuVisible" class="menu-popup" :style="popupStyles">
						<view class="menu-item" @click.stop="showVoiceMenu"><text :style="{ color: textColor }">Voice</text><text class="menu-value" :style="{ color: secondaryTextColor }">{{ selectedVoice }}</text></view>
						<view class="menu-item" @click.stop="showFontSizeSlider"><text :style="{ color: textColor }">Font Size</text><text class="menu-value" :style="{ color: secondaryTextColor }">{{ fontSize }}px</text></view>
						<view class="menu-item" @click.stop="showSpeedSlider"><text :style="{ color: textColor }">Speed</text><text class="menu-value" :style="{ color: secondaryTextColor }">{{ playbackSpeed.toFixed(2) }}x</text></view>
						<view class="menu-item" @click.stop="showBackgroundMenu"><text :style="{ color: textColor }">Background</text><view class="color-indicator" :style="{ backgroundColor: selectedBackground.color }"></view></view>
						<view class="menu-item" @click.stop="showListeningModeMenu"><text :style="{ color: textColor }">Listen Mode</text><text class="menu-value" :style="{ color: secondaryTextColor }">{{ selectedListeningMode }}</text></view>
					</view>
					
					<!-- Sub-Menus (Voice, Background, Listening Mode) -->
					<view v-if="voiceMenuVisible || backgroundMenuVisible || listeningModeMenuVisible" class="menu-popup" :style="popupStyles">
						<!-- Voice -->
						<template v-if="voiceMenuVisible">
							<view v-for="voice in voiceOptions" :key="voice" class="menu-item" @click.stop="onVoiceSelected(voice)">
								<text :style="{ color: textColor }">{{ voice }}</text>
								<text v-if="selectedVoice === voice" class="checkmark" :style="{ color: theme.actionColor }">✔</text>
							</view>
						</template>
						<!-- Background -->
						<template v-if="backgroundMenuVisible">
							<view v-for="theme in backgroundOptions" :key="theme.name" class="menu-item" @click.stop="onBackgroundSelected(theme)">
								<text :style="{ color: textColor }">{{ theme.name }}</text>
								<view class="color-indicator" :style="{ backgroundColor: theme.color }"></view>
								<text v-if="selectedBackground.name === theme.name" class="checkmark" :style="{ color: theme.actionColor }">✔</text>
							</view>
						</template>
						<!-- Listening Mode -->
						<template v-if="listeningModeMenuVisible">
							<view v-for="mode in listeningModeOptions" :key="mode" class="menu-item" @click.stop="onListeningModeSelected(mode)">
								<text :style="{ color: textColor }">{{ mode }}</text>
								<text v-if="selectedListeningMode === mode" class="checkmark" :style="{ color: theme.actionColor }">✔</text>
							</view>
						</template>
					</view>
					
					<!-- Slider Popups (Font Size, Speed, Volume) -->
					<view v-if="fontSizeSliderVisible || speedSliderVisible || volumeSliderVisible" class="slider-popup" :style="popupStyles">
						<!-- Font Size -->
						<template v-if="fontSizeSliderVisible">
							<text class="slider-label" :style="{ color: textColor }">Size</text>
							<slider :value="fontSize" @change="onFontSizeChange" min="12" max="24" step="1" :activeColor="sliderActiveColor" :backgroundColor="sliderBackgroundColor" block-size="20" style="flex-grow: 1; margin: 0 10px;" />
							<text class="slider-value" :style="{ color: textColor }">{{ fontSize }}px</text>
						</template>
						<!-- Speed -->
						<template v-if="speedSliderVisible">
							<text class="slider-label" :style="{ color: textColor }">Speed</text>
							<slider :value="playbackSpeed" @change="onSpeedChange" min="0.85" max="2.0" step="0.01" :activeColor="sliderActiveColor" :backgroundColor="sliderBackgroundColor" block-size="20" style="flex-grow: 1; margin: 0 10px;" />
							<text class="slider-value" :style="{ color: textColor }">{{ playbackSpeed.toFixed(2) }}x</text>
						</template>
						<!-- Volume -->
						<template v-if="volumeSliderVisible">
							<text class="slider-label" :style="{ color: textColor }">Volume</text>
							<slider :value="displayVolume" @change="onSliderChange" min="0" max="100" step="1" :activeColor="sliderActiveColor" :backgroundColor="sliderBackgroundColor" block-size="20" style="flex-grow: 1; margin: 0 10px;" />
							<text class="slider-value" :style="{ color: textColor }">{{ displayVolume }}%</text>
						</template>
					</view>
					
					<!-- Icons use dynamic colors -->
					<uni-icons type="more" size="26" :color="iconColor" @click.stop="toggleSettingsMenu"></uni-icons>	
				</view>
				
				<view class="volume-control-container">
					<uni-icons type="sound" size="26" :color="iconColor" @click.stop="toggleVolumeSlider"></uni-icons>
				</view>
			</view>
			
			<!-- Center Control -->
			<view class="center-control">
				<text class="play-pause-icon" @click.stop="onTogglePlay" :style="{ color: playPauseColor }">{{ isPlaying ? '⏸\uFE0E' : '▶' }}</text>
			</view>

			<!-- Right Controls -->
			<view class="side-controls right">
				<uni-icons type="forward" size="26" :color="iconColor" @click.stop="onNextChapter"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script>
import settingsService from '@/services/settingsService';
export default {
	name: 'BookAudioPlay',
	props: {
		readProgress: { type: Number, default: 0 },
		currentTime: { type: String, default: '0:00' },
		estimatedReadTime: { type: Number, default: 0 },
		isPlaying: { type: Boolean, default: false },
		// *** NEW: Receive theme from parent ***
		theme: {
			type: Object,
			default: () => ({ name: 'White', color: '#FFFFFF', textColor: '#333333', actionColor: '#007AFF' })
		}
	},
	data() {
		return {
			settingsMenuVisible: false, voiceMenuVisible: false, volumeSliderVisible: false,
			fontSizeSliderVisible: false, speedSliderVisible: false, backgroundMenuVisible: false,
			listeningModeMenuVisible: false, displayVolume: 80, selectedVoice: 'Female Voice',
			voiceOptions: ['Male Voice', 'Female Voice', 'Child Voice', 'News Voice'],
			fontSize: 16, playbackSpeed: 1.0, speedAnchors: [0.85, 1.0, 1.2, 1.5, 2.0],
			selectedBackground: { name: 'White', color: '#FFFFFF' },
			backgroundOptions: [
				{ name: 'White', color: '#FFFFFF' }, { name: 'Black', color: '#121212' },
				{ name: 'Light Brown', color: '#f5efdc' }
			],
			selectedListeningMode: 'Once', listeningModeOptions: ['Once', 'Repeat']
		};
	},
	// *** NEW: Computed properties for dynamic styling ***
	computed: {
		barStyles() {
			return this.theme.name === 'Black' ? {
				backgroundColor: 'rgba(25, 25, 25, 0.9)', borderTopColor: 'rgba(255, 255, 255, 0.15)'
			} : {
				backgroundColor: 'rgba(255, 255, 255, 0.9)', borderTopColor: '#e5e5e5'
			};
		},
		textColor() { return this.theme.textColor; },
		secondaryTextColor() { return this.theme.name === 'Black' ? '#999999' : '#666666'; },
		iconColor() { return this.theme.textColor; },
		playPauseColor() { return this.theme.actionColor; },
		popupStyles() {
			return this.theme.name === 'Black' ? {
				backgroundColor: 'rgba(50, 50, 50, 0.95)', borderColor: 'rgba(255, 255, 255, 0.2)'
			} : {
				backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#e5e5e5'
			};
		},
		sliderActiveColor() { return this.theme.actionColor; },
		sliderBackgroundColor() { return this.theme.name === 'Black' ? '#555555' : '#E5E5E5'; }
	},
	created() {
		this.loadSettings();
	},
	methods: {
		loadSettings() {
			const { volume, voice, fontSize, speed, background, listeningMode } = settingsService.getSettings();
			this.displayVolume = volume; this.selectedVoice = voice; this.fontSize = fontSize;
			this.playbackSpeed = speed; this.selectedBackground = background || this.backgroundOptions[0];
			this.selectedListeningMode = listeningMode || this.listeningModeOptions[0];
			
			// Emit initial values in case they differ from parent's defaults
			this.$emit('volume-change', this.displayVolume);
			this.$emit('font-size-change', this.fontSize);
			this.$emit('background-changed', this.selectedBackground);
		},
		closeAllPopups() {
			this.settingsMenuVisible = false; this.voiceMenuVisible = false; this.volumeSliderVisible = false;
			this.fontSizeSliderVisible = false; this.speedSliderVisible = false;
			this.backgroundMenuVisible = false; this.listeningModeMenuVisible = false;
		},
		toggleSettingsMenu() {
			const isAnySubmenuVisible = this.voiceMenuVisible || this.fontSizeSliderVisible || this.speedSliderVisible || this.backgroundMenuVisible || this.listeningModeMenuVisible;
			const isMainVisible = this.settingsMenuVisible;
			this.closeAllPopups();
			if (!isMainVisible && !isAnySubmenuVisible) this.settingsMenuVisible = true;
		},
		toggleVolumeSlider() {
			const isAlreadyVisible = this.volumeSliderVisible;
			this.closeAllPopups();
			this.volumeSliderVisible = !isAlreadyVisible;
		},
		showVoiceMenu() { this.settingsMenuVisible = false; this.voiceMenuVisible = true; },
		showFontSizeSlider() { this.settingsMenuVisible = false; this.fontSizeSliderVisible = true; },
		showSpeedSlider() { this.settingsMenuVisible = false; this.speedSliderVisible = true; },
		showBackgroundMenu() { this.settingsMenuVisible = false; this.backgroundMenuVisible = true; },
		showListeningModeMenu() { this.settingsMenuVisible = false; this.listeningModeMenuVisible = true; },
		onVoiceSelected(voice) {
			this.selectedVoice = voice; settingsService.saveVoice(voice); this.$emit('voice-changed', voice);
			this.voiceMenuVisible = false;
		},
		onBackgroundSelected(theme) {
			this.selectedBackground = theme; settingsService.saveBackground(theme);
			// *** CRITICAL: Emit the change to the parent ***
			this.$emit('background-changed', theme);
			this.backgroundMenuVisible = false;
		},
		onListeningModeSelected(mode) {
			this.selectedListeningMode = mode; settingsService.saveListeningMode(mode);
			this.$emit('listening-mode-changed', mode); this.listeningModeMenuVisible = false;
		},
		onTogglePlay() { this.$emit('toggle-play'); },
		onNextChapter() { this.$emit('next-chapter'); },
		onSliderChange(event) {
			const finalVolume = parseInt(event.detail.value, 10);
			if (!isNaN(finalVolume)) {
				this.displayVolume = finalVolume; settingsService.saveVolume(finalVolume);
				this.$emit('volume-change', finalVolume);
			}
		},
		onFontSizeChange(event) {
			const newSize = parseInt(event.detail.value, 10);
			this.fontSize = newSize; settingsService.saveFontSize(newSize);
			// *** CRITICAL: Emit the change to the parent ***
			this.$emit('font-size-change', newSize);
		},
		onSpeedChange(event) {
			const sliderValue = parseFloat(event.detail.value);
			const closestSpeed = this.speedAnchors.reduce((p, c) => (Math.abs(c - sliderValue) < Math.abs(p - sliderValue) ? c : p));
			if (this.playbackSpeed !== closestSpeed) {
				this.playbackSpeed = closestSpeed; settingsService.saveSpeed(closestSpeed);
				this.$emit('speed-change', closestSpeed);
			}
		}
	}
}
</script>

<style scoped>
	/* Styles are now cleaner, with colors removed */
	.bottom-bar {
		position: fixed; left: 0; right: 0; bottom: 0;
		backdrop-filter: blur(10px); z-index: 100; padding: 10px 15px;
		padding-bottom: calc(var(--safe-area-inset-bottom) + 10px);
		display: flex; flex-direction: column;
		/* background-color and border-top are now dynamic */
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}
	.progress-container, .player-controls { width: 100%; }
	.progress-container { margin-bottom: 10px; }
	.time-info { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
	.time-label { font-size: 12px; /* color is dynamic */ }
	.player-controls { display: flex; justify-content: space-between; align-items: center; }
	.side-controls { display: flex; align-items: center; flex: 1; gap: 20px; }
	.side-controls.right { justify-content: flex-end; }
	.center-control { display: flex; justify-content: center; align-items: center; flex-shrink: 0; }
	.setting-select-container, .volume-control-container { position: relative; display: flex; align-items: center; justify-content: center; }
	
	.slider-popup, .menu-popup {
		position: absolute; bottom: 45px; left: 50%; transform: translateX(5%);
		backdrop-filter: blur(10px); border-radius: 15px;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); z-index: 110;
		/* background-color and border are dynamic */
	}

	.slider-popup {
		width: 260px; height: 50px; display: flex;
		justify-content: space-between; align-items: center;
		padding: 0 15px; box-sizing: border-box;
	}

	.slider-label, .slider-value { font-size: 14px; flex-shrink: 0; /* color is dynamic */ }
	.slider-value { min-width: 45px; text-align: right; }

	.menu-popup { width: 220px; border-radius: 10px; overflow: hidden; }
	.menu-item {
		padding: 12px 15px; font-size: 14px; display: flex;
		justify-content: space-between; align-items: center;
		border-bottom: 1px solid rgba(120, 120, 120, 0.1); /* A subtle border that works on light/dark */
		cursor: pointer; transition: background-color 0.2s;
	}
	.menu-item:last-child { border-bottom: none; }
	.menu-item:active { background-color: rgba(120, 120, 120, 0.1); }
	.menu-item .checkmark { font-weight: bold; margin-left: auto; }
	.menu-item .menu-value { font-size: 13px; /* color is dynamic */ }
	
	.play-pause-icon {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		font-size: 26px; /* color is dynamic */
		display: flex; justify-content: center; align-items: center;
		width: 60px; height: 60px;
	}
	.color-indicator { width: 20px; height: 20px; border-radius: 50%; border: 1px solid rgba(120, 120, 120, 0.3); }
</style>