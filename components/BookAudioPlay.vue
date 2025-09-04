<template>
	<!-- Main bar now uses dynamic styles -->
	<view class="bottom-bar" @click.stop :style="barStyles">
		<!-- Progress and Time Info -->
		<view class="progress-container">
			<!-- Enhanced progress bar with click/touch support -->
			<view class="progress-wrapper" @click="onProgressClick" @touchstart="onProgressTouchStart" @touchend="onProgressTouchEnd">
				<progress :percent="readProgress" stroke-width="3" :activeColor="sliderActiveColor" :backgroundColor="sliderBackgroundColor"></progress>
			</view>
			<view class="time-info">
				<!-- Text uses dynamic colors -->
				<text class="time-label" :style="{ color: secondaryTextColor }">{{ readProgress.toFixed(0) }}% completed</text>
			</view>
		</view>
		<!-- Player Controls -->
		<view class="player-controls">
			<!-- Left Controls -->
			<view class="side-controls">
				<view class="setting-select-container">
					<!-- Main Settings Popup -->
					<view v-if="settingsMenuVisible" class="menu-popup" :style="popupStyles" @click.stop="">
						<view class="menu-item" @click.stop="showVoiceMenu">
							<text :style="{ color: textColor }">Voice</text>
							<text class="menu-value" :style="{ color: secondaryTextColor }">{{ selectedVoice }}</text>
						</view>
						<view class="menu-item" @click.stop="showFontSizeSlider">
							<text :style="{ color: textColor }">Font Size</text>
							<text class="menu-value" :style="{ color: secondaryTextColor }">{{ fontSize }}px</text>
						</view>
						<view class="menu-item" @click.stop="showSpeedSlider">
							<text :style="{ color: textColor }">Speed</text>
							<text class="menu-value" :style="{ color: secondaryTextColor }">{{ playbackSpeed.toFixed(2) }}x</text>
						</view>
						<view class="menu-item" @click.stop="showBackgroundMenu">
							<text :style="{ color: textColor }">Background</text>
							<view class="color-indicator" :style="{ backgroundColor: selectedBackground.color }"></view>
						</view>
						<view class="menu-item" @click.stop="showRepeatModeMenu">
							<text :style="{ color: textColor }">Repeat Mode</text>
							<text class="menu-value" :style="{ color: secondaryTextColor }">{{ selectedRepeatMode }}</text>
						</view>
					</view>
					
					<!-- Sub-Menus (Voice, Background, Repeat Mode) -->
					<view v-if="voiceMenuVisible || backgroundMenuVisible || repeatModeMenuVisible" class="menu-popup" :style="popupStyles" @click.stop="">
						<!-- Voice -->
						<template v-if="voiceMenuVisible">
							<view v-for="voice in voiceOptions" :key="voice" class="menu-item" @click.stop="onVoiceSelected(voice)">
								<text :style="{ color: textColor }">{{ voice }}</text>
								<text v-if="selectedVoice === voice" class="checkmark" :style="{ color: theme.activeColor }">✔</text>
							</view>
						</template>
						<!-- Background -->
						<template v-if="backgroundMenuVisible">
							<view v-for="themeOption in backgroundOptions" :key="themeOption.name" class="menu-item" @click.stop="onBackgroundSelected(themeOption.name)">
								<text :style="{ color: textColor }">{{ themeOption.name }}</text>
								<view class="color-indicator" :style="{ backgroundColor: themeOption.color }"></view>
								<text v-if="selectedBackground.name === themeOption.name" class="checkmark" :style="{ color: theme.activeColor }">✔</text>
							</view>
						</template>
						<!-- Repeat Mode -->
						<template v-if="repeatModeMenuVisible">
							<view v-for="mode in repeatModeOptions" :key="mode" class="menu-item" @click.stop="onRepeatModeSelected(mode)">
								<text :style="{ color: textColor }">{{ mode }}</text>
								<text v-if="selectedRepeatMode === mode" class="checkmark" :style="{ color: theme.activeColor }">✔</text>
							</view>
						</template>
					</view>
					
					<!-- Slider Popups (Font Size, Speed, Volume) -->
					<view v-if="fontSizeSliderVisible || speedSliderVisible || volumeSliderVisible" class="slider-popup" :style="popupStyles" @click.stop="">
						<!-- Font Size -->
						<template v-if="fontSizeSliderVisible">
							<text class="slider-label" :style="{ color: textColor }">Size</text>
							<slider 
								:value="fontSize" 
								@change="onFontSizeChange" 
								@changing="onFontSizeChange" 
								min="12" 
								max="24" 
								step="1" 
								:activeColor="sliderActiveColor" 
								:backgroundColor="sliderBackgroundColor" 
								block-size="20" 
								class="slider-component"
							/>
							<text class="slider-value" :style="{ color: textColor }">{{ fontSize }}px</text>
						</template>
						<!-- Speed -->
						<template v-if="speedSliderVisible">
							<text class="slider-label" :style="{ color: textColor }">Speed</text>
							<slider 
								:value="playbackSpeed" 
								@change="onSpeedChange" 
								@changing="onSpeedChange" 
								min="0.85" 
								max="2.0" 
								step="0.01" 
								:activeColor="sliderActiveColor" 
								:backgroundColor="sliderBackgroundColor" 
								block-size="20" 
								class="slider-component"
							/>
							<text class="slider-value" :style="{ color: textColor }">{{ playbackSpeed.toFixed(2) }}x</text>
						</template>
						<!-- Volume -->
						<template v-if="volumeSliderVisible">
							<text class="slider-label" :style="{ color: textColor }">Volume</text>
							<slider 
								:value="displayVolume" 
								@change="onSliderChange" 
								@changing="onSliderChange" 
								min="0" 
								max="100" 
								step="1" 
								:activeColor="sliderActiveColor" 
								:backgroundColor="sliderBackgroundColor" 
								block-size="20" 
								class="slider-component"
							/>
							<text class="slider-value" :style="{ color: textColor }">{{ displayVolume }}%</text>
						</template>
					</view>
					
					<!-- Icons use dynamic colors -->
					<uni-icons type="gear" size="26" :color="iconColor" @click.stop="toggleSettingsMenu"></uni-icons>	
				</view>
				
				<view class="volume-control-container">
					<uni-icons type="sound" size="26" :color="iconColor" @click.stop="toggleVolumeSlider"></uni-icons>
				</view>
			</view>
			
			<!-- Center Control -->
			<view class="center-control">
				<text class="play-pause-icon" @click.stop="onTogglePlay" :style="{ color: playPauseColor }">{{ isPlaying ? '⏸' : '▶' }}</text>
			</view>

			<!-- Right Controls -->
			<view class="side-controls right">
				<uni-icons type="forward" size="26" :color="iconColor" @click.stop="onNextChapter"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script>
// ALIGNED: Import the correct settingsCacheService
import settingsCacheService from '@/services/settingsCacheService';

export default {
	name: 'BookAudioPlay',
	props: {
		readProgress: { 
			type: Number, 
			default: 0 
		},
		isPlaying: { 
			type: Boolean, 
			default: false 
		},
		theme: {
			type: Object,
			default: () => ({ 
				backgroundColor: '#FFFFFF', 
				primaryTextColor: '#333333', 
				secondaryTextColor: '#666666',
				activeColor: '#007AFF',
				borderColor: '#E5E5E5'
			})
		}
	},
	emits: [
		'toggle-play',
		'next-chapter', 
		'volume-change',
		'font-size-change',
		'speed-change',
		'voice-changed',
		'background-changed',
		'repeat-mode-changed',
		'progress-changed'  // New emit for progress bar interactions
	],
	data() {
		return {
			// Menu visibility states
			settingsMenuVisible: false, 
			voiceMenuVisible: false, 
			volumeSliderVisible: false,
			fontSizeSliderVisible: false, 
			speedSliderVisible: false, 
			backgroundMenuVisible: false,
			repeatModeMenuVisible: false,
			
			// Audio settings
			displayVolume: 80, 
			selectedVoice: 'Female',
			voiceOptions: [],
			
			// Display settings
			fontSize: 16, 
			playbackSpeed: 1.0, 
			speedAnchors: [],
			
			// Theme settings
			selectedBackground: { name: 'White', color: '#F8F9FA' },
			// ALIGNED: Background options are now fetched from the settings service
			backgroundOptions: [],
			
			// Repeat settings
			selectedRepeatMode: 'Once', 
			repeatModeOptions: []
		};
	},
	computed: {
		barStyles() {
			return {
				backgroundColor: this.theme.navBar?.backgroundColor ? (this.theme.navBar.backgroundColor.replace(')', ', 0.9)').replace('rgb', 'rgba')) : 'rgba(255, 255, 255, 0.9)',
				borderTopColor: this.theme.borderColor || '#e5e5e5'
			};
		},
		textColor() { 
			return this.theme.primaryTextColor; 
		},
		secondaryTextColor() { 
			return this.theme.secondaryTextColor; 
		},
		iconColor() { 
			return this.theme.primaryTextColor; 
		},
		playPauseColor() { 
			return this.theme.activeColor; 
		},
		popupStyles() {
			return {
				backgroundColor: this.theme.navBar?.backgroundColor ? (this.theme.navBar.backgroundColor.replace(')', ', 0.95)').replace('rgb', 'rgba')) : 'rgba(255, 255, 255, 0.95)',
				borderColor: this.theme.borderColor || '#e5e5e5'
			};
		},
		sliderActiveColor() { 
			return this.theme.activeColor; 
		},
		sliderBackgroundColor() { 
			const isDark = this.theme.backgroundColor === '#121212';
			return isDark ? '#555555' : '#E5E5E5'; 
		}
	},
	created() {
		// ALIGNED: Fetch themes from the service first
		this.backgroundOptions = settingsCacheService.getAllThemes().map(themeName => {
			const themeContent = settingsCacheService.getThemeContent(themeName);
			return { name: themeName, color: themeContent.backgroundColor };
		});
		
		this.voiceOptions = settingsCacheService.getVoiceOptions();
		this.repeatModeOptions = settingsCacheService.getRepeatModeOptions();
		this.speedAnchors = settingsCacheService.getSpeedAnchors();
		
		// Now load settings, which depends on backgroundOptions being populated
		this.loadSettings();
	},
	methods: {
		loadSettings() {
			try {
				const settings = settingsCacheService.getSettings();
				this.displayVolume = settings.volume || 80;
				this.selectedVoice = settings.voice || 'Female';
				this.fontSize = settings.fontSize || 16;
				this.playbackSpeed = settings.audioSpeed || 1.0;
				
				// Map theme name to background object for UI consistency
				const themeName = settings.theme || 'White';
				this.selectedBackground = this.backgroundOptions.find(opt => opt.name === themeName) || this.backgroundOptions[0];
				this.selectedRepeatMode = settings.repeatMode || 'Once';
				
				// Emit initial values to parent
				this.$emit('volume-change', this.displayVolume);
				this.$emit('font-size-change', this.fontSize);
				this.$emit('background-changed', this.selectedBackground.name);
			} catch (error) {
				console.error('Failed to load settings:', error);
			}
		},
		
		// Menu management
		closeAllPopups() {
			this.settingsMenuVisible = false; 
			this.voiceMenuVisible = false; 
			this.volumeSliderVisible = false;
			this.fontSizeSliderVisible = false; 
			this.speedSliderVisible = false;
			this.backgroundMenuVisible = false; 
			this.repeatModeMenuVisible = false;
		},
		
		toggleSettingsMenu() {
			const isAnySubmenuVisible = this.voiceMenuVisible || this.fontSizeSliderVisible || 
				this.speedSliderVisible || this.backgroundMenuVisible || this.repeatModeMenuVisible;
			const isMainVisible = this.settingsMenuVisible;
			this.closeAllPopups();
			if (!isMainVisible && !isAnySubmenuVisible) {
				this.settingsMenuVisible = true;
			}
		},
		
		toggleVolumeSlider() {
			const isAlreadyVisible = this.volumeSliderVisible;
			this.closeAllPopups();
			this.volumeSliderVisible = !isAlreadyVisible;
		},
		
		// Submenu navigation
		showVoiceMenu() { 
			this.settingsMenuVisible = false; 
			this.voiceMenuVisible = true; 
		},
		showFontSizeSlider() { 
			this.settingsMenuVisible = false; 
			this.fontSizeSliderVisible = true; 
		},
		showSpeedSlider() { 
			this.settingsMenuVisible = false; 
			this.speedSliderVisible = true; 
		},
		showBackgroundMenu() { 
			this.settingsMenuVisible = false; 
			this.backgroundMenuVisible = true; 
		},
		showRepeatModeMenu() { 
			this.settingsMenuVisible = false; 
			this.repeatModeMenuVisible = true; 
		},
		
		// ALIGNED: Save settings using settingsCacheService
		onVoiceSelected(voice) {
			this.selectedVoice = voice; 
			try {
				settingsCacheService.saveVoice(voice);
				this.$emit('voice-changed', voice);
			} catch (error) {
				console.error('Failed to save voice setting:', error);
			}
			this.voiceMenuVisible = false;
		},
		
		onBackgroundSelected(themeName) {
			const themeOption = this.backgroundOptions.find(opt => opt.name === themeName);
			if (themeOption) {
				this.selectedBackground = themeOption;
				try {
					settingsCacheService.saveTheme(themeName);
					this.$emit('background-changed', themeName);
				} catch (error) {
					console.error('Failed to save theme setting:', error);
				}
			}
			this.backgroundMenuVisible = false;
		},
		
		onRepeatModeSelected(mode) {
			this.selectedRepeatMode = mode; 
			try {
				settingsCacheService.saveRepeatMode(mode);
				this.$emit('repeat-mode-changed', mode);
			} catch (error) {
				console.error('Failed to save repeat mode:', error);
			}
			this.repeatModeMenuVisible = false;
		},
		
		// Player controls
		onTogglePlay() { 
			this.$emit('toggle-play'); 
		},
		
		onNextChapter() { 
			this.$emit('next-chapter'); 
		},
		
		// Slider controls
		onSliderChange(event) {
			const finalVolume = parseInt(event.detail.value, 10);
			if (!isNaN(finalVolume) && finalVolume >= 0 && finalVolume <= 100) {
				this.displayVolume = finalVolume;
				try {
					settingsCacheService.saveVolume(finalVolume);
					this.$emit('volume-change', finalVolume);
				} catch (error) {
					console.error('Failed to save volume setting:', error);
				}
			}
		},
		
		onFontSizeChange(event) {
			const newSize = parseInt(event.detail.value, 10);
			if (!isNaN(newSize) && newSize >= 12 && newSize <= 24) {
				this.fontSize = newSize;
				try {
					settingsCacheService.saveFontSize(newSize);
					this.$emit('font-size-change', newSize);
				} catch (error) {
					console.error('Failed to save font size setting:', error);
				}
			}
		},
		
		onSpeedChange(event) {
			const sliderValue = parseFloat(event.detail.value);
			if (!isNaN(sliderValue)) {
				// Find the closest anchor point for better UX
				const closestSpeed = this.speedAnchors.reduce((prev, curr) => 
					(Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev)
				);
				
				if (this.playbackSpeed !== closestSpeed) {
					this.playbackSpeed = closestSpeed;
					try {
						settingsCacheService.saveAudioSpeed(closestSpeed);
						this.$emit('speed-change', closestSpeed);
					} catch (error) {
						console.error('Failed to save speed setting:', error);
					}
				}
			}
		},
		
		// Progress bar interaction methods
		onProgressClick(event) {
			this.handleProgressInteraction(event);
		},
		
		onProgressTouchStart(event) {
			// For touch devices, we can handle touch interactions
			this.handleProgressInteraction(event);
		},
		
		onProgressTouchEnd(event) {
			// Additional handling for touch end if needed
		},
		
		handleProgressInteraction(event) {
			// Calculate the new progress based on click/touch position
			const progressElement = event.currentTarget;
			const rect = progressElement.getBoundingClientRect ? progressElement.getBoundingClientRect() : null;
			
			if (!rect) {
				// Fallback for uni-app environments where getBoundingClientRect might not be available
				console.warn('Unable to calculate progress position on this platform');
				return;
			}
			
			const clickX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
			const relativeX = clickX - rect.left;
			const progressWidth = rect.width;
			const newProgress = Math.min(100, Math.max(0, (relativeX / progressWidth) * 100));
			
			// Emit the progress change to the parent component
			this.$emit('progress-changed', newProgress);
		}
	}
}
</script>

<style scoped>
	.bottom-bar {
		position: fixed; 
		left: 0; 
		right: 0; 
		bottom: 0;
		backdrop-filter: blur(10px); 
		-webkit-backdrop-filter: blur(10px);
		z-index: 100; 
		padding: 10px 15px;
		padding-bottom: calc(var(--safe-area-inset-bottom) + 10px);
		display: flex; 
		flex-direction: column;
		transition: background-color 0.3s ease, border-color 0.3s ease;
		border-top: 1px solid;
	}
	
	.progress-container, .player-controls { 
		width: 100%; 
	}
	
	.progress-container { 
		margin-bottom: 10px; 
	}
	
	.progress-wrapper {
		position: relative;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		padding: 5px 0; /* Add some padding to make it easier to tap */
	}
	
	.time-info { 
		display: flex; 
		justify-content: space-between; 
		align-items: center; 
		margin-top: 5px; 
	}
	
	.time-label { 
		font-size: 12px; 
	}
	
	.player-controls { 
		display: flex; 
		justify-content: space-between; 
		align-items: center; 
	}
	
	.side-controls { 
		display: flex; 
		align-items: center; 
		flex: 1; 
		gap: 20px; 
	}
	
	.side-controls.right { 
		justify-content: flex-end; 
	}
	
	.center-control { 
		display: flex; 
		justify-content: center; 
		align-items: center; 
		flex-shrink: 0; 
	}
	
	.setting-select-container, .volume-control-container { 
		position: relative; 
		display: flex; 
		align-items: center; 
		justify-content: center; 
	}
	
	.slider-popup, .menu-popup {
		position: absolute; 
		bottom: 45px; 
		left: 0; 
		transform: translateX(0);
		backdrop-filter: blur(10px); 
		-webkit-backdrop-filter: blur(10px);
		border-radius: 15px;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); 
		z-index: 110;
		border: 1px solid;
	}

	.slider-popup {
		width: 260px; 
		height: 50px; 
		display: flex;
		justify-content: space-between; 
		align-items: center;
		padding: 0 15px; 
		box-sizing: border-box;
	}

	.slider-label, .slider-value { 
		font-size: 14px; 
		flex-shrink: 0; 
	}
	
	.slider-value { 
		min-width: 45px; 
		text-align: right; 
	}
	
	.slider-component {
		flex-grow: 1; 
		margin: 0 10px;
	}

	.menu-popup { 
		width: 220px; 
		border-radius: 10px; 
		overflow: hidden; 
	}
	
	.menu-item {
		padding: 12px 15px; 
		font-size: 14px; 
		display: flex;
		justify-content: space-between; 
		align-items: center;
		border-bottom: 1px solid rgba(120, 120, 120, 0.1);
		cursor: pointer; 
		transition: background-color 0.2s;
	}
	
	.menu-item:last-child { 
		border-bottom: none; 
	}
	
	.menu-item:active { 
		background-color: rgba(120, 120, 120, 0.1); 
	}
	
	.menu-item .checkmark { 
		font-weight: bold; 
		margin-left: auto; 
	}
	
	.menu-item .menu-value { 
		font-size: 13px; 
	}
	
	.play-pause-icon {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		font-size: 28px;
		display: flex; 
		justify-content: center; 
		align-items: center;
		width: 60px; 
		height: 60px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}
	
	.color-indicator { 
		width: 20px; 
		height: 20px; 
		border-radius: 50%; 
		border: 1px solid rgba(120, 120, 120, 0.3); 
	}

	/* Ensure icons are clickable */
	uni-icons {
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}
</style>